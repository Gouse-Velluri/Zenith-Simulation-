'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Shield,
  Activity,
  Cpu,
  Wifi,
  Zap,
  Clock,
  Globe,
  ArrowUpRight,
  Eye,
  Link2,
  GraduationCap,
  Server,
  Award,
  Layers,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

const operators = [
  {
    id: 1,
    name: 'Elena Vance',
    level: 7,
    role: 'Senior Operator',
    specialization: 'Cloud Architect',
    status: 'Live Session',
    load: 78,
    avatar: 'EV',
    color: 'bg-purple-500',
  },
  {
    id: 2,
    name: 'Julian Thorne',
    level: 5,
    role: 'Security Lead',
    specialization: 'Security Analyst',
    status: 'Standby',
    load: 12,
    avatar: 'JT',
    color: 'bg-emerald-500',
  },
  {
    id: 3,
    name: 'Sarah Chen',
    level: 8,
    role: 'Neural Systems',
    specialization: 'AI Research',
    status: 'Live Session',
    load: 91,
    avatar: 'SC',
    color: 'bg-orange-500',
  },
  {
    id: 4,
    name: 'Marcus Vane',
    level: 9,
    role: 'Architect',
    specialization: 'Cloud Architect',
    status: 'Live Session',
    load: 85,
    avatar: 'MV',
    color: 'bg-blue-500',
  },
  {
    id: 5,
    name: 'Lia Kostic',
    level: 6,
    role: 'Protocol Expert',
    specialization: 'Security Analyst',
    status: 'Live Session',
    load: 67,
    avatar: 'LK',
    color: 'bg-pink-500',
  },
]

const specializations = [
  'All Specializations',
  'Cloud Architect',
  'Security Analyst',
  'Data Engineer',
  'AI Research',
]

const mentors = [
  {
    name: 'Marcus Vane',
    level: 'L9',
    expertise: 'Scalability',
    avatar: 'MV',
    color: 'bg-blue-500',
  },
  {
    name: 'Lia Kostic',
    level: 'L6',
    expertise: 'Security Protocols',
    avatar: 'LK',
    color: 'bg-pink-500',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

function getLoadColor(load: number) {
  if (load >= 85) return 'bg-red-500'
  if (load >= 60) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function getStatusColor(status: string) {
  if (status === 'Live Session') return 'bg-emerald-500'
  if (status === 'Standby') return 'bg-amber-500'
  return 'bg-gray-400'
}

function getSpecializationVariant(
  spec: string
): 'default' | 'secondary' | 'outline' | 'destructive' {
  const map: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    'Cloud Architect': 'outline',
    'Security Analyst': 'secondary',
    'Data Engineer': 'outline',
    'AI Research': 'default',
  }
  return map[spec] || 'outline'
}

export default function NetworkHubView() {
  const [activeFilter, setActiveFilter] = useState('All Specializations')

  const filteredOperators =
    activeFilter === 'All Specializations'
      ? operators
      : operators.filter((op) => op.specialization === activeFilter)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gray-50/50"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Network Hub
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor active simulations and operators across the professional Zenith
            network.
          </p>
        </div>

        {/* Operator count */}
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex -space-x-2">
            {[
              'bg-purple-500',
              'bg-emerald-500',
              'bg-orange-500',
            ].map((bg, i) => (
              <div
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-full ${bg} text-[10px] font-semibold text-white ring-2 ring-white`}
              >
                {['EV', 'JT', 'SC'][i]}
              </div>
            ))}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600 ring-2 ring-white">
              +12
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">42 Active Operators Online</p>
            <p className="text-xs text-gray-500">Across all regions</p>
          </div>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div variants={itemVariants} className="mb-6 flex flex-wrap gap-2">
        {specializations.map((spec) => (
          <button
            key={spec}
            onClick={() => setActiveFilter(spec)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              activeFilter === spec
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {spec}
          </button>
        ))}
      </motion.div>

      {/* Main Grid: Table + Sidebar */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        {/* Operator Table */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-gray-200 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="pl-6 font-semibold text-gray-600">Operator</TableHead>
                    <TableHead className="font-semibold text-gray-600">Specialization</TableHead>
                    <TableHead className="font-semibold text-gray-600">Status</TableHead>
                    <TableHead className="font-semibold text-gray-600">Load</TableHead>
                    <TableHead className="pr-6 text-right font-semibold text-gray-600">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredOperators.map((op) => (
                      <motion.tr
                        key={op.id}
                        layout
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.3 }}
                        className="group border-b last:border-0 transition-colors hover:bg-gray-50/50"
                      >
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${op.color} text-xs font-bold text-white`}
                            >
                              {op.avatar}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{op.name}</p>
                              <p className="text-xs text-gray-500">
                                L{op.level} {op.role}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant={getSpecializationVariant(op.specialization)} className="text-xs">
                            {op.specialization}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${getStatusColor(op.status)} ${op.status === 'Live Session' ? 'animate-pulse' : ''}`} />
                            <span className="text-sm text-gray-700">{op.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <Progress
                              value={op.load}
                              className="h-2 w-20 bg-gray-100 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-amber-500"
                            />
                            <span className="w-10 text-right text-xs font-medium text-gray-600">
                              {op.load}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-xs border-gray-200 text-gray-600 hover:text-purple-600 hover:border-purple-300"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View Node
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 gap-1 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              Connect
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Sidebar */}
        <motion.aside variants={itemVariants} className="flex flex-col gap-4">
          {/* Mentorship Hub */}
          <div className="rounded-xl bg-[#1a1f36] p-4 text-white shadow-lg">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-400" />
              <h3 className="font-semibold">Mentorship Hub</h3>
            </div>
            <p className="mb-4 text-xs text-gray-400">
              Connect with senior operators for guidance and advanced training paths.
            </p>
            <div className="flex flex-col gap-3">
              {mentors.map((mentor) => (
                <div
                  key={mentor.name}
                  className="flex items-center gap-3 rounded-lg bg-white/5 p-3"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${mentor.color} text-xs font-bold text-white`}
                  >
                    {mentor.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {mentor.name}
                      <span className="ml-1.5 text-xs text-gray-400">{mentor.level}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Expert: {mentor.expertise}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium h-9">
              <GraduationCap className="h-4 w-4 mr-1.5" />
              Apply for Mentorship
            </Button>
          </div>

          {/* System Pulse */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
                <Activity className="h-4 w-4" />
                System Pulse
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Active Instances</span>
                <span className="text-sm font-bold text-gray-900">1,204</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Global Availability</span>
                <span className="text-sm font-bold text-emerald-600">99.98%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Network Latency</span>
                <span className="text-sm font-bold text-gray-900">4.2ms</span>
              </div>
              <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-700">
                    Next global maintenance window: Saturday 04:00 GMT
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-1 gap-3">
            <Card className="border-gray-200 shadow-sm py-0 gap-0">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                  <Award className="h-4.5 w-4.5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">New Certifications</p>
                  <p className="text-xs text-gray-500">32 Operators upgraded</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm py-0 gap-0">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <Globe className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Global Collaboration</p>
                  <p className="text-xs text-gray-500">Project Zenith North active</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm py-0 gap-0">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <Layers className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Kernel Update</p>
                  <p className="text-xs text-gray-500">v4.2.0 deployed</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.aside>
      </div>
    </motion.div>
  )
}