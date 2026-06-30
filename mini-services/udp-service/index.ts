// UDP Protocol Simulation Mini-Service
// Educational simulation of UDP datagram behavior: connectionless, no handshake, packet loss, out-of-order delivery

type Scenario = "dns" | "streaming" | "voip" | "gaming";

interface SimulateRequest {
  source: string;
  destination: string;
  payload?: string;
  scenario?: Scenario;
}

interface SimEvent {
  step: number;
  type: "DATAGRAM" | "TIMEOUT" | "REASSEMBLY" | "BROADCAST";
  src: string;
  dst: string;
  size: number;
  timestamp: number;
  status: "SENT" | "RECEIVED" | "LOST" | "OUT_OF_ORDER" | "REASSEMBLED" | "TIMEOUT";
  ttl?: number;
  reason?: string;
  sequenceNumber?: number;
  fragmentOffset?: number;
  moreFragments?: boolean;
}

interface SimStats {
  sent: number;
  received: number;
  lost: number;
  lossRate: number;
  avgLatency: number;
  outOfOrder: number;
}

interface SimulateResponse {
  simulationId: string;
  scenario: Scenario;
  events: SimEvent[];
  stats: SimStats;
}

interface BroadcastRequest {
  source: string;
  message: string;
  targets: string[];
}

interface BroadcastEvent {
  step: number;
  target: string;
  status: "DELIVERED" | "LOST";
  timestamp: number;
  size: number;
  reason?: string;
}

interface CompareRequest {
  scenario: string;
  dataSize: number;
  packets: number;
}

// ── In-memory state ──────────────────────────────────────────────────────────

const simulationHistory = new Map<string, SimulateResponse>();
let totalDatagramsSent = 0;
let totalDatagramsReceived = 0;
let totalDatagramsLost = 0;
let totalLatencySum = 0;
let totalLatencyCount = 0;
let scenariosRun = 0;
let simCounter = 0;

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function scenarioConfig(scenario: Scenario) {
  switch (scenario) {
    case "dns":
      return {
        packetCount: randomBetween(1, 4),
        sizeRange: [28, 512] as [number, number],
        lossRate: 0.005,
        avgLatency: 15,
        latencyJitter: 10,
        outOfOrderChance: 0.05,
        description: "DNS Query/Response",
      };
    case "streaming":
      return {
        packetCount: randomBetween(20, 50),
        sizeRange: [1024, 1500] as [number, number],
        lossRate: 0.02,
        avgLatency: 30,
        latencyJitter: 20,
        outOfOrderChance: 0.1,
        description: "Media Streaming",
      };
    case "voip":
      return {
        packetCount: randomBetween(30, 80),
        sizeRange: [20, 200] as [number, number],
        lossRate: 0.03,
        avgLatency: 20,
        latencyJitter: 15,
        outOfOrderChance: 0.15,
        description: "VoIP Audio",
      };
    case "gaming":
      return {
        packetCount: randomBetween(15, 40),
        sizeRange: [40, 500] as [number, number],
        lossRate: 0.01,
        avgLatency: 25,
        latencyJitter: 30,
        outOfOrderChance: 0.12,
        description: "Online Gaming",
      };
  }
}

