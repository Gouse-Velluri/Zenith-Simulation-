'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User, Hexagon, Loader2, Shield, GraduationCap, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAppStore } from '@/store/app'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
}

type RoleKey = 'student' | 'trainer' | 'admin'

const ROLES: {
  key: RoleKey
  label: string
  apiValue: string
  icon: React.ReactNode
  description: string
  placeholder: string
  hint: string
  domain: string | null
}[] = [
  {
    key: 'student',
    label: 'Student',
    apiValue: 'STUDENT',
    icon: <GraduationCap className="h-5 w-5" />,
    description: 'Learn through simulations',
    placeholder: 'you@gmail.com',
    hint: 'Students can register with any email address',
    domain: null,
  },
  {
    key: 'trainer',
    label: 'Trainer',
    apiValue: 'TRAINER',
    icon: <UserCog className="h-5 w-5" />,
    description: 'Guide & mentor operators',
    placeholder: 'name@trainer.zenith.io',
    hint: 'Trainers must use their institutional email (@trainer.zenith.io)',
    domain: '@trainer.zenith.io',
  },
  {
    key: 'admin',
    label: 'Admin',
    apiValue: 'ADMIN',
    icon: <Shield className="h-5 w-5" />,
    description: 'Manage the platform',
    placeholder: 'name@admin.zenith.io',
    hint: 'Admins must use their admin email (@admin.zenith.io)',
    domain: '@admin.zenith.io',
  },
]

