'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Star, Hexagon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/store/app'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
}

export default function LoginPage() {
  const store = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Login failed')
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
      <div className="relative hidden w-[55%] flex-col justify-between overflow-hidden md:flex" style={{ backgroundColor: '#1a1f36' }}>
        {/* Animated background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className="h-[500px] w-[500px] rounded-full opacity-20"
              style={{
                animation: 'spin 8s linear infinite',
                background: 'conic-gradient(from 0deg, transparent 0%, #3b82f6 25%, transparent 50%, #3b82f6 75%, transparent 100%)',
                filter: 'blur(60px)',
              }}
            />
          </div>
        </div>

        {/* Logo */}
        <motion.div
          className="relative z-10 flex items-center gap-2 px-10 pt-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2">
            <Hexagon className="h-7 w-7 text-[#3b82f6]" strokeWidth={1.5} />
            <Star className="absolute left-[7px] top-[7px] h-4 w-4 text-white" fill="white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Zenith<span className="text-[#3b82f6]"> Simulation</span>
          </span>
        </motion.div>

        {/* Central Hex Tunnel */}
        <motion.div
          className="relative z-10 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div
            className="relative flex h-64 w-64 items-center justify-center rounded-2xl"
            style={{ backgroundColor: '#111628' }}
          >
            {/* Concentric hex rings */}
            {[1, 2, 3, 4, 5].map((ring) => (
              <div
                key={ring}
                className="absolute"
                style={{
                  width: `${ring * 44}px`,
                  height: `${ring * 44}px`,
                }}
              >
                <Hexagon
                  className="h-full w-full animate-pulse"
                  style={{
                    color: `rgba(59, 130, 246, ${0.6 - ring * 0.1})`,
                    animationDuration: `${1.5 + ring * 0.4}s`,
                  }}
                  strokeWidth={1}
                />
              </div>
            ))}
            {/* Center glow */}
            <div
              className="absolute h-8 w-8 animate-pulse rounded-full"
              style={{
                background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
                filter: 'blur(4px)',
              }}
            />
          </div>
        </motion.div>

        {/* Status Box */}
        <motion.div
          className="relative z-10 mx-10 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="rounded-xl border border-white/5 p-4" style={{ backgroundColor: 'rgba(17, 22, 40, 0.8)' }}>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="font-mono text-xs text-green-400">INITIALIZING SECURE TERMINAL...</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
              <span className="font-mono text-xs text-[#3b82f6]">SESSION: STABLE</span>
            </div>
          </div>
        </motion.div>

        {/* Terminal Text */}
        <motion.div
          className="relative z-10 space-y-1 px-10 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <p className="font-mono text-[11px] text-gray-500">{'> '}CORE_SYS_v2.0.44_LOADED</p>
          <p className="font-mono text-[11px] text-gray-500">{'> '}ENCRYPT_RSA_AES_256_ACTIVE</p>
          <p className="font-mono text-[11px] text-gray-500">{'> '}UPLINK_STRENGTH_99.8_PERCENT</p>
        </motion.div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex min-h-screen w-full flex-1 flex-col items-center bg-white px-6 py-12 md:w-[45%]">
        <div className="w-full max-w-sm space-y-8">
          {/* Title */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeInUp}
          >
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">God-Mode Access</h1>
            <p className="mt-2 text-sm text-gray-500">Enter your credentials to re-enter the simulation.</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <motion.div className="space-y-2" initial="hidden" animate="visible" custom={1} variants={fadeInUp}>
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                OPERATOR EMAIL
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  placeholder="operator@zenith.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-gray-50 pl-10 text-sm"
                />
              </div>
            </motion.div>

            <motion.div className="space-y-2" initial="hidden" animate="visible" custom={2} variants={fadeInUp}>
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                ACCESS CODE
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-gray-50 pl-10 text-sm"
                />
              </div>
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

            <motion.div initial="hidden" animate="visible" custom={3} variants={fadeInUp}>
              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-lg bg-[#3b82f6] text-sm font-semibold text-white hover:bg-[#2563eb] disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Login to Simulation'
                )}
              </Button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div
            className="flex items-center gap-4"
            initial="hidden"
            animate="visible"
            custom={4}
            variants={fadeInUp}
          >
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
              EXTERNAL UPLINK
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </motion.div>

          {/* Switch to Register */}
          <motion.p
            className="text-center text-sm text-gray-500"
            initial="hidden"
            animate="visible"
            custom={5}
            variants={fadeInUp}
          >
            New recruit?{' '}
            <button
              type="button"
              onClick={() => store.setView('register')}
              className="font-semibold text-[#3b82f6] hover:underline"
            >
              Apply for Entry
            </button>
            <button
              onClick={() => store.setView('landing')}
              className="block mt-3 mx-auto text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Back to Home
            </button>
          </motion.p>

          {/* Footer */}
          <motion.p
            className="text-center text-[10px] tracking-widest text-gray-300"
            initial="hidden"
            animate="visible"
            custom={6}
            variants={fadeInUp}
          >
            ZENITH SECURE PROTOCOL V4.0
          </motion.p>
        </div>

        {/* Copyright Footer */}
        <motion.p
          className="text-center text-[10px] text-gray-300 mt-auto pt-4"
          initial="hidden"
          animate="visible"
          custom={7}
          variants={fadeInUp}
        >
          &copy; {new Date().getFullYear()} Zenith Simulation. All rights reserved.
        </motion.p>
      </div>
    </div>
  )
}