function generateEvents(
  source: string,
  destination: string,
  scenario: Scenario,
  payload?: string
): { events: SimEvent[]; stats: SimStats } {
  const config = scenarioConfig(scenario);
  const events: SimEvent[] = [];
  let sent = 0;
  let received = 0;
  let lost = 0;
  let outOfOrderCount = 0;
  let latencySum = 0;
  let latencyCount = 0;
  let currentTimestamp = 0;

  const payloadSize = payload ? Buffer.byteLength(payload, "utf-8") : 0;

  for (let i = 0; i < config.packetCount; i++) {
    const sequenceNumber = i + 1;
    const baseSize =
      payloadSize > 0
        ? Math.min(payloadSize, config.sizeRange[1])
        : randomBetween(config.sizeRange[0], config.sizeRange[1]);
    const ttl = randomBetween(32, 128);

    // Determine packet fate
    const isLost = Math.random() < config.lossRate;
    const isTtlExpired = isLost && Math.random() < 0.3;

    // Determine if out of order (only for non-lost packets)
    const isOutOfOrder =
      !isLost && i > 0 && Math.random() < config.outOfOrderChance;

    // Calculate latency
    const baseLatency = config.avgLatency + randomBetween(-config.latencyJitter, config.latencyJitter);
    const latency = Math.max(1, baseLatency);

    currentTimestamp += randomBetween(5, 30);

    // SENT event
    const sentEvent: SimEvent = {
      step: events.length + 1,
      type: "DATAGRAM",
      src: source,
      dst: destination,
      size: baseSize,
      timestamp: currentTimestamp,
      status: "SENT",
      ttl,
      sequenceNumber,
    };
    events.push(sentEvent);
    sent++;

    if (isLost) {
      currentTimestamp += latency;
      const lostEvent: SimEvent = {
        step: events.length + 1,
        type: "DATAGRAM",
        src: source,
        dst: destination,
        size: baseSize,
        timestamp: currentTimestamp,
        status: "LOST",
        ttl: isTtlExpired ? 0 : ttl - randomBetween(1, 5),
        reason: isTtlExpired ? "TTL_EXPIRED" : "NETWORK_CONGESTION",
        sequenceNumber,
      };
      events.push(lostEvent);
      lost++;
    } else if (isOutOfOrder) {
      currentTimestamp += latency * 0.5; // arrives faster than expected (out of order)
      const oooEvent: SimEvent = {
        step: events.length + 1,
        type: "DATAGRAM",
        src: source,
        dst: destination,
        size: baseSize,
        timestamp: currentTimestamp,
        status: "OUT_OF_ORDER",
        ttl: ttl - 1,
        sequenceNumber,
      };
      events.push(oooEvent);
      received++;
      outOfOrderCount++;
      latencySum += latency * 0.5;
      latencyCount++;
    } else {
      currentTimestamp += latency;
      const recvEvent: SimEvent = {
        step: events.length + 1,
        type: "DATAGRAM",
        src: source,
        dst: destination,
        size: baseSize,
        timestamp: currentTimestamp,
        status: "RECEIVED",
        ttl: ttl - 1,
        sequenceNumber,
      };
      events.push(recvEvent);
      received++;
      latencySum += latency;
      latencyCount++;
    }
  }

  // For streaming scenario, add a reassembly event if packets were fragmented
  if (scenario === "streaming" && config.packetCount > 5) {
    const fragmentCount = randomBetween(2, Math.min(4, config.packetCount));
    events.push({
      step: events.length + 1,
      type: "REASSEMBLY",
      src: destination,
      dst: "application_layer",
      size: config.sizeRange[1] * fragmentCount,
      timestamp: currentTimestamp + 2,
      status: "REASSEMBLED",
      fragmentOffset: 0,
      moreFragments: false,
    });
  }

  // For gaming scenario, add a timeout event occasionally
  if (scenario === "gaming" && Math.random() < 0.3) {
    events.push({
      step: events.length + 1,
      type: "TIMEOUT",
      src: source,
      dst: destination,
      size: 0,
      timestamp: currentTimestamp + randomBetween(50, 100),
      status: "TIMEOUT",
      reason: "ACK_TIMEOUT — UDP has no ACK mechanism, this is informational only",
    });
  }

  const lossRate = sent > 0 ? lost / sent : 0;
  const avgLatency = latencyCount > 0 ? Math.round(latencySum / latencyCount) : 0;

  return {
    events,
    stats: {
      sent,
      received,
      lost,
      lossRate: Math.round(lossRate * 1000) / 1000,
      avgLatency,
      outOfOrder: outOfOrderCount,
    },
  };
}

function handleSimulate(body: SimulateRequest): SimulateResponse {
  simCounter++;
  const scenario: Scenario = body.scenario || "dns";
  const simulationId = `udp_sim_${String(simCounter).padStart(3, "0")}`;

  const { events, stats } = generateEvents(
    body.source || "192.168.1.100:54321",
    body.destination || "8.8.8.8:53",
    scenario,
    body.payload
  );

  const response: SimulateResponse = { simulationId, scenario, events, stats };

  // Store in history
  simulationHistory.set(simulationId, response);

  // Update cumulative stats
  totalDatagramsSent += stats.sent;
  totalDatagramsReceived += stats.received;
  totalDatagramsLost += stats.lost;
  totalLatencySum += stats.avgLatency * stats.received;
  totalLatencyCount += stats.received;
  scenariosRun++;

  return response;
}

