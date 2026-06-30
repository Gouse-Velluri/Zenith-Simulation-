'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io, Socket } from 'socket.io-client'
import {
  Activity,
  Play,
  Square,
  Zap,
  ArrowRight,
  ArrowLeft,
  Clock,
  Shield,
  Wifi,
  Radio,
  Globe,
  Send,
  Terminal,
  ChevronDown,
  ChevronRight,
  Server,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

// ─── Types ───────────────────────────────────────────────────────────────────

type ProtocolTab = 'tcp' | 'udp' | 'websocket'

interface SequenceEvent {
  id: string
  direction: 'right' | 'left'
  type: string
  flags: string
  seq?: string
  ack?: string
  color: string
  label: string
  lost?: boolean
  latency?: number
}

interface FlowPacket {
  id: string
  direction: 'right' | 'left'
  progress: number
  lost: boolean
  color: string
}

interface Stats {
  packetsSent: number
  packetsReceived: number
  packetsLost: number
  avgLatency: number
  throughput: number
}

interface LogEntry {
  id: string
  timestamp: string
  protocol: ProtocolTab
  event: string
  latency?: number
}

interface CompareData {
  tcp: { reliability: string; speed: string; overhead: string; useCase: string }
  udp: { reliability: string; speed: string; overhead: string; useCase: string }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TCP_SCENARIOS = ['TCP Handshake', 'Data Transfer', 'Connection Close']
const UDP_SCENARIOS = ['DNS Query', 'Video Streaming', 'VoIP Call', 'Gaming']

const FLAG_COLORS: Record<string, string> = {
  SYN: '#3b82f6',
  ACK: '#22c55e',
  'SYN+ACK': '#3b82f6',
  DATA: '#a855f7',
  FIN: '#ef4444',
  RST: '#f97316',
  LOST: '#6b7280',
  PSH: '#a855f7',
  URG: '#f97316',
  DNS: '#22c55e',
  STREAM: '#a855f7',
  VOICE: '#f59e0b',
  GAME: '#06b6d4',
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const DEFAULT_STATS: Stats = {
  packetsSent: 0,
  packetsReceived: 0,
  packetsLost: 0,
  avgLatency: 0,
  throughput: 0,
}

const COMPARE_DEFAULT: CompareData = {
  tcp: { reliability: 'High', speed: 'Moderate', overhead: 'High', useCase: 'Web, Email, FTP' },
  udp: { reliability: 'Low', speed: 'Fast', overhead: 'Low', useCase: 'Streaming, DNS, Gaming' },
}

// ─── Animated Counter ────────────────────────────────────────────────────────

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [displayed, setDisplayed] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    const start = prevRef.current
    const end = value
    if (start === end) return
    const duration = 600
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(start + (end - start) * eased)
      if (progress < 1) requestAnimationFrame(animate)
      else prevRef.current = end
    }
    requestAnimationFrame(animate)
  }, [value])

  return <span>{decimals > 0 ? displayed.toFixed(decimals) : Math.round(displayed).toLocaleString()}</span>
}

// ─── Sequence Diagram Arrow ──────────────────────────────────────────────────

function SequenceArrow({
  event,
  index,
}: {
  event: SequenceEvent
  index: number
}) {
  const isRight = event.direction === 'right'
  const flagColor = FLAG_COLORS[event.type] || FLAG_COLORS[event.flags] || '#6b7280'

  return (
    <motion.div
      initial={{ opacity: 0, x: isRight ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.15, ease: 'easeOut' }}
      className="relative flex items-center h-8 my-1"
    >
      {/* Left label (source side for right arrows) */}
      {!isRight && (
        <div className="absolute left-1 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
          {event.latency ? `${event.latency.toFixed(1)}ms` : ''}
        </div>
      )}
      {isRight && (
        <div className="absolute left-1 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
          {event.seq || ''}
        </div>
      )}

      {/* Arrow line */}
      <div className="relative flex items-center w-full mx-6">
        {/* From side dot */}
        <div
          className="absolute w-2.5 h-2.5 rounded-full border-2 z-10"
          style={{
            borderColor: flagColor,
            backgroundColor: event.lost ? 'transparent' : flagColor + '33',
            left: isRight ? '0%' : 'auto',
            right: isRight ? 'auto' : '0%',
          }}
        />

        {/* Line */}
        <div
          className="absolute h-[2px] top-1/2 -translate-y-1/2"
          style={{
            left: isRight ? '10px' : 'auto',
            right: isRight ? 'auto' : '10px',
            width: 'calc(100% - 20px)',
            backgroundColor: event.lost ? '#6b7280' : flagColor,
            opacity: event.lost ? 0.5 : 0.8,
            borderStyle: event.lost ? 'dashed' : 'solid',
            ...(event.lost ? { backgroundImage: 'repeating-linear-gradient(90deg, #6b7280 0 6px, transparent 6px 12px)', backgroundColor: 'transparent' } : {}),
          }}
        />

        {/* Arrowhead */}
        {!event.lost && (
          <div
            className="absolute top-1/2 -translate-y-1/2 z-10"
            style={{
              right: isRight ? '4px' : 'auto',
              left: isRight ? 'auto' : '4px',
              width: 0,
              height: 0,
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderLeft: isRight ? 'none' : `7px solid ${flagColor}`,
              borderRight: isRight ? `7px solid ${flagColor}` : 'none',
            }}
          />
        )}

        {/* Lost X mark */}
        {event.lost && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.15 + 0.3 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 font-bold text-sm"
          >
            ✕
          </motion.div>
        )}

        {/* Center label */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5"
        >
          <span
            className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm whitespace-nowrap"
            style={{ backgroundColor: flagColor }}
          >
            {event.flags || event.type}
          </span>
          {event.label && (
            <span className="text-[9px] text-muted-foreground hidden sm:inline">
              {event.label}
            </span>
          )}
        </div>
      </div>

      {/* Right label */}
      {isRight && (
        <div className="absolute right-1 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
          {event.latency ? `${event.latency.toFixed(1)}ms` : ''}
        </div>
      )}
      {!isRight && (
        <div className="absolute right-1 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
          {event.ack || ''}
        </div>
      )}
    </motion.div>
  )
}

