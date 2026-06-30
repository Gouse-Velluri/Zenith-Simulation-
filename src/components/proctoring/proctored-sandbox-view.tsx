'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  AlertTriangle,
  Eye,
  Monitor,
  Copy,
  CheckCircle2,
  FileCode,
  FileText,
  Lightbulb,
  Lock,
  Terminal,
  ChevronRight,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'

const initialCode = `def two_sum(nums: list[int], target: int) -> list[int]:
    """
    Given an array of integers nums and an integer target,
    return indices of the two numbers such that they add up to target.
    
    You may assume that each input would have exactly one solution,
    and you may not use the same element twice.
    
    Example:
    Input: nums = [2,7,11,15], target = 9
    Output: [0, 1]
    """
    # Create a hash map to store value -> index
    seen = {}
    
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    
    return []  # Should never reach here
`

const hints = [
  {
    id: 1,
    title: 'Think about hashing',
    content:
      'Consider using a hash map to store previously seen values. This can reduce the time complexity from O(n²) to O(n).',
    unlocked: true,
  },
  {
    id: 2,
    title: 'One-pass approach',
    content:
      'You can solve this in a single pass through the array. On each iteration, check if the complement already exists in your map before adding the current number.',
    unlocked: false,
  },
  {
    id: 3,
    title: 'Edge cases to consider',
    content:
      'Consider edge cases like negative numbers, duplicate values, and the case where the solution is at the very end of the array.',
    unlocked: false,
  },
]

const files = [
  { name: 'main.py', icon: FileCode, active: true },
  { name: 'utils.py', icon: FileCode, active: false },
  { name: 'test_cases.py', icon: FileText, active: false },
]

interface WarningEvent {
  id: string
  message: string
  type: 'success' | 'warning'
  timestamp: number
}

