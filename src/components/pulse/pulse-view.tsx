'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  ArrowUp,
  ArrowDown,
  Zap,
  Cpu,
  Wifi,
  Globe,
  Shield,
  Radio,
  Server,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Types ───────────────────────────────────────────────────────
interface MetricData {
  id: string
  icon: React.ReactNode
  title: string
  value: string
  numericBase: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  trendValue: string
  sparkline: number[]
  accentColor: string
  gradientFrom: string
  gradientTo: string
}

interface LogEvent {
  id: number
  timestamp: string
  text: string
  color: string
}

// ─── Constants ───────────────────────────────────────────────────
const statusMessages = [
  'NODE_774 status update: Simulation stability at 98.4%',
  'Operator_Alpha initiated stress test on Core_C',
  'Global Sync complete: New training modules deployed',
  'NODE_332 latency spike detected: 12ms → normalizing',
  'Operator_Bravo completed L7 certification exam',
  'Cluster_EU-West health check: All nodes nominal',
  'NODE_891 memory optimization: 23% reduction achieved',
  'Firewall rule update propagated across 847 nodes',
]

const logTemplates = [
  { prefix: '[TCP]', actions: ['SYN', 'ACK', 'FIN', 'RST'], color: 'text-blue-400' },
  { prefix: '[UDP]', actions: ['DATAGRAM', 'BROADCAST', 'MULTICAST'], color: 'text-emerald-400' },
  { prefix: '[WS]', actions: ['CONNECT', 'DISCONNECT', 'PING', 'PONG'], color: 'text-purple-400' },
  { prefix: '[HTTP]', actions: ['GET', 'POST', 'PUT', 'DELETE'], color: 'text-amber-400' },
  { prefix: '[TLS]', actions: ['HANDSHAKE', 'RENEGOTIATE', 'CERT_VERIFY'], color: 'text-cyan-400' },
  { prefix: '[DNS]', actions: ['RESOLVE', 'CACHE_HIT', 'CACHE_MISS'], color: 'text-pink-400' },
]

const logStatuses = ['[ACK]', '[RELAY]', '[FORWARD]', '[DROP]', '[AUTH OK]', '[TIMEOUT]', '[OK]']

function randomIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

function randomPort(): number {
  return Math.floor(Math.random() * 60000) + 1024
}

function randomClient(): string {
  return `client_${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`
}

