'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import {
  Hexagon, WifiOff, Ticket, Sparkles, Award, FileText, Code,
  FlaskConical, Star, Check, ChevronRight, GraduationCap,
  Building2, Globe, Users, Play, ArrowRight, Signal, Wifi, SignalHigh
} from 'lucide-react'
import { useAppStore } from '@/store/app'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { Button } from '@/components/ui/button'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!inView) return
    let startTime: number
    let raf: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [end, duration, inView])

  return { count, ref }
}

function FadeIn({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const dirMap = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { y: 0, x: 40 },
    right: { y: 0, x: -40 },
  }
  const { x, y } = dirMap[direction]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x, y }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Connection Badge                                                    */
/* ------------------------------------------------------------------ */

function ConnectionBadge() {
  const { isOnline, displayType, carrierName } = useNetworkStatus()

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
      isOnline
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-red-50 text-red-600 border border-red-200'
    }`}>
      {/* Signal bars icon */}
      <div className="flex items-end gap-[2px] h-3.5">
        <div className={`w-[3px] rounded-sm signal-bar ${isOnline ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ height: '30%' }} />
        <div className={`w-[3px] rounded-sm signal-bar ${isOnline ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ height: '55%' }} />
        <div className={`w-[3px] rounded-sm signal-bar ${isOnline ? 'bg-emerald-500' : 'bg-red-400 opacity-40'}`} style={{ height: '80%' }} />
        <div className={`w-[3px] rounded-sm signal-bar ${isOnline ? 'bg-emerald-500' : 'bg-red-400 opacity-40'}`} style={{ height: '100%' }} />
      </div>
      <motion.span
        className="w-2 h-2 rounded-full"
        animate={{
          backgroundColor: isOnline ? '#10b981' : '#ef4444',
          scale: isOnline ? [1, 1.4, 1] : 1,
        }}
        transition={isOnline ? { duration: 2, repeat: Infinity } : {}}
      />
      <span className="hidden sm:inline">
        {isOnline ? `LIVE · ${displayType}` : 'OFFLINE'}
      </span>
      <span className="sm:hidden">
        {isOnline ? displayType : 'OFF'}
      </span>
      {isOnline && carrierName && (
        <span className="hidden md:inline text-emerald-500">· {carrierName}</span>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Offline Banner                                                     */
/* ------------------------------------------------------------------ */

function OfflineBanner() {
  const { isOnline, displayType } = useNetworkStatus()
  if (isOnline) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white text-center py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2">
      <WifiOff className="size-4 shrink-0" />
      No internet connection. Please check your WiFi or mobile data.
      <span className="hidden sm:inline opacity-80">({displayType})</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Code Editor Mockup                                                 */
/* ------------------------------------------------------------------ */

function CodeEditorMockup({ style }: { style?: React.CSSProperties }) {
  const lines = [
    { tokens: [{ text: 'async ', color: 'text-purple-400' }, { text: 'function ', color: 'text-pink-400' }, { text: 'processTicket', color: 'text-yellow-300' }, { text: '(ticket) {', color: 'text-white' }] },
    { tokens: [{ text: '  const ', color: 'text-purple-400' }, { text: 'result', color: 'text-blue-300' }, { text: ' = ', color: 'text-white' }, { text: 'await', color: 'text-pink-400' }, { text: ' analyze(', color: 'text-white' }, { text: 'ticket', color: 'text-blue-300' }, { text: ');', color: 'text-white' }] },
    { tokens: [{ text: '', color: 'text-white' }] },
    { tokens: [{ text: '  if ', color: 'text-pink-400' }, { text: '(', color: 'text-white' }, { text: 'result', color: 'text-blue-300' }, { text: '.status === ', color: 'text-white' }, { text: "'approved'", color: 'text-green-400' }, { text: ') {', color: 'text-white' }] },
    { tokens: [{ text: '    ', color: 'text-white' }, { text: 'return', color: 'text-pink-400' }, { text: ' { ', color: 'text-white' }, { text: 'badge', color: 'text-blue-300' }, { text: ': ', color: 'text-white' }, { text: "'✓ Verified'", color: 'text-green-400' }, { text: ' };', color: 'text-white' }] },
    { tokens: [{ text: '  }', color: 'text-white' }] },
    { tokens: [{ text: '', color: 'text-white' }] },
    { tokens: [{ text: '  // Run automated tests', color: 'text-gray-500' }] },
    { tokens: [{ text: '  ', color: 'text-white' }, { text: 'await', color: 'text-pink-400' }, { text: ' runTests(', color: 'text-white' }, { text: 'result', color: 'text-blue-300' }, { text: ');', color: 'text-white' }] },
    { tokens: [{ text: '}', color: 'text-white' }] },
  ]

  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0" style={style}>
      {/* Glow effect behind editor */}
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-2xl" />

      <div className="relative bg-[#0F172A] rounded-xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#1E293B] border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-gray-400 ml-2 font-mono">ticket-processor.ts</span>
        </div>
        {/* Code content */}
        <div className="p-4 font-mono text-sm leading-7 overflow-x-auto">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="text-gray-600 w-8 shrink-0 text-right mr-4 select-none text-xs leading-7">
                {i + 1}
              </span>
              <span>
                {line.tokens.map((t, j) => (
                  <span key={j} className={t.color}>{t.text || '\u00A0'}</span>
                ))}
              </span>
            </div>
          ))}
        </div>
        {/* Bottom status bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#1E293B] border-t border-white/5 text-[11px] text-gray-500">
          <span>TypeScript</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Tests: 5/5 passed
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Circuit Journey Animation                                           */
/* ------------------------------------------------------------------ */

function CircuitJourney() {
  const steps = [
    { icon: FileText, title: 'Receive Ticket', desc: 'Get assigned a real engineering task sourced from company workflows.' },
    { icon: Code, title: 'Write Code', desc: 'Implement your solution in a realistic development environment.' },
    { icon: FlaskConical, title: 'Run Tests', desc: 'Validate your code against automated test suites and CI checks.' },
    { icon: Star, title: 'Earn Badge', desc: 'Receive a verified skill badge for your Skill Passport.' },
  ]

  return (
    <div className="relative">
      {/* Desktop: Horizontal circuit */}
      <div className="hidden lg:block">
        {/* SVG Circuit Path - connecting line with flowing current */}
        <svg
          className="absolute top-[3.25rem] left-[12.5%] right-[12.5%] h-8 pointer-events-none"
          viewBox="0 0 800 32"
          preserveAspectRatio="none"
          fill="none"
        >
          {/* Base line (dim) */}
          <line x1="0" y1="16" x2="800" y2="16" stroke="rgba(99,102,241,0.15)" strokeWidth="2" />
          {/* Animated dashed line (flowing current) */}
          <line x1="0" y1="16" x2="800" y2="16" stroke="rgba(99,102,241,0.5)" strokeWidth="2" className="circuit-dash-animate" />
          {/* Glow line */}
          <line x1="0" y1="16" x2="800" y2="16" stroke="rgba(99,102,241,0.08)" strokeWidth="6" />

          {/* Flowing particles - 4 particles staggered */}
          {[0, 0.25, 0.5, 0.75].map((delay, i) => (
            <circle key={i} r="4" fill="rgba(99,102,241,0.9)" filter="url(#circuitGlow)">
              <animateMotion
                dur="3s"
                begin={`${delay}s`}
                repeatCount="indefinite"
                path="M0,16 L800,16"
              />
              <animate attributeName="opacity" values="0;1;1;0" dur="3s" begin={`${delay}s`} repeatCount="indefinite" />
            </circle>
          ))}

          {/* Bright core particles (smaller, faster) */}
          {[0.1, 0.35, 0.6, 0.85].map((delay, i) => (
            <circle key={`bright-${i}`} r="2" fill="white" opacity="0.8">
              <animateMotion
                dur="2.2s"
                begin={`${delay}s`}
                repeatCount="indefinite"
                path="M0,16 L800,16"
              />
              <animate attributeName="opacity" values="0;0.9;0.9;0" dur="2.2s" begin={`${delay}s`} repeatCount="indefinite" />
            </circle>
          ))}

          <defs>
            <filter id="circuitGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
          </defs>
        </svg>

        {/* Step Cards */}
        <div className="grid grid-cols-4 gap-6 relative z-10">
          {steps.map((step, i) => (
            <FadeIn key={step.title} delay={i * 0.12}>
              <div className="relative flex flex-col items-center text-center">
                {/* Circuit node with electric pulse */}
                <div className="relative mb-5">
                  <div className="absolute inset-0 rounded-full bg-indigo-500/20 circuit-node-pulse" />
                  <div className="relative w-14 h-14 rounded-full bg-indigo-100 border-4 border-[#F9FAFB] flex items-center justify-center z-10">
                    <step.icon className="size-6 text-indigo-600" />
                  </div>
                  {/* Pulse ring */}
                  <div className="absolute inset-[-8px] rounded-full border-2 border-indigo-400/30 circuit-pulse-ring" />
                </div>
                <span className="text-xs font-bold text-indigo-600 tracking-wider mb-2">
                  STEP {i + 1}
                </span>
                <h3 className="text-lg font-bold text-[#111827] mb-2">{step.title}</h3>
                <p className="text-sm text-[#374151] leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* Mobile/Tablet: Vertical circuit */}
      <div className="lg:hidden">
        <div className="relative left-6 sm:left-8 top-0 bottom-0 w-0.5">
          {/* Vertical line */}
          <div className="absolute inset-0 bg-indigo-200/40" />
          <div className="absolute inset-0 bg-indigo-400/30 circuit-dash-animate" style={{
            background: 'repeating-linear-gradient(to bottom, rgba(99,102,241,0.5) 0px, rgba(99,102,241,0.5) 6px, transparent 6px, transparent 20px)',
            backgroundSize: '100% 20px',
            animation: 'dash-flow 1.5s linear infinite',
          }} />
        </div>

        <div className="space-y-10 pl-16 sm:pl-20">
          {steps.map((step, i) => (
            <FadeIn key={step.title} delay={i * 0.1}>
              <div className="relative flex gap-4">
                {/* Node on the line */}
                <div className="absolute -left-10 sm:-left-12 top-0">
                  <div className="relative">
                    <div className="absolute inset-[-6px] rounded-full bg-indigo-500/20 circuit-node-pulse" />
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-indigo-100 flex items-center justify-center z-10">
                      <step.icon className="size-5 sm:size-6 text-indigo-600" />
                    </div>
                  </div>
                </div>
                <div className="pt-1">
                  <span className="text-[10px] sm:text-xs font-bold text-indigo-600 tracking-wider">STEP {i + 1}</span>
                  <h3 className="text-base sm:text-lg font-bold text-[#111827] mt-0.5 mb-1">{step.title}</h3>
                  <p className="text-sm text-[#374151] leading-relaxed max-w-xs">{step.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Floating Shapes (parallax background)                              */
/* ------------------------------------------------------------------ */

function FloatingShapes({ y }: { y: any }) {
  return (
    <motion.div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ y }}>
      <div className="absolute top-[10%] left-[5%] w-20 h-20 rounded-full bg-indigo-200/30 blur-xl animate-float-slow" />
      <div className="absolute top-[30%] right-[8%] w-32 h-32 rounded-full bg-purple-200/20 blur-xl animate-float-medium" />
      <div className="absolute bottom-[20%] left-[15%] w-16 h-16 rounded-full bg-blue-200/25 blur-lg animate-float-fast" />
      <Hexagon className="absolute top-[15%] right-[20%] w-8 h-8 text-indigo-300/20 animate-float-slow" />
      <Hexagon className="absolute bottom-[30%] left-[40%] w-12 h-12 text-purple-300/15 animate-float-medium" />
      <Hexagon className="absolute top-[50%] right-[5%] w-6 h-6 text-blue-300/20 animate-float-fast" />
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */

function Section({
  children,
  className = '',
  dark = false,
  id,
}: {
  children: React.ReactNode
  className?: string
  dark?: boolean
  id?: string
}) {
  return (
    <section
      id={id}
      className={`py-16 sm:py-20 md:py-24 ${dark ? 'bg-[#1E293B]' : 'bg-[#F9FAFB]'}`}
    >
      <div className={`max-w-6xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
        {children}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                           */
/* ------------------------------------------------------------------ */

function StatCard({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
  const { count, ref } = useCountUp(value)
  return (
    <FadeIn delay={delay}>
      <div className="text-center">
        <span
          ref={ref}
          className="text-4xl sm:text-5xl 2xl:text-6xl font-extrabold text-white"
        >
          {count}
          {suffix}
        </span>
        <p className="mt-2 text-sm 2xl:text-base font-semibold tracking-[0.15em] text-gray-400 uppercase">
          {label}
        </p>
      </div>
    </FadeIn>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Landing Page                                                  */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const store = useAppStore()
  const [pricingYearly, setPricingYearly] = useState(false)

  // 3D Parallax
  const { scrollY, scrollYProgress } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, -60])
  const heroScale = useTransform(scrollY, [0, 600], [1, 0.97])
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0])
  const codeY = useTransform(scrollY, [0, 600], [0, -100])
  const statsShapesY = useTransform(scrollY, [600, 1200], [0, -50])

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] parallax-container">
      <OfflineBanner />

      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/60">
        <div className="max-w-6xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <Hexagon className="size-6 sm:size-7 text-indigo-600" />
              <span className="text-base sm:text-lg font-bold text-[#1E293B]">Zenith Simulation</span>
            </div>

            {/* Nav (center - hidden on mobile) */}
            <nav className="hidden md:flex items-center gap-8">
              {['Features', 'Labs', 'Pricing', 'For Trainers'].map((item) => (
                <button
                  key={item}
                  className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  {item}
                </button>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ConnectionBadge />
              <Button
                variant="ghost"
                className="hidden sm:inline-flex text-sm font-medium text-gray-700 hover:text-indigo-600"
                onClick={() => store.setView('login')}
              >
                Log In
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-5 h-8 sm:h-10"
                onClick={() => store.setView('register')}
              >
                <span className="hidden xs:inline sm:inline">Get Started</span>
                <span className="xs:hidden sm:hidden">Start</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ============ HERO with 3D Parallax ============ */}
      <motion.section
        className="relative bg-white overflow-hidden"
        style={{ y: heroY, scale: heroScale }}
      >
        {/* Subtle gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 pointer-events-none" />

        {/* Floating shapes behind hero (parallax) */}
        <motion.div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ y: codeY }}>
          <div className="absolute -top-20 -right-20 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-indigo-100/40 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-purple-100/30 blur-2xl" />
          <Hexagon className="absolute top-20 right-[15%] w-16 h-16 text-indigo-200/30 animate-float-slow" />
          <Hexagon className="absolute bottom-10 left-[10%] w-10 h-10 text-purple-200/20 animate-float-medium" />
        </motion.div>

        <div className="relative max-w-6xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left - parallax text */}
            <motion.div style={{ opacity: heroOpacity }}>
              <FadeIn>
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 sm:px-3.5 sm:py-1.5 mb-4 sm:mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Code Simulation v2.0 Live
                </span>
              </FadeIn>

              <FadeIn delay={0.1}>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold text-[#111827] leading-[1.1] tracking-tight">
                  Code Like a Developer.{' '}
                  <span className="text-indigo-600">From Day One.</span>
                </h1>
              </FadeIn>

              <FadeIn delay={0.2}>
                <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#374151] leading-relaxed max-w-lg">
                  Zenith Simulation puts you in real-world development scenarios.
                  Solve actual company tickets, write production code, and build a
                  verified skill portfolio that employers trust.
                </p>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4">
                  <Button
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base font-semibold px-5 sm:px-7 h-11 sm:h-12 rounded-lg shadow-lg shadow-indigo-600/25"
                    onClick={() => store.setView('login')}
                  >
                    Enter Simulation
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-sm sm:text-base font-semibold px-5 sm:px-7 h-11 sm:h-12 rounded-lg"
                  >
                    <Play className="size-4" />
                    Watch Demo
                  </Button>
                </div>
              </FadeIn>
            </motion.div>

            {/* Right - Code Editor (deeper parallax) */}
            <div className="hidden lg:block">
              <motion.div style={{ y: codeY }}>
                <CodeEditorMockup />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ============ TRUST SECTION ============ */}
      <Section>
        <FadeIn>
          <p className="text-center text-[10px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] text-gray-400 uppercase mb-8 sm:mb-10">
            Trusted by Students From
          </p>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-16">
            {[
              { icon: GraduationCap, label: 'IIT Delhi' },
              { icon: Building2, label: 'NIT Trichy' },
              { icon: Globe, label: 'BITS Pilani' },
              { icon: Users, label: 'VIT Vellore' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 sm:gap-2.5 text-gray-400">
                <Icon className="size-5 sm:size-7" />
                <span className="font-semibold text-xs sm:text-sm">{label}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </Section>

      {/* ============ FEATURES SECTION ============ */}
      <section className="py-16 sm:py-20 md:py-24 bg-white" id="features">
        <div className="max-w-6xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#111827]">
                Everything you need to get hired
              </h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-[#374151]">
                Practical skills that traditional courses don&apos;t teach.
              </p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Card 1 */}
            <FadeIn delay={0.1}>
              <div className="group bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 hover:-translate-y-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4 sm:mb-5">
                  <Ticket className="size-5 sm:size-6 text-indigo-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#111827] mb-2 sm:mb-3">Real Company Tickets</h3>
                <p className="text-sm text-[#374151] leading-relaxed">
                  Work on actual engineering tickets sourced from real companies.
                  Experience genuine development workflows, PRs, code reviews,
                  and sprint cycles.
                </p>
                <div className="mt-4 sm:mt-5 flex items-center gap-1.5 text-indigo-600 text-sm font-semibold group-hover:gap-3 transition-all">
                  Learn more <ChevronRight className="size-4" />
                </div>
              </div>
            </FadeIn>

            {/* Card 2 - Purple bg */}
            <FadeIn delay={0.2}>
              <div className="group bg-indigo-600 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 hover:shadow-xl hover:shadow-indigo-600/30 transition-all duration-300 hover:-translate-y-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 sm:mb-5">
                  <Sparkles className="size-5 sm:size-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">AI-Powered Feedback</h3>
                <p className="text-sm text-indigo-100 leading-relaxed">
                  Get instant, context-aware code reviews from our AI mentor.
                  It spots bugs, suggests improvements, and explains the &quot;why&quot;
                  behind every recommendation.
                </p>
                <div className="mt-4 sm:mt-5 flex items-center gap-1.5 text-indigo-200 text-sm font-semibold group-hover:gap-3 transition-all">
                  Learn more <ChevronRight className="size-4" />
                </div>
              </div>
            </FadeIn>

            {/* Card 3 */}
            <FadeIn delay={0.3}>
              <div className="group bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 hover:-translate-y-1 sm:col-span-2 md:col-span-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 sm:mb-5">
                  <Award className="size-5 sm:size-6 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#111827] mb-2 sm:mb-3">Skill Passport</h3>
                <p className="text-sm text-[#374151] leading-relaxed">
                  Build a verified, blockchain-anchored portfolio of skills.
                  Share a single link that proves your abilities to any recruiter
                  or hiring manager.
                </p>
                <div className="mt-4 sm:mt-5 flex items-center gap-1.5 text-blue-600 text-sm font-semibold group-hover:gap-3 transition-all">
                  Learn more <ChevronRight className="size-4" />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ============ STATISTICS SECTION with Parallax Shapes ============ */}
      <Section dark id="labs">
        <FloatingShapes y={statsShapesY} />
        <div className="relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-8">
            <StatCard value={200} suffix="+" label="STUDENTS" delay={0} />
            <StatCard value={50} suffix="+" label="SKILLS" delay={0.1} />
            <StatCard value={100} suffix="+" label="LABS" delay={0.2} />
            <StatCard value={5} suffix="" label="COLLEGES" delay={0.3} />
          </div>
        </div>
      </Section>

      {/* ============ JOURNEY SECTION with Circuit Animation ============ */}
      <Section id="journey">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#111827]">
              Your Journey to Professionalism
            </h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-[#374151]">
              Four simple steps to transform your career prospects.
            </p>
          </div>
        </FadeIn>

        <CircuitJourney />
      </Section>

      {/* ============ PRICING SECTION ============ */}
      <section className="py-16 sm:py-20 md:py-24 bg-white" id="pricing">
        <div className="max-w-5xl 2xl:max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#111827]">
                Simple, transparent pricing
              </h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-[#374151]">
                Start free. Upgrade when you&apos;re ready to go pro.
              </p>
            </div>
          </FadeIn>

          {/* Toggle */}
          <FadeIn delay={0.1}>
            <div className="flex items-center justify-center gap-3 mb-10 sm:mb-12">
              <span className={`text-sm font-medium ${!pricingYearly ? 'text-[#111827]' : 'text-gray-400'}`}>Monthly</span>
              <button
                onClick={() => setPricingYearly(!pricingYearly)}
                className="relative w-12 h-6 rounded-full bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600/50"
                aria-pressed={pricingYearly}
              >
                <motion.div
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"
                  animate={{ x: pricingYearly ? 24 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
              <span className={`text-sm font-medium ${pricingYearly ? 'text-[#111827]' : 'text-gray-400'}`}>
                Yearly <span className="text-indigo-600 font-bold">(-20%)</span>
              </span>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <FadeIn delay={0.15}>
              <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 lg:p-8 flex flex-col">
                <h3 className="text-lg font-bold text-[#111827]">Free</h3>
                <div className="mt-3 sm:mt-4 mb-5 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#111827]">$0</span>
                  <span className="text-gray-400 text-sm">/mo</span>
                </div>
                <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                  {[
                    '3 basic lab simulations',
                    'Community support',
                    'Public skill profile',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#374151]">
                      <Check className="size-4 text-indigo-600 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-11 border-indigo-300 text-indigo-600 hover:bg-indigo-50 font-semibold"
                >
                  Current Plan
                </Button>
              </div>
            </FadeIn>

            {/* Pro Plan */}
            <FadeIn delay={0.25}>
              <div className="relative rounded-xl sm:rounded-2xl border-2 border-indigo-600 bg-white p-5 sm:p-6 lg:p-8 flex flex-col shadow-xl shadow-indigo-100/50">
                <div className="absolute -top-3 sm:-top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1 rounded-full tracking-wide">
                    MOST POPULAR
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#111827]">Pro</h3>
                <div className="mt-3 sm:mt-4 mb-5 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#111827]">
                    ${pricingYearly ? 23 : 29}
                  </span>
                  <span className="text-gray-400 text-sm">/mo</span>
                </div>
                <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                  {[
                    'Unlimited lab simulations',
                    'AI-powered code reviews',
                    'Verified Skill Passport',
                    'Priority support',
                    'Company ticket access',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#374151]">
                      <Check className="size-4 text-indigo-600 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full h-10 sm:h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/25"
                  onClick={() => store.setView('register')}
                >
                  Get Started
                </Button>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ============ FOOTER (sticky to bottom) ============ */}
      <footer className="bg-[#1E293B] text-gray-400 mt-auto">
        <div className="max-w-6xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <Hexagon className="size-5 sm:size-6 text-indigo-400" />
                <span className="text-white font-bold text-base sm:text-lg">Zenith Simulation</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">
                Bridging the gap between education and employment through
                real-world code simulation.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold text-xs sm:text-sm mb-3 sm:mb-4 tracking-wide">PRODUCT</h4>
              <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                {['Features', 'Labs', 'Pricing', 'For Trainers'].map((item) => (
                  <li key={item}>
                    <button className="hover:text-white transition-colors">{item}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-semibold text-xs sm:text-sm mb-3 sm:mb-4 tracking-wide">RESOURCES</h4>
              <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                {['Documentation', 'Blog', 'Changelog', 'Community'].map((item) => (
                  <li key={item}>
                    <button className="hover:text-white transition-colors">{item}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold text-xs sm:text-sm mb-3 sm:mb-4 tracking-wide">SUPPORT</h4>
              <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                {['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'].map((item) => (
                  <li key={item}>
                    <button className="hover:text-white transition-colors">{item}</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/10 text-center text-xs sm:text-sm">
            &copy; {new Date().getFullYear()} Zenith Simulation. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}