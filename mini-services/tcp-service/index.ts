// TCP Protocol Simulation Service — Educational Tool
// Simulates TCP handshake, data transfer, connection teardown, and SYN flood attacks

const PORT = 3005;

// ── In-memory state ──────────────────────────────────────────────────────────
interface SimEvent {
  step: number;
  type: string;
  src: string;
  dst: string;
  seq: number;
  ack: number;
  flags: string[];
  timestamp: number;
  status: string;
  data?: string;
  windowSize?: number;
}

interface SimResult {
  simulationId: string;
  scenario: string;
  events: SimEvent[];
  stats: {
    totalPackets: number;
    totalTime: number;
    avgLatency: number;
    status: string;
  };
}

interface FloodEvent {
  step: number;
  type: string;
  src: string;
  dst: string;
  seq: number;
  ack: number;
  flags: string[];
  timestamp: number;
  status: string;
  spoofed: boolean;
}

interface FloodResult {
  floodId: string;
  target: string;
  intensity: string;
  events: FloodEvent[];
  analysis: {
    totalSynPackets: number;
    totalCompletedHandshakes: number;
    halfOpenConnections: number;
    detectionConfidence: number;
    detected: boolean;
    indicators: string[];
  };
  mitigation: string[];
}

interface CumulativeStats {
  totalSimulations: number;
  successfulSimulations: number;
  failedSimulations: number;
  successRate: number;
  avgLatency: number;
  totalPackets: number;
  byScenario: Record<string, { count: number; avgLatency: number; avgPackets: number }>;
}

const simulationHistory = new Map<string, SimResult>();
let cumulativeStats: CumulativeStats = {
  totalSimulations: 0,
  successfulSimulations: 0,
  failedSimulations: 0,
  successRate: 0,
  avgLatency: 0,
  totalPackets: 0,
  byScenario: {},
};

let simulationCounter = 41; // start ids from tcp_sim_042
let floodCounter = 0;

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomSeq(): number {
  return Math.floor(Math.random() * 900000000) + 100000000;
}