export default function RegisterPage() {
  const store = useAppStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [role, setRole] = useState<RoleKey>('student')

  const selectedRole = ROLES.find((r) => r.key === role)!

  const validateEmailDomain = (): string | null => {
    if (role === 'student') return null
    if (role === 'trainer' && !email.toLowerCase().endsWith('@trainer.zenith.io')) {
      return 'Trainers must register with a @trainer.zenith.io email'
    }
    if (role === 'admin' && !email.toLowerCase().endsWith('@admin.zenith.io')) {
      return 'Admins must register with a @admin.zenith.io email'
    }
    return null
  }

  const domainError = email ? validateEmailDomain() : null

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!agreed) {
      setError('You must agree to the Terms of Service')
      return
    }

    const clientError = validateEmailDomain()
    if (clientError) {
      setError(clientError)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role: selectedRole.apiValue }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Registration failed')
      }

      const data = await res.json()
      store.setUser(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      {/* ── Left Panel ── */}
      <div className="relative hidden w-[55%] flex-col justify-between overflow-hidden md:flex" style={{ backgroundColor: '#2D3EAD' }}>
        {/* Subtle background radial glow */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
        </div>

        {/* Hexagon Icon */}
        <motion.div
          className="relative z-10 flex items-center gap-3 px-10 pt-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Hexagon className="h-8 w-8 text-white" strokeWidth={1.5} />
        </motion.div>

        {/* Heading */}
        <motion.div
          className="relative z-10 px-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <h2 className="text-3xl font-bold leading-tight text-white">
            Accelerate Your
            <br />
            Trajectory
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            Join the world&apos;s most advanced professional readiness ecosystem. Real-time simulations,
            AI-driven coaching, and a network of operators pushing the frontier.
          </p>
        </motion.div>

        {/* Status Overlay on Image Area */}
        <motion.div
          className="relative z-10 mx-10 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="rounded-xl border border-white/10 p-5" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">VECTOR_SYNC</p>
                <p className="mt-1 text-lg font-bold text-green-400">OK</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">LOAD_LATENCY</p>
                <p className="mt-1 text-lg font-bold text-white">12ms</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">NODAL_FLUX</p>
                <p className="mt-1 text-lg font-bold text-white">0.844</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="relative z-10 px-10 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="font-mono text-[10px] tracking-widest text-white/30">
            SYSTEM PROTOCOL V4.8.2 // KINETIC FIDELITY
          </p>
        </motion.div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex min-h-screen w-full flex-1 flex-col items-center bg-white px-6 py-12 md:w-[45%]">
        <div className="w-full max-w-sm space-y-7">
          {/* Secure Registration Badge */}
          <motion.div
            className="flex items-center gap-2"
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeInUp}
          >
            <Shield className="h-4 w-4 text-[#3b82f6]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#3b82f6]">
              SECURE REGISTRATION
            </span>
          </motion.div>

          {/* Title */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeInUp}
          >
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Get Started</h1>
            <p className="mt-2 text-sm text-gray-500">
              Configure your simulation identity to begin the curriculum.
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <motion.div className="space-y-2" initial="hidden" animate="visible" custom={2} variants={fadeInUp}>
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                FULL NAME
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Agent designation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 bg-gray-50 pl-10 text-sm"
                />
              </div>
            </motion.div>

            {/* Role Selector */}
            <motion.div className="space-y-2" initial="hidden" animate="visible" custom={3} variants={fadeInUp}>
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                SELECT YOUR ROLE
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => {
                  const isSelected = role === r.key
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => {
                        setRole(r.key)
                        setEmail('')
                        setError('')
                      }}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-all duration-200 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {r.icon}
                      <span className={`text-xs font-semibold ${isSelected ? 'text-purple-700' : 'text-gray-500'}`}>
                        {r.label}
                      </span>
                      <span className="text-[10px] leading-tight opacity-70">{r.description}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>

            <motion.div className="space-y-2" initial="hidden" animate="visible" custom={4} variants={fadeInUp}>
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                WORK EMAIL
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  placeholder={selectedRole.placeholder}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error && validateEmailDomain()) setError('')
                  }}
                  required
                  className={`h-11 bg-gray-50 pl-10 text-sm ${domainError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                />
              </div>
              <p className={`text-[11px] leading-relaxed ${domainError ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {domainError || selectedRole.hint}
              </p>
            </motion.div>

            <motion.div className="space-y-2" initial="hidden" animate="visible" custom={5} variants={fadeInUp}>
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                CREATE PASSWORD
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-gray-50 pl-10 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>

            {/* Checkbox */}
            <motion.div
              className="flex items-start gap-2"
              initial="hidden"
              animate="visible"
              custom={6}
              variants={fadeInUp}
            >
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="cursor-pointer text-xs leading-relaxed text-gray-500">
                I agree to the{' '}
                <span className="font-medium text-[#3b82f6] hover:underline">Terms of Service</span>
                {' '}and{' '}
                <span className="font-medium text-[#3b82f6] hover:underline">Privacy Policy</span>
              </label>
            </motion.div>

            {error && (
              <motion.p
                className="text-sm text-red-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}

            <motion.div initial="hidden" animate="visible" custom={7} variants={fadeInUp}>
              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-lg bg-[#3b82f6] text-sm font-semibold text-white hover:bg-[#2563eb] disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </motion.div>
          </form>

          {/* Switch to Login */}
          <motion.p
            className="text-center text-sm text-gray-500"
            initial="hidden"
            animate="visible"
            custom={8}
            variants={fadeInUp}
          >
            Already have a profile?{' '}
            <button
              type="button"
              onClick={() => store.setView('login')}
              className="font-semibold text-[#3b82f6] hover:underline"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => store.setView('landing')}
              className="block mt-2 mx-auto text-gray-400 hover:text-gray-600 text-sm transition-colors"
            >
              ← Back to Home
            </button>
          </motion.p>
        </div>

        {/* Copyright Footer */}
        <motion.p
          className="text-center text-[10px] text-gray-300 mt-auto pt-4"
          initial="hidden"
          animate="visible"
          custom={9}
          variants={fadeInUp}
        >
          &copy; {new Date().getFullYear()} Zenith Simulation. All rights reserved.
        </motion.p>
      </div>
    </div>
  )
}