export default function ProctoredSandboxView() {
  const [timeLeft, setTimeLeft] = useState(45 * 60) // 45 minutes
  const [code, setCode] = useState(initialCode)
  const [warnings, setWarnings] = useState<WarningEvent[]>([
    {
      id: 'init',
      message: 'Proctoring session started ✓',
      type: 'success' as const,
      timestamp: Date.now(),
    },
  ])
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('instructions')
  const [tabSwitches, setTabSwitches] = useState(0)
  const [copyEvents, setCopyEvents] = useState(0)
  const [focusPercent, setFocusPercent] = useState(100)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const warningIdRef = useRef(0)
  const lineCount = code.split('\n').length

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Periodic proctoring events
  useEffect(() => {
    const eventInterval = setInterval(() => {
      const id = `warn-${++warningIdRef.current}`
      const rand = Math.random()

      if (rand < 0.7) {
        // Success event
        const messages = [
          'Focus maintained ✓',
          'Session secure ✓',
          'Environment integrity verified ✓',
          'No anomalies detected ✓',
          'Proctoring status: Normal ✓',
        ]
        const msg = messages[Math.floor(Math.random() * messages.length)]
        setWarnings((prev) => [...prev.slice(-8), { id, message: msg, type: 'success', timestamp: Date.now() }])
      } else {
        // Warning event (simulated)
        const id2 = `warn-${++warningIdRef.current}`
        const warningMessages = [
          'Tab switch detected — please stay on the assessment',
          'Unusual activity detected',
          'Multiple rapid actions detected',
        ]
        const msg = warningMessages[Math.floor(Math.random() * warningMessages.length)]
        setWarnings((prev) => [...prev.slice(-8), { id: id2, message: msg, type: 'warning', timestamp: Date.now() }])
        setTabSwitches((prev) => prev + 1)
        setFocusPercent((prev) => Math.max(90, prev - 0.5))
      }
    }, 20000) // Every 20 seconds

    return () => clearInterval(eventInterval)
  }, [])

  // Auto-remove old warnings
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now()
      setWarnings((prev) =>
        prev.filter((w) => {
          if (w.type === 'warning' && now - w.timestamp > 8000) return false
          if (w.type === 'success' && now - w.timestamp > 15000) return false
          return true
        })
      )
    }, 3000)
    return () => clearInterval(cleanup)
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const handleSubmit = () => {
    setShowSubmitModal(true)
    setConsoleOutput((prev) => [
      ...prev,
      '> Running test cases...',
      '> Test 1: PASS (nums=[2,7,11,15], target=9 → [0,1])',
      '> Test 2: PASS (nums=[3,2,4], target=6 → [1,2])',
      '> Test 3: PASS (nums=[3,3], target=6 → [0,1])',
      '> All 3/3 test cases passed!',
      '> Submission recorded. Time taken: 00:12:34',
    ])
  }

  const handleRunCode = () => {
    setConsoleOutput((prev) => [
      ...prev,
      '--- Running main.py ---',
      '> two_sum([2,7,11,15], 9) => [0, 1]  ✓',
      '> two_sum([3,2,4], 6) => [1, 2]  ✓',
      '> two_sum([3,3], 6) => [0, 1]  ✓',
      '--- All tests passed ---',
      '',
    ])
  }

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value)
  }, [])

  const timePercent = (timeLeft / (45 * 60)) * 100
  const isLowTime = timeLeft < 300 // Less than 5 minutes

  return (
    <div className="h-full flex flex-col bg-[#0f1117] text-gray-200">
      {/* Top Bar */}
      <div className="h-12 shrink-0 bg-[#1a1f36] border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <FileCode className="size-4 text-[#6c5ce7]" />
          <span className="text-sm font-semibold text-white">Proctored Assessment</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className="flex items-center gap-2">
            <Clock className={`size-4 ${isLowTime ? 'text-red-400' : 'text-gray-400'}`} />
            <span
              className={`text-sm font-mono font-bold tabular-nums ${
                isLowTime ? 'text-red-400 animate-pulse' : 'text-white'
              }`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Recording Status */}
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 bg-red-500" />
            </span>
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
              Recording
            </span>
          </div>

          {/* Submit */}
          <Button
            size="sm"
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold h-8 px-4 rounded-lg"
          >
            Submit
          </Button>
        </div>
      </div>

      {/* Timer Progress Bar */}
      <div className="h-1 bg-gray-800 shrink-0">
        <motion.div
          className="h-full bg-[#6c5ce7]"
          style={{ width: `${timePercent}%` }}
          animate={{ width: `${timePercent}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar */}
        <div className="w-[280px] shrink-0 bg-[#161b22] border-r border-gray-800 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="w-full rounded-none bg-transparent border-b border-gray-800 p-0 h-10">
              {['instructions', 'files', 'hints'].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="flex-1 h-10 rounded-none text-xs font-medium capitalize data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#6c5ce7] text-gray-500"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="instructions" className="flex-1 m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  <div>
                    <Badge className="bg-[#6c5ce7]/20 text-[#a29bfe] text-[10px] font-semibold rounded-full mb-2">
                      MEDIUM
                    </Badge>
                    <h3 className="text-sm font-bold text-white">Two Sum</h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Given an array of integers <code className="text-[#a29bfe] bg-white/5 px-1 rounded">nums</code> and an
                      integer <code className="text-[#a29bfe] bg-white/5 px-1 rounded">target</code>, return
                      indices of the two numbers such that they add up to <code className="text-[#a29bfe] bg-white/5 px-1 rounded">target</code>.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                      Examples
                    </h4>
                    <div className="space-y-2">
                      {[
                        { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
                        { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
                        { input: 'nums = [3,3], target = 6', output: '[0,1]' },
                      ].map((ex, i) => (
                        <div
                          key={i}
                          className="bg-[#0f1117] rounded-lg p-2.5 text-xs font-mono"
                        >
                          <p className="text-gray-400">
                            <span className="text-gray-500">Input:</span> {ex.input}
                          </p>
                          <p className="text-green-400 mt-0.5">
                            <span className="text-gray-500">Output:</span> {ex.output}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                      Constraints
                    </h4>
                    <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                      <li>2 ≤ nums.length ≤ 10⁴</li>
                      <li>-10⁹ ≤ nums[i] ≤ 10⁹</li>
                      <li>-10⁹ ≤ target ≤ 10⁹</li>
                      <li>Only one valid answer exists</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                      Follow-up
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Can you come up with an algorithm that is less than O(n²) time complexity?
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="files" className="flex-1 m-0">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-1">
                  {files.map((file) => {
                    const Icon = file.icon
                    return (
                      <button
                        key={file.name}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors text-sm ${
                          file.active
                            ? 'bg-[#6c5ce7]/15 text-[#a29bfe]'
                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="font-mono text-xs">{file.name}</span>
                        {file.active && <ChevronRight className="size-3 ml-auto" />}
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="hints" className="flex-1 m-0">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-2">
                  {hints.map((hint) => (
                    <div
                      key={hint.id}
                      className={`rounded-xl border p-3 ${
                        hint.unlocked
                          ? 'border-[#6c5ce7]/30 bg-[#6c5ce7]/5'
                          : 'border-gray-800 bg-gray-800/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {hint.unlocked ? (
                          <Lightbulb className="size-4 text-amber-400" />
                        ) : (
                          <Lock className="size-4 text-gray-600" />
                        )}
                        <span
                          className={`text-xs font-semibold ${
                            hint.unlocked ? 'text-white' : 'text-gray-500'
                          }`}
                        >
                          Hint {hint.id}
                        </span>
                        {hint.unlocked && (
                          <Badge className="ml-auto bg-green-500/10 text-green-400 text-[9px] px-1.5 py-0 rounded-full">
                            Available
                          </Badge>
                        )}
                      </div>
                      {hint.unlocked ? (
                        <p className="text-xs text-gray-300 leading-relaxed">{hint.content}</p>
                      ) : (
                        <p className="text-xs text-gray-600 italic">
                          This hint will be available after 10 more minutes.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center — Code Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor Header */}
          <div className="h-10 shrink-0 bg-[#161b22] border-b border-gray-800 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <FileCode className="size-3.5 text-gray-500" />
              <span className="text-xs font-mono text-gray-400">main.py</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRunCode}
              className="h-7 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10 gap-1.5"
            >
              <Terminal className="size-3.5" />
              Run
            </Button>
          </div>

          {/* Code Area with Line Numbers */}
          <div className="flex-1 overflow-auto bg-[#0d1117] relative">
            <div className="flex min-h-full">
              {/* Line Numbers */}
              <div className="shrink-0 py-4 pl-4 pr-3 text-right select-none border-r border-gray-800/50">
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div
                    key={i}
                    className="text-xs font-mono leading-6 text-gray-600"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Code Textarea */}
              <textarea
                value={code}
                onChange={handleCodeChange}
                className="flex-1 py-4 px-4 bg-transparent text-gray-200 font-mono text-[13px] leading-6 resize-none focus:outline-none min-h-full"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                style={{ tabSize: 4, whiteSpace: 'pre', overflowWrap: 'normal' }}
              />
            </div>
          </div>

          {/* Console Output */}
          {consoleOutput.length > 0 && (
            <div className="h-36 shrink-0 bg-[#0d1117] border-t border-gray-800 flex flex-col">
              <div className="h-8 shrink-0 bg-[#161b22] border-b border-gray-800 flex items-center px-4">
                <Terminal className="size-3.5 text-gray-500 mr-2" />
                <span className="text-xs font-medium text-gray-400">Console</span>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3 font-mono text-xs">
                  {consoleOutput.map((line, i) => (
                    <p
                      key={i}
                      className={`leading-5 ${
                        line.includes('✓') || line.includes('passed')
                          ? 'text-green-400'
                          : line.includes('---')
                            ? 'text-gray-500'
                            : 'text-gray-400'
                      }`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Right Sidebar — Proctoring Panel */}
        <div className="w-[240px] shrink-0 bg-[#161b22] border-l border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-red-400" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Proctoring Panel
              </h3>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="size-3.5 text-gray-500" />
                <span className="text-xs text-gray-400">Tab Switches</span>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono ${
                  tabSwitches === 0
                    ? 'border-green-500/30 text-green-400'
                    : 'border-amber-500/30 text-amber-400'
                }`}
              >
                {tabSwitches}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Copy className="size-3.5 text-gray-500" />
                <span className="text-xs text-gray-400">Copy Events</span>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-green-500/30 text-green-400"
              >
                {copyEvents}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-gray-500" />
                <span className="text-xs text-gray-400">Window Focus</span>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono ${
                  focusPercent >= 95
                    ? 'border-green-500/30 text-green-400'
                    : 'border-amber-500/30 text-amber-400'
                }`}
              >
                {focusPercent.toFixed(0)}%
              </Badge>
            </div>

            {/* Focus Bar */}
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${focusPercent}%`,
                  backgroundColor: focusPercent >= 95 ? '#22c55e' : '#f59e0b',
                }}
                animate={{ width: `${focusPercent}%` }}
              />
            </div>
          </div>

          <div className="px-4 py-2 border-t border-gray-800">
            <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">
              Events
            </span>
          </div>

          {/* Warning Events */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1.5">
              <AnimatePresence>
                {warnings.map((warning) => (
                  <motion.div
                    key={warning.id}
                    initial={{ opacity: 0, x: 10, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: -10, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-start gap-2 p-2 rounded-lg text-xs leading-relaxed ${
                      warning.type === 'success'
                        ? 'bg-green-500/5 text-green-400'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {warning.type === 'success' ? (
                      <CheckCircle2 className="size-3.5 shrink-0 mt-0.5 text-green-500" />
                    ) : (
                      <AlertTriangle className="size-3.5 shrink-0 mt-0.5 text-amber-500" />
                    )}
                    <span>{warning.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>

          {/* Session Info Footer */}
          <div className="p-4 border-t border-gray-800 space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-600">Session ID</span>
              <span className="text-gray-500 font-mono">PROC-2024-0847</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-600">Started</span>
              <span className="text-gray-500 font-mono">14:32:00</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-600">Status</span>
              <span className="text-green-400 font-semibold">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSubmitModal(false)}
          >
            <motion.div
              className="bg-[#1a1f36] rounded-2xl p-6 max-w-sm w-full mx-4 border border-gray-800 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-green-500/10">
                  <CheckCircle2 className="size-5 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Submit Assessment?</h3>
              </div>
              <p className="text-sm text-gray-400 mb-5 leading-relaxed">
                You have {formatTime(timeLeft)} remaining. Are you sure you want to submit? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => setShowSubmitModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                  onClick={() => {
                    setShowSubmitModal(false)
                    setConsoleOutput((prev) => [
                      ...prev,
                      '',
                      '=== SUBMISSION SUCCESSFUL ===',
                      'All test cases: 3/3 PASSED',
                      'Time taken: 00:12:34',
                      'Score: 100/100',
                      '==========================',
                    ])
                  }}
                >
                  Confirm Submit
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}