function handleStats() {
  return {
    totalDatagramsSent,
    totalDatagramsReceived,
    totalDatagramsLost,
    lossRate:
      totalDatagramsSent > 0
        ? Math.round((totalDatagramsLost / totalDatagramsSent) * 1000) / 1000
        : 0,
    avgLatency:
      totalLatencyCount > 0
        ? Math.round(totalLatencySum / totalLatencyCount)
        : 0,
    scenariosRun,
    simulationsInMemory: simulationHistory.size,
  };
}

function handleBroadcast(body: BroadcastRequest) {
  const events: BroadcastEvent[] = [];
  let delivered = 0;
  let lost = 0;
  const messageSize = body.message ? Buffer.byteLength(body.message, "utf-8") : 64;
  const lossRate = randomBetween(5, 20) / 1000; // 0.5-2% for broadcast
  let timestamp = 0;

  for (let i = 0; i < body.targets.length; i++) {
    const target = body.targets[i];
    timestamp += randomBetween(1, 10);
    const isLost = Math.random() < lossRate;

    if (isLost) {
      events.push({
        step: i + 1,
        target,
        status: "LOST",
        timestamp,
        size: messageSize,
        reason: Math.random() < 0.5 ? "PACKET_DROPPED" : "TTL_EXPIRED",
      });
      lost++;
    } else {
      events.push({
        step: i + 1,
        target,
        status: "DELIVERED",
        timestamp,
        size: messageSize,
      });
      delivered++;
    }
  }

  // Update cumulative stats
  totalDatagramsSent += body.targets.length;
  totalDatagramsReceived += delivered;
  totalDatagramsLost += lost;

  return {
    source: body.source,
    message: body.message,
    totalTargets: body.targets.length,
    delivered,
    lost,
    lossRate:
      body.targets.length > 0
        ? Math.round((lost / body.targets.length) * 1000) / 1000
        : 0,
    events,
  };
}

function handleCompare(body: CompareRequest) {
  const { scenario, dataSize, packets } = body;
  const overheadTcp = packets * 40 + 40; // SYN + SYN-ACK + ACK + per-packet ACK overhead (simplified)
  const overheadUdp = packets * 8; // 8-byte UDP header per datagram
  const tcpRtt = randomBetween(20, 60);
  const udpRtt = tcpRtt - randomBetween(5, 15);
  const tcpLossRate = 0;
  const udpLossRate = scenario === "gaming" ? 0.015 : scenario === "streaming" ? 0.02 : scenario === "voip" ? 0.03 : 0.005;

  return {
    scenario,
    dataSize,
    packets,
    tcp: {
      protocol: "TCP",
      connectionOriented: true,
      threeWayHandshake: true,
      reliable: true,
      orderedDelivery: true,
      flowControl: true,
      congestionControl: true,
      overheadBytes: overheadTcp,
      overheadPercent: Math.round((overheadTcp / (dataSize + overheadTcp)) * 1000) / 1000,
      estimatedRttMs: tcpRtt,
      lossRate: tcpLossRate,
      retransmission: "Automatic (ARQ)",
      useCase: tcpUseCase(scenario),
      strengths: [
        "Guaranteed delivery",
        "Ordered packet arrival",
        "Error detection & recovery",
        "Flow & congestion control",
      ],
      weaknesses: [
        "Higher latency (handshake overhead)",
        "Head-of-line blocking",
        "More bandwidth overhead",
        "Not ideal for real-time applications",
      ],
    },
    udp: {
      protocol: "UDP",
      connectionOriented: false,
      threeWayHandshake: false,
      reliable: false,
      orderedDelivery: false,
      flowControl: false,
      congestionControl: false,
      overheadBytes: overheadUdp,
      overheadPercent: Math.round((overheadUdp / (dataSize + overheadUdp)) * 1000) / 1000,
      estimatedRttMs: Math.max(5, udpRtt),
      lossRate: udpLossRate,
      retransmission: "None (application must handle)",
      useCase: udpUseCase(scenario),
      strengths: [
        "Low latency (no handshake)",
        "Minimal overhead (8-byte header)",
        "Supports broadcast/multicast",
        "No head-of-line blocking",
      ],
      weaknesses: [
        "No delivery guarantee",
        "Packets may arrive out of order",
        "No congestion control (can cause network issues)",
        "Application must handle reliability if needed",
      ],
    },
    recommendation: recommendation(scenario),
  };
}

