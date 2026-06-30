'use client'

import { motion } from 'framer-motion'
import { BarChart3, Shield, Cpu, Fingerprint } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/app'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const skills = [
  { name: 'Core Optimization', level: 4, max: 5, color: 'bg-[#6c5ce7]' },
  { name: 'Network Security', level: 3, max: 5, color: 'bg-blue-500' },
  { name: 'Protocol Analysis', level: 5, max: 5, color: 'bg-green-500' },
  { name: 'Cryptography', level: 2, max: 5, color: 'bg-[#6c5ce7]' },
]

const resources = [
  { label: 'NEURAL BANDWIDTH', value: 88, color: 'bg-[#6c5ce7]' },
  { label: 'SIMULATION UPTIME', value: 99.9, color: 'bg-blue-500' },
  { label: 'LOGIC INTEGRITY', value: 94, color: 'bg-green-500' },
]

const quickStats = [
  { label: 'Simulations', value: '142', icon: Cpu },
  { label: 'Hours', value: '2,847', icon: Shield },
  { label: 'Rank', value: '#12', icon: Fingerprint },
  { label: 'Score', value: '98.2%', icon: BarChart3 },
]

function SkillBar({ level, max, color }: { level: number; max: number; color: string }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 flex-1 rounded-full transition-all',
            i < level ? color : 'bg-gray-200'
          )}
        />
      ))}
    </div>
  )
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function DashboardView() {
  const { user } = useAppStore()

  const displayName = user?.name || "Alex 'Cipher' Sterling"
  const level = user?.level ?? 42
  const initials = displayName
    .replace(/[^a-zA-Z\s]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <motion.div
      className="min-h-full bg-[#f8f9fa] p-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-col lg:flex-row gap-6 max-w-[1400px] mx-auto">
        {/* Left Column (65%) */}
        <div className="flex flex-col gap-6 lg:w-[65%]">
          {/* Profile Card */}
          <motion.div variants={item}>
            <Card className="rounded-xl p-6 gap-0">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className="w-[120px] h-[120px] rounded-full flex items-center justify-center text-white text-3xl font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 50%, #74b9ff 100%)',
                      }}
                    >
                      {initials}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-3 flex-1 min-w-0">
                    {/* Level badge */}
                    <Badge className="w-fit rounded-full bg-[#6c5ce7] text-white text-xs font-semibold px-3 py-1">
                      LEVEL {String(level).padStart(3, '0')}
                    </Badge>

                    {/* Name */}
                    <h2 className="text-xl font-bold text-gray-900 truncate">
                      {displayName}
                    </h2>

                    {/* Bio */}
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Specialized in advanced network simulation and cryptographic protocol analysis. 
                      Focused on building resilient distributed systems and real-time threat detection frameworks.
                    </p>

                    {/* Status + buttons row */}
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <Badge
                        variant="outline"
                        className="border-green-500/30 bg-green-500/10 text-green-600 gap-1.5 text-xs px-3 py-1"
                      >
                        <span className="relative flex size-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                          <span className="relative inline-flex rounded-full size-2 bg-green-500" />
                        </span>
                        SYSTEM ONLINE
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs font-semibold border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Shield className="size-3.5 mr-1.5" />
                        MASTER RANK
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs font-semibold border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Fingerprint className="size-3.5 mr-1.5" />
                        CORE VERIFIED
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Skill Matrix Card */}
          <motion.div variants={item}>
            <Card className="rounded-xl p-6 gap-0">
              <CardContent className="p-0">
                <h3 className="text-base font-semibold text-gray-900 mb-5">Skill Matrix</h3>
                <div className="flex flex-col gap-4">
                  {skills.map((skill) => (
                    <div key={skill.name} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 font-medium">{skill.name}</span>
                        <span className="text-xs text-gray-400">
                          {skill.level}/{skill.max}
                        </span>
                      </div>
                      <SkillBar level={skill.level} max={skill.max} color={skill.color} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column (35%) */}
        <div className="flex flex-col gap-6 lg:w-[35%]">
          {/* Resource Utilization Card */}
          <motion.div variants={item}>
            <Card className="rounded-xl border-l-4 border-l-blue-500 p-6 gap-0">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 className="size-5 text-blue-500" />
                  <h3 className="text-base font-semibold text-gray-900">Resource Utilization</h3>
                </div>
                <div className="flex flex-col gap-5">
                  {resources.map((res) => (
                    <div key={res.label} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 tracking-wide">
                          {res.label}
                        </span>
                        <span className="text-sm font-bold text-gray-900">{res.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className={cn('h-full rounded-full', res.color)}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(res.value, 100)}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Stats Card */}
          <motion.div variants={item}>
            <Card className="rounded-xl p-6 gap-0">
              <CardContent className="p-0">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  {quickStats.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <div
                        key={stat.label}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50"
                      >
                        <Icon className="size-5 text-gray-400" />
                        <span className="text-xl font-bold text-gray-900">{stat.value}</span>
                        <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}