function generateLogEvent(id: number): LogEvent {
  const template = logTemplates[Math.floor(Math.random() * logTemplates.length)]
  const action = template.actions[Math.floor(Math.random() * template.actions.length)]
  const status = logStatuses[Math.floor(Math.random() * logStatuses.length)]
  const now = new Date()
  const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`

  let text = ''
  if (template.prefix === '[WS]') {
    text = `${template.prefix} ${action} ${randomClient()} ${status}`
  } else {
    text = `${template.prefix} ${action} → ${randomIP()}:${randomPort()} ${status}`
  }

  return { id, timestamp, text, color: template.color }
}

function generateSparkline(base: number, variance: number): number[] {
  const points: number[] = []
  let current = base
  for (let i = 0; i < 12; i++) {
    current += (Math.random() - 0.5) * variance
    current = Math.max(base * 0.7, Math.min(base * 1.3, current))
    points.push(current)
  }
  return points
}

// ─── Sparkline SVG ───────────────────────────────────────────────
function SparklineSVG({
  data,
  color = 'currentColor',
  width = 80,
  height = 28,
}: {
  data: number[]
  color?: string
  width?: number
  height?: number
}) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
    </svg>
  )
}

// ─── Container animation variants ────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ─── Main Component ──────────────────────────────────────────────
export default function PulseView() {
  const [currentStatusIdx, setCurrentStatusIdx] = useState(0)
  const [metrics, setMetrics] = useState<MetricData[]>([
    {
      id: 'throughput',
      icon: <Zap className="h-5 w-5" />,
      title: 'Packet Throughput',
      value: '12.4K/s',
      numericBase: 12400,
      unit: '/s',
      trend: 'up',
      trendValue: '+2.3%',
      sparkline: generateSparkline(12400, 800),
      accentColor: 'text-amber-600',
      gradientFrom: 'from-amber-500/20',
      gradientTo: 'to-orange-500/5',
    },
    {
      id: 'tcp',
      icon: <Activity className="h-5 w-5" />,
      title: 'TCP Connections',
      value: '2,847',
      numericBase: 2847,
      unit: '',
      trend: 'up',
      trendValue: '+142',
      sparkline: generateSparkline(2847, 200),
      accentColor: 'text-blue-600',
      gradientFrom: 'from-blue-500/20',
      gradientTo: 'to-cyan-500/5',
    },
    {
      id: 'udp',
      icon: <Wifi className="h-5 w-5" />,
      title: 'UDP Streams',
      value: '456',
      numericBase: 456,
      unit: '',
      trend: 'down',
      trendValue: '-12',
      sparkline: generateSparkline(456, 50),
      accentColor: 'text-emerald-600',
      gradientFrom: 'from-emerald-500/20',
      gradientTo: 'to-teal-500/5',
    },
    {
      id: 'latency',
      icon: <Cpu className="h-5 w-5" />,
      title: 'Latency',
      value: '4.2ms',
      numericBase: 4.2,
      unit: 'ms',
      trend: 'stable',
      trendValue: '±0.1ms',
      sparkline: generateSparkline(4.2, 0.8),
      accentColor: 'text-purple-600',
      gradientFrom: 'from-purple-500/20',
      gradientTo: 'to-violet-500/5',
    },
    {
      id: 'error',
      icon: <AlertTriangle className="h-5 w-5" />,
      title: 'Error Rate',
      value: '0.02%',
      numericBase: 0.02,
      unit: '%',
      trend: 'down',
      trendValue: '-0.005%',
      sparkline: generateSparkline(0.02, 0.008),
      accentColor: 'text-red-500',
      gradientFrom: 'from-red-500/20',
      gradientTo: 'to-rose-500/5',
    },
    {
      id: 'bandwidth',
      icon: <Globe className="h-5 w-5" />,
      title: 'Bandwidth',
      value: '847 Mbps',
      numericBase: 847,
      unit: ' Mbps',
      trend: 'up',
      trendValue: '+34 Mbps',
      sparkline: generateSparkline(847, 60),
      accentColor: 'text-cyan-600',
      gradientFrom: 'from-cyan-500/20',
      gradientTo: 'to-blue-500/5',
    },
  ])

  const [events, setEvents] = useState<LogEvent[]>(() => {
    const initial: LogEvent[] = []
    for (let i = 0; i < 10; i++) {
      initial.push(generateLogEvent(i))
    }
    return initial
  })
  const eventIdRef = useRef(10)
  const logEndRef = useRef<HTMLDivElement>(null)

  // ── Rotate status messages ──
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStatusIdx((prev) => (prev + 1) % statusMessages.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  // ── Fluctuate metrics ──
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((m) => {
          const variance = m.numericBase * 0.02
          const delta = (Math.random() - 0.5) * variance * 2
          const newBase = m.numericBase + delta
          const newSparkline = [...m.sparkline.slice(1), newBase]

          let newValue = ''
          if (m.id === 'throughput') {
            const val = newBase / 1000
            newValue = `${val.toFixed(1)}K/s`
          } else if (m.id === 'latency') {
            newValue = `${newBase.toFixed(1)}ms`
          } else if (m.id === 'error') {
            newValue = `${newBase.toFixed(3)}%`
          } else if (m.id === 'bandwidth') {
            newValue = `${Math.round(newBase)} Mbps`
          } else {
            newValue = `${Math.round(newBase).toLocaleString()}${m.unit ? ' ' + m.unit : ''}`
          }

          return { ...m, numericBase: newBase, value: newValue, sparkline: newSparkline }
        })
      )
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // ── Generate log events ──
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = generateLogEvent(eventIdRef.current)
      eventIdRef.current++
      setEvents((prev) => {
        const next = [...prev, newEvent]
        if (next.length > 20) return next.slice(-20)
        return next
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // ── Auto-scroll log ──
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gray-50/50"
    >
      {/* ── Status Bar ── */}
      <motion.div
        variants={itemVariants}
        className="mb-6 rounded-xl border border-blue-200 bg-blue-50/60 p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Live indicator */}
          <div className="flex shrink-0 items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
            </span>
            <span className="text-sm font-bold text-blue-600 tracking-wide">LIVE UPLINK</span>
          </div>

          {/* Scrolling status */}
          <div className="relative flex-1 overflow-hidden h-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStatusIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex items-center text-sm text-gray-700"
              >
                <Radio className="mr-2 h-3.5 w-3.5 shrink-0 text-blue-500" />
                {statusMessages[currentStatusIdx]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ── Metric Cards Grid ── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <motion.div key={metric.id} variants={itemVariants}>
            <Card className="relative overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              {/* Gradient border effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradientFrom} ${metric.gradientTo} opacity-50`} />
              <div className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${metric.gradientFrom} ${metric.gradientTo} ${metric.accentColor}`}
                      >
                        {metric.icon}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {metric.title}
                        </p>
                        <motion.p
                          key={metric.value}
                          initial={{ opacity: 0.7 }}
                          animate={{ opacity: 1 }}
                          className="text-xl font-bold text-gray-900 mt-0.5"
                        >
                          {metric.value}
                        </motion.p>
                      </div>
                    </div>
                    <SparklineSVG data={metric.sparkline} color={metric.accentColor.includes('amber') ? '#d97706' : metric.accentColor.includes('blue') ? '#2563eb' : metric.accentColor.includes('emerald') ? '#059669' : metric.accentColor.includes('purple') ? '#9333ea' : metric.accentColor.includes('red') ? '#ef4444' : '#0891b2'} />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    {metric.trend === 'up' && (
                      <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                    {metric.trend === 'down' && (
                      <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                    )}
                    {metric.trend === 'stable' && (
                      <Activity className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        metric.trend === 'up'
                          ? 'text-emerald-600'
                          : metric.trend === 'down'
                            ? 'text-red-500'
                            : 'text-gray-500'
                      }`}
                    >
                      {metric.trendValue}
                    </span>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Event Log ── */}
      <motion.div variants={itemVariants}>
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 pt-4 px-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
                <Server className="h-4 w-4" />
                Event Log — Real-time
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono border-emerald-300 text-emerald-600 bg-emerald-50">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                CAPTURING
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[280px]">
              <div className="bg-[#1a1f36] p-4 font-mono text-xs leading-relaxed">
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-3"
                  >
                    <span className="shrink-0 text-gray-600 select-none">
                      {event.timestamp}
                    </span>
                    <span className={`${event.color} break-all`}>
                      {event.text}
                    </span>
                  </motion.div>
                ))}
                <div ref={logEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}