function randomLatency(min = 10, max = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPort(): number {
  return Math.floor(Math.random() * 60000) + 1024;
}

function simPacketLoss(): boolean {
  return Math.random() < 0.05; // 5% chance
}

function nextSimId(): string {
  simulationCounter++;
  return `tcp_sim_${String(simulationCounter).padStart(3, '0')}`;
}

function nextFloodId(): string {
  floodCounter++;
  return `flood_${String(floodCounter).padStart(3, '0')}`;
}

function updateCumulative(result: SimResult) {
  cumulativeStats.totalSimulations++;
  cumulativeStats.totalPackets += result.stats.totalPackets;

  if (result.stats.status === 'SUCCESS') {
    cumulativeStats.successfulSimulations++;
  } else {
    cumulativeStats.failedSimulations++;
  }

  // Running average latency
  const prevTotal = cumulativeStats.avgLatency * (cumulativeStats.totalSimulations - 1);
  cumulativeStats.avgLatency = Math.round(
    (prevTotal + result.stats.avgLatency) / cumulativeStats.totalSimulations
  );

  cumulativeStats.successRate = Math.round(
    (cumulativeStats.successfulSimulations / cumulativeStats.totalSimulations) * 100
  );

  // Per-scenario tracking
  const scenario = result.scenario;
  if (!cumulativeStats.byScenario[scenario]) {
    cumulativeStats.byScenario[scenario] = { count: 0, avgLatency: 0, avgPackets: 0 };
  }
  const sc = cumulativeStats.byScenario[scenario];
  sc.count++;
  const prevLat = sc.avgLatency * (sc.count - 1);
  sc.avgLatency = Math.round((prevLat + result.stats.avgLatency) / sc.count);
  const prevPkt = sc.avgPackets * (sc.count - 1);
  sc.avgPackets = Math.round((prevPkt + result.stats.totalPackets) / sc.count);
}

// ── Simulation logic ─────────────────────────────────────────────────────────

function simulateHandshake(source: string, destination: string): SimEvent[] {
  const events: SimEvent[] = [];
  const clientISN = randomSeq();
  const serverISN = randomSeq();
  let timestamp = 0;

  // Step 1: Client → Server  SYN
  const lat1 = randomLatency();
  events.push({
    step: 1,
    type: 'SYN',
    src: `${source}:${randomPort()}`,
    dst: `${destination}:80`,
    seq: clientISN,
    ack: 0,
    flags: ['SYN'],
    timestamp,
    status: 'SENT',
    windowSize: 65535,
  });
  timestamp += lat1;

  // Step 2: Server → Client  SYN-ACK
  const lost2 = simPacketLoss();
  const lat2 = randomLatency();
  events.push({
    step: 2,
    type: 'SYN-ACK',
    src: `${destination}:80`,
    dst: `${source}:${randomPort()}`,
    seq: serverISN,
    ack: clientISN + 1,
    flags: ['SYN', 'ACK'],
    timestamp,
    status: lost2 ? 'LOST' : 'RECEIVED',
    windowSize: 65535,
  });
  timestamp += lat2;

  // If packet lost, add retransmission
  if (lost2) {
    const latRetransmit = randomLatency(20, 200);
    events.push({
      step: 2.5,
      type: 'RETRANSMIT',
      src: `${destination}:80`,
      dst: `${source}:${randomPort()}`,
      seq: serverISN,
      ack: clientISN + 1,
      flags: ['SYN', 'ACK'],
      timestamp,
      status: 'SENT',
      windowSize: 65535,
    });
    timestamp += latRetransmit;
  }

  // Step 3: Client → Server  ACK
  const lat3 = randomLatency();
  events.push({
    step: 3,
    type: 'ACK',
    src: `${source}:${randomPort()}`,
    dst: `${destination}:80`,
    seq: clientISN + 1,
    ack: serverISN + 1,
    flags: ['ACK'],
    timestamp,
    status: 'RECEIVED',
    windowSize: 65535,
  });
  timestamp += lat3;

  // Connection established
  events.push({
    step: 4,
    type: 'ESTABLISHED',
    src: source,
    dst: destination,
    seq: clientISN + 1,
    ack: serverISN + 1,
    flags: [],
    timestamp,
    status: 'CONNECTION_ESTABLISHED',
    windowSize: 65535,
  });

  return events;
}

function simulateTransfer(source: string, destination: string, payload: string): SimEvent[] {
  const events: SimEvent[] = [];
  // Start with a full handshake
  events.push(...simulateHandshake(source, destination));

  let timestamp = events[events.length - 1].timestamp;
  const baseSeq = events[0].seq + 1;
  const baseAck = events[1].ack + 1;
  const mss = 1460; // Maximum Segment Size
  const dataChunks: string[] = [];

  // Split payload into chunks
  for (let i = 0; i < payload.length; i += mss) {
    dataChunks.push(payload.slice(i, i + mss));
  }

  if (dataChunks.length === 0) {
    dataChunks.push('Hello, World!');
  }

  let currentSeq = baseSeq;
  let stepBase = events.length + 1;

  for (let i = 0; i < dataChunks.length; i++) {
    const chunk = dataChunks[i];
    const chunkSize = Buffer.byteLength(chunk, 'utf-8');
    const lost = simPacketLoss();

    // Data packet
    const lat = randomLatency();
    events.push({
      step: stepBase + i * 2,
      type: 'PSH-ACK',
      src: `${source}:${randomPort()}`,
      dst: `${destination}:80`,
      seq: currentSeq,
      ack: baseAck,
      flags: ['PSH', 'ACK'],
      timestamp,
      status: lost ? 'LOST' : 'SENT',
      data: chunk.length > 40 ? chunk.slice(0, 40) + '...' : chunk,
      windowSize: 65535 - (i * chunkSize),
    });
    timestamp += lat;

    if (lost) {
      // Retransmit
      const latR = randomLatency(20, 200);
      events.push({
        step: stepBase + i * 2 + 0.5,
        type: 'RETRANSMIT',
        src: `${source}:${randomPort()}`,
        dst: `${destination}:80`,
        seq: currentSeq,
        ack: baseAck,
        flags: ['PSH', 'ACK'],
        timestamp,
        status: 'SENT',
        data: chunk.length > 40 ? chunk.slice(0, 40) + '...' : chunk,
        windowSize: 65535 - (i * chunkSize),
      });
      timestamp += latR;
    }

    // ACK from server
    const latAck = randomLatency();
    events.push({
      step: stepBase + i * 2 + 1,
      type: 'ACK',
      src: `${destination}:80`,
      dst: `${source}:${randomPort()}`,
      seq: baseAck,
      ack: currentSeq + chunkSize,
      flags: ['ACK'],
      timestamp,
      status: 'RECEIVED',
      windowSize: 65535,
    });
    timestamp += latAck;
    currentSeq += chunkSize;
  }

  return events;
}

function simulateClose(source: string, destination: string): SimEvent[] {
  const events: SimEvent[] = [];
  // Start with a full handshake
  events.push(...simulateHandshake(source, destination));

  let timestamp = events[events.length - 1].timestamp;
  const clientSeq = events[0].seq + 1;
  const serverSeq = events[1].seq + 1;
  const clientPort = randomPort();
  let step = events.length + 1;

  // Step: Client → Server  FIN
  const lat1 = randomLatency();
  events.push({
    step: step++,
    type: 'FIN-ACK',
    src: `${source}:${clientPort}`,
    dst: `${destination}:80`,
    seq: clientSeq,
    ack: serverSeq,
    flags: ['FIN', 'ACK'],
    timestamp,
    status: 'SENT',
    windowSize: 0,
  });
  timestamp += lat1;

  // Step: Server → Client  ACK
  const lat2 = randomLatency();
  events.push({
    step: step++,
    type: 'ACK',
    src: `${destination}:80`,
    dst: `${source}:${clientPort}`,
    seq: serverSeq,
    ack: clientSeq + 1,
    flags: ['ACK'],
    timestamp,
    status: 'RECEIVED',
    windowSize: 0,
  });
  timestamp += lat2;

  // Server sends its own FIN after a brief delay
  const serverDelay = randomLatency(50, 200);
  events.push({
    step: step++,
    type: 'FIN-ACK',
    src: `${destination}:80`,
    dst: `${source}:${clientPort}`,
    seq: serverSeq,
    ack: clientSeq + 1,
    flags: ['FIN', 'ACK'],
    timestamp: timestamp + serverDelay,
    status: 'SENT',
    windowSize: 0,
  });
  timestamp += serverDelay + randomLatency();

  // Client → Server  ACK (final)
  const lat4 = randomLatency();
  events.push({
    step: step++,
    type: 'ACK',
    src: `${source}:${clientPort}`,
    dst: `${destination}:80`,
    seq: clientSeq + 1,
    ack: serverSeq + 1,
    flags: ['ACK'],
    timestamp,
    status: 'RECEIVED',
    windowSize: 0,
  });

  // Connection closed
  events.push({
    step: step++,
    type: 'CLOSED',
    src: source,
    dst: destination,
    seq: clientSeq + 1,
    ack: serverSeq + 1,
    flags: [],
    timestamp: timestamp + randomLatency(30, 60),
    status: 'CONNECTION_CLOSED',
    windowSize: 0,
  });

  return events;
}

function runSimulation(
  source: string,
  destination: string,
  payload: string,
  scenario: 'handshake' | 'transfer' | 'close'
): SimResult {
  const id = nextSimId();
  let events: SimEvent[];

  switch (scenario) {
    case 'transfer':
      events = simulateTransfer(source, destination, payload || 'GET / HTTP/1.1\r\nHost: example.com\r\n\r\n');
      break;
    case 'close':
      events = simulateClose(source, destination);
      break;
    case 'handshake':
    default:
      events = simulateHandshake(source, destination);
      break;
  }

  const latencies: number[] = [];
  for (let i = 1; i < events.length; i++) {
    const diff = events[i].timestamp - events[i - 1].timestamp;
    if (diff > 0) latencies.push(diff);
  }
  const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const totalTime = events[events.length - 1].timestamp - events[0].timestamp;
  const hasLost = events.some((e) => e.status === 'LOST');
  const allRecovered = !events.some((e) => e.status === 'LOST' && e.type !== 'RETRANSMIT');

  const result: SimResult = {
    simulationId: id,
    scenario,
    events,
    stats: {
      totalPackets: events.length,
      totalTime,
      avgLatency,
      status: hasLost && !allRecovered ? 'PARTIAL_LOSS' : 'SUCCESS',
    },
  };

  simulationHistory.set(id, result);
  updateCumulative(result);
  console.log(`[TCP] Simulation ${id} (${scenario}) completed — ${events.length} packets, ${totalTime}ms`);
  return result;
}

// ── SYN Flood simulation ────────────────────────────────────────────────────

function simulateFlood(target: string, intensity: 'low' | 'medium' | 'high'): FloodResult {
  const id = nextFloodId();
  const packetCounts = { low: 20, medium: 100, high: 500 };
  const count = packetCounts[intensity] || 100;
  const events: FloodEvent[] = [];
  let timestamp = 0;
  let completedHandshakes = 0;

  for (let i = 0; i < count; i++) {
    const spoofedSrc = `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    const seq = randomSeq();
    const isRetransmit = Math.random() < 0.15; // Some retransmissions

    events.push({
      step: i + 1,
      type: 'SYN',
      src: `${spoofedSrc}:${randomPort()}`,
      dst: `${target}:80`,
      seq,
      ack: 0,
      flags: ['SYN'],
      timestamp,
      status: 'SENT',
      spoofed: true,
    });

    timestamp += randomLatency(1, intensity === 'high' ? 5 : 10);

    // Server sends SYN-ACK (goes to spoofed/unreachable address)
    events.push({
      step: i + 1.5,
      type: 'SYN-ACK',
      src: `${target}:80`,
      dst: `${spoofedSrc}:${randomPort()}`,
      seq: randomSeq(),
      ack: seq + 1,
      flags: ['SYN', 'ACK'],
      timestamp,
      status: 'UNREACHABLE',
      spoofed: false,
    });

    timestamp += randomLatency(1, intensity === 'high' ? 5 : 10);

    // Very rarely a legitimate handshake completes (to show contrast)
    if (Math.random() < 0.02) {
      events.push({
        step: i + 1.8,
        type: 'ACK',
        src: `${spoofedSrc}:${randomPort()}`,
        dst: `${target}:80`,
        seq: seq + 1,
        ack: randomSeq() + 1,
        flags: ['ACK'],
        timestamp,
        status: 'RECEIVED',
        spoofed: false,
      });
      completedHandshakes++;
    }

    if (isRetransmit) {
      events.push({
        step: i + 1.9,
        type: 'RETRANSMIT',
        src: `${spoofedSrc}:${randomPort()}`,
        dst: `${target}:80`,
        seq,
        ack: 0,
        flags: ['SYN'],
        timestamp: timestamp + randomLatency(50, 200),
        status: 'SENT',
        spoofed: true,
      });
    }
  }

  const halfOpen = count - completedHandshakes;
  const detectionConfidence =
    intensity === 'high' ? 98 : intensity === 'medium' ? 85 : 60;

  const indicators: string[] = [];
  if (count > 50) indicators.push('High rate of SYN packets without corresponding ACK responses');
  if (completedHandshakes / count < 0.05) indicators.push('Extremely low handshake completion ratio (< 5%)');
  if (intensity === 'high') indicators.push('SYN packet rate exceeds normal threshold by 10x');
  indicators.push('Multiple source IPs targeting single destination port');
  if (intensity !== 'low') indicators.push('Backlog queue utilization critical');

  const result: FloodResult = {
    floodId: id,
    target,
    intensity,
    events,
    analysis: {
      totalSynPackets: count,
      totalCompletedHandshakes: completedHandshakes,
      halfOpenConnections: halfOpen,
      detectionConfidence,
      detected: detectionConfidence > 70,
      indicators,
    },
    mitigation: [
      'Enable SYN Cookies to prevent half-open connection resource exhaustion',
      'Reduce SYN backlog queue timeout (tcp_synack_retries, tcp_syn_retries)',
      'Deploy rate limiting on SYN packets per source IP',
      'Implement connection tracking to identify and block spoofed sources',
      intensity === 'high' ? 'Activate emergency DDoS mitigation / blackhole routing' : 'Monitor for escalation',
      'Use firewall rules to limit new connection rate (e.g., iptables --syn --limit)',
      'Enable TCP intercept on perimeter devices',
    ],
  };

  console.log(`[TCP] Flood simulation ${id} (${intensity}) — ${count} SYN packets to ${target}`);
  return result;
}

// ── Protocol reference data ──────────────────────────────────────────────────

const protocolData = {
  name: 'TCP (Transmission Control Protocol)',
  rfc: 'RFC 793',
  transportLayer: true,
  connectionOriented: true,
  headerFields: [
    { name: 'Source Port', bits: 16, description: 'Identifies the sending port' },
    { name: 'Destination Port', bits: 16, description: 'Identifies the receiving port' },
    { name: 'Sequence Number', bits: 32, description: 'Identifies the byte position of the first data byte in this segment' },
    { name: 'Acknowledgment Number', bits: 32, description: 'Contains the next sequence number the sender expects to receive' },
    { name: 'Data Offset', bits: 4, description: 'Size of the TCP header in 32-bit words' },
    { name: 'Reserved', bits: 3, description: 'Reserved for future use' },
    { name: 'Flags (NS,CWR,ECE,URG,ACK,PSH,RST,SYN,FIN)', bits: 9, description: 'Control flags for connection management and data transfer' },
    { name: 'Window Size', bits: 16, description: 'Number of bytes the sender is willing to accept' },
    { name: 'Checksum', bits: 16, description: 'Error-checking of the header and data' },
    { name: 'Urgent Pointer', bits: 16, description: 'Indicates the end of urgent data' },
    { name: 'Options', bits: '0-320', description: 'Variable length field for optional features (MSS, Window Scaling, SACK, etc.)' },
  ],
  flags: [
    { flag: 'SYN', name: 'Synchronize', description: 'Used to initiate a connection. First packet in the 3-way handshake.' },
    { flag: 'ACK', name: 'Acknowledge', description: 'Acknowledges receipt of data. All packets after the initial SYN include this.' },
    { flag: 'FIN', name: 'Finish', description: 'Gracefully closes a connection. Sender has finished sending data.' },
    { flag: 'RST', name: 'Reset', description: 'Abruptly terminates a connection. Used for error recovery or rejection.' },
    { flag: 'PSH', name: 'Push', description: 'Requests the receiver to push data to the application immediately.' },
    { flag: 'URG', name: 'Urgent', description: 'Indicates that the urgent pointer field is significant.' },
    { flag: 'CWR', name: 'Congestion Window Reduced', description: 'Indicates the sender reduced its congestion window.' },
    { flag: 'ECE', name: 'ECN-Echo', description: 'Indicates congestion was experienced in the network.' },
    { flag: 'NS', name: 'Nonce Sum', description: 'ECN-nonce concealment protection.' },
  ],
  commonScenarios: [
    {
      name: 'Three-Way Handshake',
      description: 'SYN → SYN-ACK → ACK. Establishes a reliable connection between client and server.',
      steps: ['Client sends SYN with initial sequence number (ISN)', 'Server responds with SYN-ACK, acknowledging client ISN and sending its own ISN', 'Client sends ACK to confirm server ISN', 'Connection is ESTABLISHED'],
    },
    {
      name: 'Data Transfer',
      description: 'PSH-ACK → ACK. Reliable data delivery with sequence numbers and acknowledgments.',
      steps: ['Sender segments data into MSS-sized chunks', 'Each segment sent with PSH+ACK flags and incrementing sequence number', 'Receiver acknowledges each segment with ACK', 'Lost packets are retransmitted after timeout or duplicate ACKs (Fast Retransmit)'],
    },
    {
      name: 'Four-Way Teardown (Connection Close)',
      description: 'FIN-ACK → ACK → FIN-ACK → ACK. Graceful connection termination.',
      steps: ['Active closer sends FIN to signal end of data transfer', 'Passive closer acknowledges with ACK (half-close state)', 'Passive closer sends its own FIN when ready to close', 'Active closer sends final ACK and enters TIME_WAIT'],
    },
    {
      name: 'SYN Flood Attack',
      description: 'Malicious scenario where attacker sends many SYN packets without completing handshake.',
      steps: ['Attacker sends rapid SYN packets from spoofed IP addresses', 'Server allocates resources for each half-open connection', 'Server sends SYN-ACK to spoofed addresses (never responded to)', 'Server backlog queue fills up, denying legitimate connections'],
    },
  ],
  keyConcepts: [
    'Sequence Numbers: Byte-level tracking of data position in the stream',
    'Sliding Window: Flow control mechanism to manage data transmission rate',
    'Congestion Control: TCP uses Slow Start, Congestion Avoidance, Fast Retransmit, and Fast Recovery',
    'Maximum Segment Size (MSS): Typically 1460 bytes (1460 + 20 byte header = 1480 bytes)',
    'MTU (Maximum Transmission Unit): Typically 1500 bytes for Ethernet',
    'TIME_WAIT: 2MSL wait period after closing to ensure late packets are handled',
    'Nagle\'s Algorithm: Buffers small packets to reduce overhead (can be disabled with TCP_NODELAY)',
  ],
};

// ── HTTP Server ──────────────────────────────────────────────────────────────

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // ── POST /simulate ───────────────────────────────────────────────
      if (method === 'POST' && url.pathname === '/simulate') {
        const body = await req.json();
        const { source, destination, payload = '', scenario = 'handshake' } = body;

        if (!source || !destination) {
          return jsonResponse(
            { error: 'Missing required fields: source and destination' },
            400,
            corsHeaders
          );
        }

        const validScenarios = ['handshake', 'transfer', 'close'];
        if (!validScenarios.includes(scenario)) {
          return jsonResponse(
            { error: `Invalid scenario. Must be one of: ${validScenarios.join(', ')}` },
            400,
            corsHeaders
          );
        }

        console.log(`[TCP] /simulate — scenario=${scenario}, src=${source}, dst=${destination}`);
        const result = runSimulation(source, destination, payload, scenario);
        return jsonResponse(result, 200, corsHeaders);
      }

      // ── GET /stats ──────────────────────────────────────────────────
      if (method === 'GET' && url.pathname === '/stats') {
        console.log('[TCP] /stats — returning cumulative statistics');
        return jsonResponse(cumulativeStats, 200, corsHeaders);
      }

      // ── POST /flood ──────────────────────────────────────────────────
      if (method === 'POST' && url.pathname === '/flood') {
        const body = await req.json();
        const { target, intensity = 'medium' } = body;

        if (!target) {
          return jsonResponse(
            { error: 'Missing required field: target' },
            400,
            corsHeaders
          );
        }

        const validIntensities = ['low', 'medium', 'high'];
        if (!validIntensities.includes(intensity)) {
          return jsonResponse(
            { error: `Invalid intensity. Must be one of: ${validIntensities.join(', ')}` },
            400,
            corsHeaders
          );
        }

        console.log(`[TCP] /flood — target=${target}, intensity=${intensity}`);
        const result = simulateFlood(target, intensity);
        return jsonResponse(result, 200, corsHeaders);
      }

      // ── GET /protocols ──────────────────────────────────────────────
      if (method === 'GET' && url.pathname === '/protocols') {
        console.log('[TCP] /protocols — returning TCP protocol reference');
        return jsonResponse(protocolData, 200, corsHeaders);
      }

      // ── 404 ─────────────────────────────────────────────────────────
      console.log(`[TCP] ${method} ${url.pathname} — 404 Not Found`);
      return jsonResponse(
        { error: 'Not Found', availableRoutes: ['/simulate (POST)', '/stats (GET)', '/flood (POST)', '/protocols (GET)'] },
        404,
        corsHeaders
      );
    } catch (err) {
      console.error(`[TCP] Error processing ${method} ${url.pathname}:`, err);
      return jsonResponse(
        { error: 'Internal Server Error', message: String(err) },
        500,
        corsHeaders
      );
    }
  },
});

function jsonResponse(data: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

console.log(`[TCP] TCP Protocol Simulation Service running on port ${PORT}`);
console.log(`[TCP] Endpoints:`);
console.log(`[TCP]   POST /simulate  — Run TCP handshake/transfer/close simulation`);
console.log(`[TCP]   GET  /stats     — Cumulative simulation statistics`);
console.log(`[TCP]   POST /flood     — Simulate SYN flood attack (educational)`);
console.log(`[TCP]   GET  /protocols — TCP protocol reference data`);