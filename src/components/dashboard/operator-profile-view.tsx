'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Cpu,
  Shield,
  Fingerprint,
  BarChart3,
  Award,
  Clock,
  Trophy,
  FileCheck,
  Lock,
  Network,
  Code2,
  Layers,
  CheckCircle2,
  Activity,
  Star,
  Zap,
  Pencil,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app'
import { usePresence } from '@/hooks/use-presence'
import { useNetworkStatus } from '@/hooks/use-network-status'
import EditProfileDialog from '@/components/dashboard/edit-profile-dialog'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const stats = [
  { label: 'Simulations Run', value: '142', icon: Cpu, color: 'text-[#6c5ce7]', bg: 'bg-[#6c5ce7]/10' },
  { label: 'Labs Completed', value: '87', icon: FileCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Rank', value: '#12', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { label: 'Score', value: '98.2%', icon: BarChart3, color: 'text-green-500', bg: 'bg-green-500/10' },
]

const skills = [
  { name: 'Core Optimization', level: 4, max: 5, color: 'bg-[#6c5ce7]' },
  { name: 'Network Security', level: 3, max: 5, color: 'bg-blue-500' },
  { name: 'Protocol Analysis', level: 5, max: 5, color: 'bg-green-500' },
  { name: 'Cryptography', level: 2, max: 5, color: 'bg-[#6c5ce7]' },
  { name: 'Load Balancing', level: 4, max: 5, color: 'bg-blue-500' },
  { name: 'System Design', level: 3, max: 5, color: 'bg-green-500' },
]

const activities = [
  { text: 'Completed TCP Handshake Simulation', time: '2 hours ago', icon: CheckCircle2, color: 'text-green-500' },
  { text: 'Achieved Level 42', time: '1 day ago', icon: Star, color: 'text-amber-500' },
  { text: 'Joined Network Analysis Lab', time: '3 days ago', icon: Network, color: 'text-blue-500' },
  { text: 'Submitted Cryptography Assessment', time: '5 days ago', icon: FileCheck, color: 'text-[#6c5ce7]' },
  { text: 'Earned "Protocol Master" Badge', time: '1 week ago', icon: Award, color: 'text-amber-500' },
  { text: 'Completed Load Balancer Config Lab', time: '1 week ago', icon: Layers, color: 'text-blue-500' },
  { text: 'Started System Design Challenge', time: '2 weeks ago', icon: Code2, color: 'text-[#6c5ce7]' },
  { text: 'Finished Network Security Module', time: '2 weeks ago', icon: Shield, color: 'text-green-500' },
]

const certifications = [
  { name: 'Network Security Professional', icon: Shield, color: 'bg-blue-500', desc: 'Advanced network defense' },
  { name: 'Protocol Analysis Expert', icon: Network, color: 'bg-green-500', desc: 'Deep protocol understanding' },
  { name: 'Cryptography Specialist', icon: Lock, color: 'bg-[#6c5ce7]', desc: 'Cryptographic systems' },
  { name: 'Systems Architect', icon: Layers, color: 'bg-amber-500', desc: 'System design mastery' },
  { name: 'Performance Optimizer', icon: Zap, color: 'bg-orange-500', desc: 'Optimization techniques' },
  { name: 'Security Auditor', icon: Fingerprint, color: 'bg-rose-500', desc: 'Audit & compliance' },
]

function SkillBar({ level, max, color }: { level: number; max: number; color: string }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: max }).map((_, i) => (
        <motion.div
          key={i}
          className={`h-2.5 flex-1 rounded-full transition-all ${i < level ? color : 'bg-gray-200 dark:bg-gray-700'}`}
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3, delay: 0.1 * i }}
        />
      ))}
    </div>
  )
}

function OnlineStatusDot({ isOnline }: { isOnline: boolean }) {
  return (
    <span className="relative flex size-2.5">
      {isOnline && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
      )}
      <span
        className={`relative inline-flex rounded-full size-2.5 ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />
    </span>
  )
}

function OnlineUserAvatar({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const roleColor =
    role === 'ADMIN'
      ? 'bg-amber-500'
      : role === 'TRAINER'
        ? 'bg-blue-500'
        : 'bg-[#6c5ce7]'

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${roleColor} shrink-0`}
    >
      {initials}
    </div>
  )
}