function tcpUseCase(scenario: string): string {
  switch (scenario) {
    case "dns": return "DNS over TCP (zone transfers, large responses >512 bytes)";
    case "streaming": return "HLS/DASH streaming (chunked over HTTP/TCP)";
    case "voip": return "Not recommended (SIP signaling only)";
    case "gaming": return "Turn-based games, game state sync, asset downloads";
    default: return "File transfer, web browsing, email, API calls";
  }
}

function udpUseCase(scenario: string): string {
  switch (scenario) {
    case "dns": return "Standard DNS queries (port 53)";
    case "streaming": return "RTP/RTSP media streaming, live video";
    case "voip": return "VoIP/RTP audio streams, video calls";
    case "gaming": return "FPS/RTS real-time game state updates";
    default: return "DHCP, SNMP, NTP, broadcast/multicast applications";
  }
}

function recommendation(scenario: string): string {
  switch (scenario) {
    case "dns":
      return "Use UDP for standard queries (low overhead, fast). Fall back to TCP only for large responses or when truncated.";
    case "streaming":
      return "Use UDP with RTP for live/real-time streaming where latency matters more than perfect reliability. Use TCP-based HLS/DASH for on-demand content.";
    case "voip":
      return "Strongly prefer UDP. VoIP requires low latency and can tolerate some packet loss. TCP's retransmissions would cause unacceptable delays.";
    case "gaming":
      return "Use UDP for fast-paced real-time game updates. Use TCP for non-time-critical operations like matchmaking, leaderboards, and asset downloads.";
    default:
      return "Choose TCP when reliability is critical. Choose UDP when speed and low latency are more important than guaranteed delivery.";
  }
}

// ── CORS helpers ─────────────────────────────────────────────────────────────

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

// ── HTTP Server ──────────────────────────────────────────────────────────────

const server = Bun.serve({
  port: 3006,
  async fetch(req) {
    const url = new URL(req.url);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      // POST /simulate — Run a UDP datagram simulation
      if (url.pathname === "/simulate" && req.method === "POST") {
        const body = (await req.json()) as SimulateRequest;
        if (!body.source || !body.destination) {
          return jsonResponse(
            { error: "Missing required fields: source and destination" },
            400
          );
        }
        const result = handleSimulate(body);
        return jsonResponse(result);
      }

      // GET /stats — Get cumulative simulation statistics
      if (url.pathname === "/stats" && req.method === "GET") {
        return jsonResponse(handleStats());
      }

      // POST /broadcast — Simulate UDP broadcast/multicast
      if (url.pathname === "/broadcast" && req.method === "POST") {
        const body = (await req.json()) as BroadcastRequest;
        if (!body.source || !body.message || !body.targets?.length) {
          return jsonResponse(
            { error: "Missing required fields: source, message, and targets (non-empty array)" },
            400
          );
        }
        const result = handleBroadcast(body);
        return jsonResponse(result);
      }

      // POST /compare — Compare TCP vs UDP
      if (url.pathname === "/compare" && req.method === "POST") {
        const body = (await req.json()) as CompareRequest;
        if (!body.scenario || !body.dataSize || !body.packets) {
          return jsonResponse(
            { error: "Missing required fields: scenario, dataSize, and packets" },
            400
          );
        }
        const result = handleCompare(body);
        return jsonResponse(result);
      }

      // 404
      return jsonResponse(
        {
          error: "Not Found",
          availableRoutes: [
            "POST /simulate — Run a UDP datagram simulation",
            "GET /stats — Get cumulative simulation statistics",
            "POST /broadcast — Simulate UDP broadcast/multicast",
            "POST /compare — Compare TCP vs UDP for a scenario",
          ],
        },
        404
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal Server Error";
      return jsonResponse({ error: message }, 500);
    }
  },
});

console.log(`🚀 UDP Protocol Simulation Service running on port ${server.port}`);
console.log(`   POST /simulate  — Run UDP datagram simulation`);
console.log(`   GET  /stats     — Cumulative statistics`);
console.log(`   POST /broadcast — Simulate broadcast/multicast`);
console.log(`   POST /compare   — TCP vs UDP comparison`);