// ─── Packet Flow Visualization ───────────────────────────────────────────────

function PacketFlowViz({ packets }: { packets: FlowPacket[] }) {
  return (
    <div className="relative h-20 w-full overflow-hidden rounded-lg bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent border border-border/50">
      {/* Source endpoint */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 z-10" />
      {/* Destination endpoint */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-500 shadow-lg shadow-purple-500/30 z-10" />

      {/* Center line */}
      <div className="absolute top-1/2 left-6 right-6 h-px bg-border/60" />

      {/* Animated packets */}
      {packets.map((pkt) => (
        <motion.div
          key={pkt.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: pkt.lost ? [0.7, 0] : [0, 1, 1, 0],
            scale: [0, 1, 1, 0.5],
            left: pkt.direction === 'right'
              ? [`${10}%`, `${90}%`]
              : [`${90}%`, `${10}%`],
          }}
          transition={{
            duration: 1.2,
            ease: 'linear',
          }}
          className="absolute top-1/2 -translate-y-1/2 z-10"
        >
          {pkt.lost ? (
            <div className="w-3 h-3 flex items-center justify-center text-red-500 font-bold text-xs">
              ✕
            </div>
          ) : (
            <div
              className="w-2.5 h-2.5 rounded-full shadow-md"
              style={{ backgroundColor: pkt.color, boxShadow: `0 0 8px ${pkt.color}66` }}
            />
          )}
        </motion.div>
      ))}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function NetworkAnalysisView() {
  // ── Protocol Tab ──
  const [activeTab, setActiveTab] = useState<ProtocolTab>('tcp')

  // ── TCP State ──
  const [tcpSource, setTcpSource] = useState('192.168.1.100')
  const [tcpDest, setTcpDest] = useState('10.0.0.1')
  const [tcpScenario, setTcpScenario] = useState('TCP Handshake')
  const [tcpLoading, setTcpLoading] = useState(false)

  // ── UDP State ──
  const [udpSource, setUdpSource] = useState('192.168.1.100')
  const [udpDest, setUdpDest] = useState('10.0.0.1')
  const [udpScenario, setUdpScenario] = useState('DNS Query')
  const [udpLoading, setUdpLoading] = useState(false)

  // ── WebSocket State ──
  const [wsUrl, setWsUrl] = useState('ws://zenith.sim/realtime')
  const [wsConnected, setWsConnected] = useState(false)
  const [wsMessage, setWsMessage] = useState('')
  const [wsMessages, setWsMessages] = useState<string[]>([])
  const socketRef = useRef<Socket | null>(null)

  // ── Sequence Diagram ──
  const [sequenceEvents, setSequenceEvents] = useState<SequenceEvent[]>([])

  // ── Packet Flow ──
  const [flowPackets, setFlowPackets] = useState<FlowPacket[]>([])

  // ── Stats ──
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS)
  const [activeStatsProtocol, setActiveStatsProtocol] = useState<ProtocolTab>('tcp')

  // ── Log ──
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logEndRef = useRef<HTMLDivElement>(null)

  // ── Compare ──
  const [showCompare, setShowCompare] = useState(false)
  const [compareData, setCompareData] = useState<CompareData | null>(null)

  // ── Protocol Reference ──
  const [refOpen, setRefOpen] = useState(false)

  // ── Helpers ──
  const generateId = () => Math.random().toString(36).slice(2, 10)
  const getTimestamp = () => {
    const d = new Date()
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`
  }

  const addLog = useCallback((protocol: ProtocolTab, event: string, latency?: number) => {
    setLogs((prev) => {
      const entry: LogEntry = {
        id: generateId(),
        timestamp: getTimestamp(),
        protocol,
        event,
        latency,
      }
      const next = [...prev, entry]
      return next.slice(-50)
    })
  }, [])

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // ── Fetch stats polling ──
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const port = activeStatsProtocol === 'tcp' ? '3005' : '3006'
        const res = await fetch(`/?XTransformPort=${port}`)
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setStats({
              packetsSent: data.packetsSent ?? 0,
              packetsReceived: data.packetsReceived ?? 0,
              packetsLost: data.packetsLost ?? 0,
              avgLatency: data.avgLatency ?? 0,
              throughput: data.throughput ?? 0,
            })
          }
        }
      } catch {
        // silently ignore
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 2000)
    return () => clearInterval(interval)
  }, [activeStatsProtocol])

  // Update stats protocol when tab changes
  useEffect(() => {
    setActiveStatsProtocol(activeTab)
  }, [activeTab])

  // ── TCP Simulation ──
  const runTcpSimulation = async () => {
    setTcpLoading(true)
    addLog('tcp', `Starting "${tcpScenario}" simulation: ${tcpSource} → ${tcpDest}`)
    setSequenceEvents([])

    try {
      const res = await fetch('/?XTransformPort=3005', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: tcpScenario,
          sourceIp: tcpSource,
          destIp: tcpDest,
        }),
      })

      const data = await res.json()

      if (data && data.events) {
        const events: SequenceEvent[] = data.events.map((ev: Record<string, unknown>, i: number) => ({
          id: `seq-${i}`,
          direction: (ev.direction as 'right' | 'left') || (i % 2 === 0 ? 'right' : 'left'),
          type: (ev.type as string) || 'DATA',
          flags: (ev.flags as string) || '',
          seq: ev.seq as string | undefined,
          ack: ev.ack as string | undefined,
          color: FLAG_COLORS[(ev.flags as string) || (ev.type as string)] || '#6b7280',
          label: (ev.label as string) || '',
          lost: (ev.lost as boolean) || false,
          latency: (ev.latency as number) || undefined,
        }))
        setSequenceEvents(events)

        // Generate flow packets
        const pkts: FlowPacket[] = events.slice(0, 8).map((ev, i) => ({
          id: `pkt-${i}-${Date.now()}`,
          direction: ev.direction,
          progress: 0,
          lost: ev.lost || false,
          color: ev.color,
        }))
        setFlowPackets(pkts)

        events.forEach((ev, i) => {
          setTimeout(() => {
            addLog('tcp', `[${ev.flags || ev.type}] ${ev.direction === 'right' ? '→' : '←'} ${ev.label} ${ev.lost ? '(LOST)' : ''}`, ev.latency)
          }, i * 150)
        })
      } else {
        // Fallback: generate mock sequence for visual demo
        generateMockSequence('tcp', tcpScenario)
      }
    } catch {
      addLog('tcp', 'Simulation request failed — generating local demo')
      generateMockSequence('tcp', tcpScenario)
    }

    setTcpLoading(false)
  }

  // ── TCP Flood ──
  const simulateFlood = async () => {
    setTcpLoading(true)
    addLog('tcp', `⚠ SYN Flood attack simulation started from ${tcpSource}`)

    try {
      const res = await fetch('/?XTransformPort=3005', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'flood', sourceIp: tcpSource, destIp: tcpDest }),
      })
      const data = await res.json()
      if (data && data.events) {
        const events: SequenceEvent[] = data.events.slice(0, 12).map((ev: Record<string, unknown>, i: number) => ({
          id: `flood-${i}`,
          direction: 'right' as const,
          type: 'SYN',
          flags: 'SYN',
          color: '#3b82f6',
          label: `SYN #${i + 1}`,
          lost: Math.random() > 0.6,
          latency: Math.random() * 200 + 50,
        }))
        setSequenceEvents(events)
        const pkts = events.map((ev, i) => ({
          id: `fpkt-${i}-${Date.now()}`,
          direction: ev.direction,
          progress: 0,
          lost: ev.lost,
          color: ev.color,
        }))
        setFlowPackets(pkts)
      }
    } catch {
      // Fallback flood simulation
      const events: SequenceEvent[] = Array.from({ length: 10 }, (_, i) => ({
        id: `flood-${i}`,
        direction: 'right' as const,
        type: 'SYN',
        flags: 'SYN',
        color: '#3b82f6',
        label: `SYN #${i + 1}`,
        lost: Math.random() > 0.5,
        latency: Math.random() * 300 + 50,
      }))
      setSequenceEvents(events)
      const pkts = events.map((ev, i) => ({
        id: `fpkt-${i}-${Date.now()}`,
        direction: ev.direction,
        progress: 0,
        lost: ev.lost,
        color: ev.color,
      }))
      setFlowPackets(pkts)
    }

    addLog('tcp', '⚠ SYN Flood complete — multiple SYN packets without ACK response')
    setTcpLoading(false)
  }

  // ── UDP Simulation ──
  const runUdpSimulation = async () => {
    setUdpLoading(true)
    addLog('udp', `Starting "${udpScenario}" simulation: ${udpSource} → ${udpDest}`)
    setSequenceEvents([])

    try {
      const res = await fetch('/?XTransformPort=3006', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: udpScenario,
          sourceIp: udpSource,
          destIp: udpDest,
        }),
      })
      const data = await res.json()
      if (data && data.events) {
        const events: SequenceEvent[] = data.events.map((ev: Record<string, unknown>, i: number) => ({
          id: `udp-seq-${i}`,
          direction: (ev.direction as 'right' | 'left') || (i % 2 === 0 ? 'right' : 'left'),
          type: (ev.type as string) || 'DATA',
          flags: (ev.flags as string) || udpScenario.toUpperCase().split(' ')[0],
          color: FLAG_COLORS[(ev.flags as string)] || FLAG_COLORS[udpScenario.toUpperCase().split(' ')[0]] || '#22c55e',
          label: (ev.label as string) || '',
          lost: (ev.lost as boolean) || false,
          latency: (ev.latency as number) || undefined,
        }))
        setSequenceEvents(events)
        const pkts = events.slice(0, 8).map((ev, i) => ({
          id: `udp-pkt-${i}-${Date.now()}`,
          direction: ev.direction,
          progress: 0,
          lost: ev.lost,
          color: ev.color,
        }))
        setFlowPackets(pkts)
        events.forEach((ev, i) => {
          setTimeout(() => {
            addLog('udp', `[${ev.flags || ev.type}] ${ev.direction === 'right' ? '→' : '←'} ${ev.label} ${ev.lost ? '(LOST)' : ''}`, ev.latency)
          }, i * 150)
        })
      } else {
        generateMockSequence('udp', udpScenario)
      }
    } catch {
      addLog('udp', 'Simulation request failed — generating local demo')
      generateMockSequence('udp', udpScenario)
    }
    setUdpLoading(false)
  }

  // ── UDP Broadcast ──
  const runBroadcast = async () => {
    setUdpLoading(true)
    addLog('udp', `Broadcast test initiated from ${udpSource}`)
    try {
      await fetch('/?XTransformPort=3006', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'broadcast', sourceIp: udpSource }),
      })
    } catch {
      // silent
    }
    const events: SequenceEvent[] = [
      { id: 'bc-0', direction: 'right', type: 'BROADCAST', flags: 'STREAM', color: '#a855f7', label: 'Broadcast packet sent' },
      { id: 'bc-1', direction: 'left', type: 'ACK', flags: 'ACK', color: '#22c55e', label: 'Node 1 received' },
      { id: 'bc-2', direction: 'left', type: 'ACK', flags: 'ACK', color: '#22c55e', label: 'Node 2 received' },
      { id: 'bc-3', direction: 'left', type: 'ACK', flags: 'LOST', color: '#6b7280', label: 'Node 3 missed', lost: true },
    ]
    setSequenceEvents(events)
    setFlowPackets(events.map((ev, i) => ({
      id: `bc-pkt-${i}`, direction: ev.direction, progress: 0, lost: ev.lost || false, color: ev.color,
    })))
    addLog('udp', 'Broadcast complete: 2/3 nodes responded (1 packet lost)')
    setUdpLoading(false)
  }

  // ── UDP Compare ──
  const runCompare = async () => {
    setShowCompare(true)
    addLog('udp', 'Fetching TCP vs UDP comparison data...')
    try {
      const res = await fetch('/?XTransformPort=3006', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'compare' }),
      })
      const data = await res.json()
      if (data) {
        setCompareData(data)
        addLog('udp', 'Comparison data received from service')
        return
      }
    } catch {
      // silent
    }
    setCompareData(COMPARE_DEFAULT)
    addLog('udp', 'Using default comparison data')
  }

  // ── WebSocket Connect/Disconnect ──
  const toggleWebSocket = () => {
    if (wsConnected) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setWsConnected(false)
      addLog('websocket', 'Disconnected from WebSocket server')
      return
    }

    try {
      const socket = io('/?XTransformPort=3004', {
        transports: ['websocket'],
        reconnection: false,
      })

      socket.on('connect', () => {
        setWsConnected(true)
        addLog('websocket', `Connected to ${wsUrl} (id: ${socket.id?.slice(0, 8)})`)
        setSequenceEvents([
          { id: 'ws-0', direction: 'right', type: 'HANDSHAKE', flags: 'SYN', color: '#3b82f6', label: 'HTTP Upgrade request' },
          { id: 'ws-1', direction: 'left', type: 'HANDSHAKE', flags: 'ACK', color: '#22c55e', label: '101 Switching Protocols' },
          { id: 'ws-2', direction: 'right', type: 'DATA', flags: 'DATA', color: '#a855f7', label: 'Connection established' },
        ])
        setFlowPackets([
          { id: 'ws-pkt-0', direction: 'right', progress: 0, lost: false, color: '#3b82f6' },
          { id: 'ws-pkt-1', direction: 'left', progress: 0, lost: false, color: '#22c55e' },
          { id: 'ws-pkt-2', direction: 'right', progress: 0, lost: false, color: '#a855f7' },
        ])
      })

      socket.on('message', (msg: string) => {
        setWsMessages((prev) => [...prev.slice(-19), msg])
        addLog('websocket', `Received: ${msg}`)
        setSequenceEvents((prev) => [
          ...prev.slice(-11),
          {
            id: `ws-msg-${Date.now()}`,
            direction: 'left',
            type: 'DATA',
            flags: 'DATA',
            color: '#a855f7',
            label: msg.slice(0, 30),
          },
        ])
        setFlowPackets((prev) => [
          ...prev.slice(-7),
          { id: `ws-fpkt-${Date.now()}`, direction: 'left', progress: 0, lost: false, color: '#a855f7' },
        ])
      })

      socket.on('disconnect', () => {
        setWsConnected(false)
        addLog('websocket', 'WebSocket connection closed')
      })

      socket.on('connect_error', () => {
        addLog('websocket', 'Connection failed — retry or check URL')
      })

      socketRef.current = socket
    } catch {
      addLog('websocket', 'Failed to initialize WebSocket connection')
    }
  }

  // ── WebSocket Send ──
  const sendWsMessage = () => {
    if (!wsConnected || !wsMessage.trim()) return
    socketRef.current?.emit('message', wsMessage)
    addLog('websocket', `Sent: ${wsMessage}`)
    setSequenceEvents((prev) => [
      ...prev.slice(-11),
      {
        id: `ws-send-${Date.now()}`,
        direction: 'right',
        type: 'DATA',
        flags: 'PSH',
        color: '#a855f7',
        label: wsMessage.slice(0, 30),
      },
    ])
    setFlowPackets((prev) => [
      ...prev.slice(-7),
      { id: `ws-spkt-${Date.now()}`, direction: 'right', progress: 0, lost: false, color: '#a855f7' },
    ])
    setWsMessage('')
  }

  // ── Mock Sequence Generator (fallback when service unavailable) ──
  const generateMockSequence = (protocol: ProtocolTab, scenario: string) => {
    let events: SequenceEvent[] = []

    if (protocol === 'tcp') {
      if (scenario === 'TCP Handshake') {
        events = [
          { id: 'm-0', direction: 'right', type: 'SYN', flags: 'SYN', seq: 'seq=100', color: '#3b82f6', label: 'SYN' },
          { id: 'm-1', direction: 'left', type: 'SYN+ACK', flags: 'SYN+ACK', seq: 'seq=300', ack: 'ack=101', color: '#3b82f6', label: 'SYN-ACK' },
          { id: 'm-2', direction: 'right', type: 'ACK', flags: 'ACK', ack: 'ack=301', color: '#22c55e', label: 'ACK' },
        ]
      } else if (scenario === 'Data Transfer') {
        events = [
          { id: 'm-0', direction: 'right', type: 'DATA', flags: 'PSH+ACK', seq: 'seq=1000', ack: 'ack=301', color: '#a855f7', label: 'Data [0-1460]' },
          { id: 'm-1', direction: 'left', type: 'ACK', flags: 'ACK', ack: 'ack=2461', color: '#22c55e', label: 'ACK' },
          { id: 'm-2', direction: 'right', type: 'DATA', flags: 'PSH+ACK', seq: 'seq=2461', ack: 'ack=301', color: '#a855f7', label: 'Data [1460-2920]' },
          { id: 'm-3', direction: 'right', type: 'DATA', flags: 'PSH+ACK', seq: 'seq=3921', ack: 'ack=301', color: '#a855f7', label: 'Data [2920-4380]' },
          { id: 'm-4', direction: 'left', type: 'LOST', flags: 'LOST', color: '#6b7280', label: 'Packet lost', lost: true, latency: 0 },
          { id: 'm-5', direction: 'left', type: 'ACK', flags: 'ACK', ack: 'ack=2461', color: '#22c55e', label: 'ACK (dup)' },
          { id: 'm-6', direction: 'right', type: 'DATA', flags: 'PSH+ACK', seq: 'seq=2461', ack: 'ack=301', color: '#a855f7', label: 'Retransmit' },
          { id: 'm-7', direction: 'left', type: 'ACK', flags: 'ACK', ack: 'ack=4381', color: '#22c55e', label: 'ACK all' },
        ]
      } else {
        events = [
          { id: 'm-0', direction: 'right', type: 'FIN', flags: 'FIN+ACK', seq: 'seq=5000', ack: 'ack=301', color: '#ef4444', label: 'FIN' },
          { id: 'm-1', direction: 'left', type: 'ACK', flags: 'ACK', ack: 'ack=5001', color: '#22c55e', label: 'ACK' },
          { id: 'm-2', direction: 'left', type: 'FIN', flags: 'FIN+ACK', seq: 'seq=300', ack: 'ack=5001', color: '#ef4444', label: 'FIN' },
          { id: 'm-3', direction: 'right', type: 'ACK', flags: 'ACK', ack: 'ack=301', color: '#22c55e', label: 'ACK' },
        ]
      }
    } else if (protocol === 'udp') {
      const baseEvents: SequenceEvent[] = [
        { id: 'm-0', direction: 'right', type: scenario.toUpperCase().split(' ')[0], flags: scenario.toUpperCase().split(' ')[0], color: FLAG_COLORS[scenario.toUpperCase().split(' ')[0]] || '#22c55e', label: `${scenario} request` },
      ]
      if (scenario === 'DNS Query') {
        baseEvents.push(
          { id: 'm-1', direction: 'left', type: 'DNS', flags: 'DNS', color: '#22c55e', label: 'DNS Response', latency: 12.3 },
        )
      } else {
        baseEvents.push(
          { id: 'm-1', direction: 'right', type: 'DATA', flags: 'STREAM', color: '#a855f7', label: 'Datagram 1' },
          { id: 'm-2', direction: 'right', type: 'DATA', flags: 'STREAM', color: '#a855f7', label: 'Datagram 2' },
          { id: 'm-3', direction: 'right', type: 'LOST', flags: 'LOST', color: '#6b7280', label: 'Lost packet', lost: true },
          { id: 'm-4', direction: 'right', type: 'DATA', flags: 'STREAM', color: '#a855f7', label: 'Datagram 3' },
          { id: 'm-5', direction: 'left', type: 'ACK', flags: 'ACK', color: '#22c55e', label: 'Receiver ACK' },
        )
      }
      events = baseEvents
    }

    setSequenceEvents(events)
    setFlowPackets(events.map((ev, i) => ({
      id: `mock-pkt-${i}-${Date.now()}`,
      direction: ev.direction,
      progress: 0,
      lost: ev.lost || false,
      color: ev.color,
    })))

    events.forEach((ev, i) => {
      setTimeout(() => {
        addLog(protocol, `[${ev.flags || ev.type}] ${ev.direction === 'right' ? '→' : '←'} ${ev.label} ${ev.lost ? '(LOST)' : ''}`, ev.latency)
      }, i * 200)
    })
  }

  // ── Stat Card Color Helper ──
  const getStatColor = (key: keyof Stats, value: number) => {
    if (key === 'packetsLost') return value > 5 ? 'text-red-500' : value > 0 ? 'text-amber-500' : 'text-emerald-500'
    if (key === 'avgLatency') return value > 100 ? 'text-red-500' : value > 50 ? 'text-amber-500' : 'text-emerald-500'
    return 'text-gray-900'
  }

  // ── Cleanup WebSocket on unmount ──
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-full p-4 sm:p-6 space-y-6"
    >
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] shadow-lg shadow-[#6c5ce7]/20">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            Network Analysis Lab
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Real-time protocol simulation &amp; visualization engine
          </p>
        </div>
      </motion.div>

      {/* ── 3-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] xl:grid-cols-[320px_1fr_320px] gap-4 sm:gap-6">
        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* LEFT COLUMN — Protocol Controls                                     */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <motion.div variants={itemVariants} className="space-y-4">
          <Card className="relative overflow-hidden border-gray-200 shadow-sm">
            {/* Animated gradient border for active tab */}
            <div
              className="absolute inset-x-0 top-0 h-0.5 z-10"
              style={{
                background: activeTab === 'tcp'
                  ? 'linear-gradient(90deg, #3b82f6, #6c5ce7)'
                  : activeTab === 'udp'
                    ? 'linear-gradient(90deg, #22c55e, #06b6d4)'
                    : 'linear-gradient(90deg, #a855f7, #ec4899)',
              }}
            />

            <CardContent className="p-4 space-y-4">
              {/* Protocol Selector Tabs */}
              <div className="flex rounded-lg bg-gray-100 p-1 gap-1">
                {([
                  { key: 'tcp' as const, label: 'TCP', icon: Shield },
                  { key: 'udp' as const, label: 'UDP', icon: Radio },
                  { key: 'websocket' as const, label: 'WebSocket', icon: Globe },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key)
                      setActiveStatsProtocol(tab.key)
                    }}
                    className={`
                      relative flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-all duration-200
                      ${activeTab === tab.key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                      }
                    `}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {activeTab === tab.key && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-md border border-gray-200"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              <Separator />

              {/* ── TCP Controls ── */}
              <AnimatePresence mode="wait">
                {activeTab === 'tcp' && (
                  <motion.div
                    key="tcp"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Source IP</label>
                      <Input
                        value={tcpSource}
                        onChange={(e) => setTcpSource(e.target.value)}
                        placeholder="192.168.1.100"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Destination IP</label>
                      <Input
                        value={tcpDest}
                        onChange={(e) => setTcpDest(e.target.value)}
                        placeholder="10.0.0.1"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Scenario</label>
                      <Select value={tcpScenario} onValueChange={setTcpScenario}>
                        <SelectTrigger className="h-8 w-full text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TCP_SCENARIOS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={runTcpSimulation}
                      disabled={tcpLoading}
                      className="w-full bg-[#6c5ce7] hover:bg-[#5a4bd6] text-white text-sm font-medium h-9 gap-2"
                    >
                      {tcpLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        >
                          <Zap className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Run Simulation
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={simulateFlood}
                      disabled={tcpLoading}
                      className="w-full text-xs h-7 gap-1.5"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Simulate SYN Flood
                    </Button>
                  </motion.div>
                )}

                {/* ── UDP Controls ── */}
                {activeTab === 'udp' && (
                  <motion.div
                    key="udp"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Source IP</label>
                      <Input
                        value={udpSource}
                        onChange={(e) => setUdpSource(e.target.value)}
                        placeholder="192.168.1.100"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Destination IP</label>
                      <Input
                        value={udpDest}
                        onChange={(e) => setUdpDest(e.target.value)}
                        placeholder="10.0.0.1"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Scenario</label>
                      <Select value={udpScenario} onValueChange={setUdpScenario}>
                        <SelectTrigger className="h-8 w-full text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UDP_SCENARIOS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={runUdpSimulation}
                      disabled={udpLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium h-9 gap-2"
                    >
                      {udpLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        >
                          <Zap className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Run Simulation
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        onClick={runBroadcast}
                        disabled={udpLoading}
                        className="text-xs h-7"
                      >
                        <Radio className="h-3 w-3 mr-1" />
                        Broadcast
                      </Button>
                      <Button
                        variant="outline"
                        onClick={runCompare}
                        className="text-xs h-7"
                      >
                        <Activity className="h-3 w-3 mr-1" />
                        Compare
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ── WebSocket Controls ── */}
                {activeTab === 'websocket' && (
                  <motion.div
                    key="websocket"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Connection URL</label>
                      <Input
                        value={wsUrl}
                        onChange={(e) => setWsUrl(e.target.value)}
                        placeholder="ws://localhost:4000"
                        className="h-8 text-sm font-mono"
                        disabled={wsConnected}
                      />
                    </div>

                    {/* Connection Status */}
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                      <div className="relative">
                        <span
                          className={`block h-2.5 w-2.5 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-gray-400'}`}
                        />
                        {wsConnected && (
                          <span className="absolute inset-0 h-2.5 w-2.5 animate-ping rounded-full bg-emerald-500/75" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {wsConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>

                    <Button
                      onClick={toggleWebSocket}
                      variant={wsConnected ? 'destructive' : 'default'}
                      className={`w-full text-sm font-medium h-9 gap-2 ${!wsConnected ? 'bg-[#a855f7] hover:bg-[#9333ea] text-white' : ''}`}
                    >
                      {wsConnected ? (
                        <>
                          <Square className="h-4 w-4" />
                          Disconnect
                        </>
                      ) : (
                        <>
                          <Wifi className="h-4 w-4" />
                          Connect
                        </>
                      )}
                    </Button>

                    <Separator />

                    {/* Message Input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Message</label>
                      <div className="flex gap-2">
                        <Input
                          value={wsMessage}
                          onChange={(e) => setWsMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendWsMessage()}
                          placeholder="Type a message..."
                          className="h-8 text-sm flex-1"
                          disabled={!wsConnected}
                        />
                        <Button
                          size="sm"
                          onClick={sendWsMessage}
                          disabled={!wsConnected || !wsMessage.trim()}
                          className="h-8 w-8 p-0 bg-[#a855f7] hover:bg-[#9333ea]"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* WS Messages */}
                    {wsMessages.length > 0 && (
                      <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg bg-gray-900 p-2">
                        {wsMessages.map((msg, i) => (
                          <div key={i} className="text-[11px] font-mono text-emerald-400">
                            &lt; {msg}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* CENTER COLUMN — Visualizations                                      */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <motion.div variants={itemVariants} className="space-y-4">
          {/* Protocol Sequence Diagram */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Activity className="h-4 w-4 text-[#6c5ce7]" />
                Protocol Sequence Diagram
                <Badge variant="outline" className="ml-auto text-[10px] font-mono">
                  {activeTab.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="relative min-h-[280px] sm:min-h-[320px] rounded-xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 p-3">
                {/* Lane headers */}
                <div className="flex justify-between mb-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                      <Server className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500">
                      {activeTab === 'tcp' ? tcpSource : activeTab === 'udp' ? udpSource : 'Client'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                      <Globe className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500">
                      {activeTab === 'tcp' ? tcpDest : activeTab === 'udp' ? udpDest : 'Server'}
                    </span>
                  </div>
                </div>

                {/* Vertical lanes */}
                <div className="relative">
                  <div className="absolute left-[11%] top-0 bottom-0 w-px bg-gray-200" />
                  <div className="absolute right-[11%] top-0 bottom-0 w-px bg-gray-200" />

                  {/* Events */}
                  <div className="relative min-h-[200px]">
                    {sequenceEvents.length === 0 ? (
                      <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
                        <div className="text-center">
                          <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>Run a simulation to see the sequence diagram</p>
                        </div>
                      </div>
                    ) : (
                      <ScrollArea className="max-h-[260px] overflow-y-auto">
                        <div className="py-2">
                          {sequenceEvents.map((event, i) => (
                            <SequenceArrow key={event.id} event={event} index={i} />
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Packet Flow Visualization */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Zap className="h-4 w-4 text-amber-500" />
                Packet Flow Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <PacketFlowViz packets={flowPackets} />
              <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 px-1">
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Source
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    Active
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-red-500 text-xs font-bold">✕</span>
                    Lost
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  Destination
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* RIGHT COLUMN — Stats & Reference                                    */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <motion.div variants={itemVariants} className="space-y-4">
          {/* Live Statistics */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Live Statistics
                </CardTitle>
                <div className="relative">
                  <span className="block h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-emerald-500/50" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2.5">
              {([
                { key: 'packetsSent' as keyof Stats, label: 'Packets Sent', icon: ArrowRight, unit: '' },
                { key: 'packetsReceived' as keyof Stats, label: 'Packets Received', icon: ArrowLeft, unit: '' },
                { key: 'packetsLost' as keyof Stats, label: 'Packets Lost', icon: AlertTriangle, unit: '' },
                { key: 'avgLatency' as keyof Stats, label: 'Avg Latency', icon: Clock, unit: 'ms' },
                { key: 'throughput' as keyof Stats, label: 'Throughput', icon: Wifi, unit: ' KB/s' },
              ]).map((stat) => {
                const Icon = stat.icon
                const val = stats[stat.key]
                const colorClass = getStatColor(stat.key, val)
                return (
                  <motion.div
                    key={stat.key}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-600">{stat.label}</span>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${colorClass}`}>
                      <AnimatedNumber
                        value={val}
                        decimals={stat.key === 'avgLatency' || stat.key === 'throughput' ? 1 : 0}
                      />
                      {stat.unit}
                    </span>
                  </motion.div>
                )
              })}
            </CardContent>
          </Card>

          {/* Comparison Panel */}
          <AnimatePresence>
            {showCompare && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-gray-200 shadow-sm overflow-hidden">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-gray-700">
                        TCP vs UDP
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setShowCompare(false)}
                      >
                        ✕
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {([
                        { label: 'Reliability', tcp: compareData?.tcp.reliability || 'High', udp: compareData?.udp.reliability || 'Low' },
                        { label: 'Speed', tcp: compareData?.tcp.speed || 'Moderate', udp: compareData?.udp.speed || 'Fast' },
                        { label: 'Overhead', tcp: compareData?.tcp.overhead || 'High', udp: compareData?.udp.overhead || 'Low' },
                        { label: 'Use Case', tcp: compareData?.tcp.useCase || 'Web, Email', udp: compareData?.udp.useCase || 'Streaming, DNS' },
                      ]).map((row) => (
                        <div key={row.label} className="grid grid-cols-3 gap-2 text-[11px]">
                          <span className="font-semibold text-gray-500 py-1">{row.label}</span>
                          <span className="text-blue-600 font-medium text-center py-1 rounded bg-blue-50">{row.tcp}</span>
                          <span className="text-emerald-600 font-medium text-center py-1 rounded bg-emerald-50">{row.udp}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-[10px] font-bold text-gray-400 pt-1">
                        <span />
                        <span className="text-blue-500">TCP</span>
                        <span className="text-emerald-500">UDP</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Protocol Reference */}
          <Collapsible open={refOpen} onOpenChange={setRefOpen}>
            <Card className="border-gray-200 shadow-sm overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="pb-2 pt-4 px-4 cursor-pointer hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Shield className="h-4 w-4 text-gray-400" />
                      Protocol Reference
                    </CardTitle>
                    {refOpen ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-4 pb-4 space-y-3">
                  {/* TCP Header */}
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">TCP Header Fields</p>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { flag: 'SYN', color: 'bg-blue-500', desc: 'Synchronize' },
                        { flag: 'ACK', color: 'bg-green-500', desc: 'Acknowledgment' },
                        { flag: 'FIN', color: 'bg-red-500', desc: 'Finish' },
                        { flag: 'RST', color: 'bg-orange-500', desc: 'Reset' },
                        { flag: 'PSH', color: 'bg-purple-500', desc: 'Push' },
                        { flag: 'URG', color: 'bg-amber-500', desc: 'Urgent' },
                      ].map((f) => (
                        <div key={f.flag} className="flex items-center gap-1.5 rounded bg-gray-50 px-2 py-1">
                          <span className={`h-2 w-2 rounded-full ${f.color}`} />
                          <span className="text-[10px] font-bold text-gray-700">{f.flag}</span>
                          <span className="text-[10px] text-gray-400">— {f.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  {/* UDP Header */}
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">UDP Header Fields</p>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { flag: 'SRC PORT', color: 'bg-emerald-500', desc: 'Source Port' },
                        { flag: 'DST PORT', color: 'bg-cyan-500', desc: 'Dest Port' },
                        { flag: 'LENGTH', color: 'bg-violet-500', desc: 'Datagram Length' },
                        { flag: 'CHECKSUM', color: 'bg-pink-500', desc: 'Error Check' },
                      ].map((f) => (
                        <div key={f.flag} className="flex items-center gap-1.5 rounded bg-gray-50 px-2 py-1">
                          <span className={`h-2 w-2 rounded-full ${f.color}`} />
                          <span className="text-[10px] font-bold text-gray-700">{f.flag}</span>
                          <span className="text-[10px] text-gray-400">— {f.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* BOTTOM — Packet Log (Terminal Style)                                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Terminal className="h-4 w-4 text-gray-500" />
              Packet Log
              <Badge variant="secondary" className="ml-auto text-[10px] tabular-nums">
                {logs.length} entries
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div
              className="bg-gray-950 text-gray-300 font-mono text-[11px] leading-relaxed overflow-y-auto"
              style={{ maxHeight: '220px' }}
            >
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-800 bg-gray-900 px-4 py-1.5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                </div>
                <span className="text-[10px] text-gray-500 ml-2">zenith://network-analysis/log</span>
              </div>
              <div className="p-4 space-y-0.5">
                {logs.length === 0 ? (
                  <div className="text-gray-600 text-center py-8">
                    <Terminal className="h-6 w-6 mx-auto mb-2 text-gray-700" />
                    <p>Waiting for simulation events...</p>
                  </div>
                ) : (
                  logs.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-start gap-2 py-0.5"
                    >
                      <span className="text-gray-600 shrink-0">{entry.timestamp}</span>
                      <span
                        className={`shrink-0 font-bold px-1.5 py-0 rounded text-[10px] ${
                          entry.protocol === 'tcp'
                            ? 'text-blue-400 bg-blue-400/10'
                            : entry.protocol === 'udp'
                              ? 'text-emerald-400 bg-emerald-400/10'
                              : 'text-purple-400 bg-purple-400/10'
                        }`}
                      >
                        {entry.protocol.toUpperCase()}
                      </span>
                      <span className="text-gray-400 break-all">{entry.event}</span>
                      {entry.latency != null && (
                        <span className="text-gray-600 shrink-0 ml-auto tabular-nums">
                          {entry.latency.toFixed(1)}ms
                        </span>
                      )}
                    </motion.div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}