export default function OperatorProfileView() {
  const { user, onlineUsers } = useAppStore()
  const { onlineCount, isUserOnline } = usePresence()
  const { isOnline: isNetworkOnline } = useNetworkStatus()
  const [editOpen, setEditOpen] = useState(false)
  const [profileData, setProfileData] = useState<{ bio: string | null } | null>(null)

  // Load real profile data from API
  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/user/profile?userId=${user.id}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setProfileData(data)
          // Sync bio back to store
          if (data.bio !== undefined && data.bio !== user?.bio) {
            useAppStore.getState().updateUser({ bio: data.bio })
          }
        }
      })
      .catch(() => {})
  }, [user?.id])

  const displayName = user?.name || "Alex 'Cipher' Sterling"
  const role = user?.role || 'STUDENT'
  const level = user?.level ?? 42
  const bio = user?.bio || profileData?.bio || null
  const currentUserOnline = isNetworkOnline && isUserOnline(user?.id || '')

  const initials = displayName
    .replace(/[^a-zA-Z\s]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const roleLabel = role === 'ADMIN' ? 'Administrator' : role === 'TRAINER' ? 'Trainer' : 'Senior Network Operator'

  return (
    <motion.div
      className="min-h-full bg-[#0f1117]"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Profile Header Banner */}
      <motion.div variants={item} className="relative">
        <div
          className="h-48 sm:h-56 w-full"
          style={{
            background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 40%, #74b9ff 100%)',
          }}
        />
        <div className="absolute inset-x-0 -bottom-16 flex flex-col items-center px-6">
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-[#0f1117] shadow-lg relative"
            style={{
              background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 50%, #74b9ff 100%)',
            }}
          >
            {initials}
            {/* Online dot on avatar */}
            <span className="absolute bottom-1 right-1">
              <OnlineStatusDot isOnline={currentUserOnline} />
            </span>
          </div>
        </div>
      </motion.div>

      {/* Profile Info + Edit Button */}
      <motion.div variants={item} className="pt-20 pb-2 text-center relative">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {displayName}
        </h1>
        <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
          <Badge className="rounded-full bg-[#6c5ce7] text-white text-xs font-semibold px-3 py-1">
            LEVEL {String(level).padStart(3, '0')}
          </Badge>
          <Badge
            variant="outline"
            className="border-gray-600 text-gray-300 text-xs px-3 py-1"
          >
            {roleLabel}
          </Badge>
          <Badge
            variant="outline"
            className={`gap-1.5 text-xs px-3 py-1 ${
              currentUserOnline
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : 'border-gray-600/30 bg-gray-600/10 text-gray-500'
            }`}
          >
            <OnlineStatusDot isOnline={currentUserOnline} />
            {currentUserOnline ? 'ONLINE' : 'OFFLINE'}
          </Badge>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-gray-400 text-sm mt-3 max-w-lg mx-auto px-4">
            {bio}
          </p>
        )}

        {/* Edit Profile Button */}
        <div className="mt-4">
          <Button
            onClick={() => setEditOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 gap-2 text-sm"
          >
            <Pencil className="size-4" />
            Edit Profile
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 pb-8 pt-4 max-w-[1400px] mx-auto space-y-6">
        {/* Online Users Card */}
        <motion.div variants={item}>
          <Card className="rounded-xl p-5 gap-0 bg-[#1a1f36] border-white/5">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="size-5 text-[#6c5ce7]" />
                  <h3 className="text-base font-semibold text-white">
                    Currently Online
                  </h3>
                </div>
                <Badge
                  className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-mono"
                >
                  {onlineCount} {onlineCount === 1 ? 'user' : 'users'}
                </Badge>
              </div>
              {onlineUsers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {onlineUsers.map((u) => (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="relative">
                        <OnlineUserAvatar name={u.name} role={u.role} />
                        <span className="absolute -bottom-0.5 -right-0.5">
                          <span className="block size-2.5 rounded-full bg-green-500 border-2 border-[#1a1f36]" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white font-medium truncate">
                          {u.name}
                          {u.id === user?.id && (
                            <span className="text-gray-500 text-xs ml-1.5">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          {u.role === 'ADMIN' ? 'Administrator' : u.role === 'TRAINER' ? 'Trainer' : 'Student'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Users className="size-8 text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500">No other users currently online</p>
                  <p className="text-xs text-gray-600 mt-1">You&apos;re the only one in the simulation</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={item}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="rounded-xl p-4 sm:p-5 gap-0 bg-[#1a1f36] border-white/5">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                        <Icon className={`size-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {stat.value}
                        </p>
                        <p className="text-xs text-gray-400 font-medium">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Skills Section */}
            <motion.div variants={item}>
              <Card className="rounded-xl p-6 gap-0 bg-[#1a1f36] border-white/5">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 mb-5">
                    <Activity className="size-5 text-[#6c5ce7]" />
                    <h3 className="text-base font-semibold text-white">
                      Skills & Proficiency
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {skills.map((skill) => (
                      <div
                        key={skill.name}
                        className="flex flex-col gap-2 p-3 rounded-xl bg-white/5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300 font-medium">
                            {skill.name}
                          </span>
                          <span className="text-xs text-gray-500 font-semibold">
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

            {/* Activity Timeline */}
            <motion.div variants={item}>
              <Card className="rounded-xl p-6 gap-0 bg-[#1a1f36] border-white/5">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 mb-5">
                    <Clock className="size-5 text-blue-500" />
                    <h3 className="text-base font-semibold text-white">
                      Recent Activity
                    </h3>
                  </div>
                  <div className="flex flex-col gap-0">
                    {activities.map((activity, idx) => {
                      const Icon = activity.icon
                      return (
                        <motion.div
                          key={idx}
                          className="flex items-start gap-3 py-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                        >
                          <div className="mt-0.5">
                            <Icon className={`size-4 ${activity.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300">
                              {activity.text}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6">
            {/* Certifications */}
            <motion.div variants={item}>
              <Card className="rounded-xl p-6 gap-0 bg-[#1a1f36] border-white/5">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 mb-5">
                    <Award className="size-5 text-amber-500" />
                    <h3 className="text-base font-semibold text-white">
                      Certifications
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {certifications.map((cert) => {
                      const Icon = cert.icon
                      return (
                        <motion.div
                          key={cert.name}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <div
                            className={`p-2 rounded-lg ${cert.color} text-white shrink-0`}
                          >
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {cert.name}
                            </p>
                            <p className="text-xs text-gray-500">{cert.desc}</p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
    </motion.div>
  )
}