'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Code2,
  MessageSquare,
  Plus,
  Circle,
  Bot,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/store/app'
import { io } from 'socket.io-client'

interface ChatMessage {
  id: string
  sessionId: string
  sender: 'student' | 'trainer'
  senderName: string
  type: 'text' | 'code'
  content: string
  timestamp: Date
}

interface DoubtSession {
  id: string
  title: string
  lastMessage: string
  timeAgo: string
  unread: number
  trainerOnline: boolean
  trainerName: string
}

const mockSessions: DoubtSession[] = [
  {
    id: 's1',
    title: 'TCP vs UDP Confusion',
    lastMessage: 'TCP guarantees delivery, while UDP is faster...',
    timeAgo: '5m',
    unread: 3,
    trainerOnline: true,
    trainerName: 'Dr. Sarah Chen',
  },
  {
    id: 's2',
    title: 'Binary Search Tree',
    lastMessage: 'The time complexity for balanced BST is O(log n)',
    timeAgo: '1h',
    unread: 0,
    trainerOnline: true,
    trainerName: 'Prof. James Liu',
  },
  {
    id: 's3',
    title: 'Dijkstra Algorithm Help',
    lastMessage: 'Can you explain the priority queue approach?',
    timeAgo: '3h',
    unread: 1,
    trainerOnline: false,
    trainerName: 'Dr. Sarah Chen',
  },
  {
    id: 's4',
    title: 'OS Process Scheduling',
    lastMessage: 'Round Robin uses time quanta for fair allocation',
    timeAgo: '1d',
    unread: 0,
    trainerOnline: true,
    trainerName: 'Prof. Aisha Patel',
  },
  {
    id: 's5',
    title: 'SQL Join Query Issue',
    lastMessage: 'You need a LEFT JOIN to keep all students',
    timeAgo: '2d',
    unread: 0,
    trainerOnline: false,
    trainerName: 'Dr. Mike Torres',
  },
]

const initialMessages: Record<string, ChatMessage[]> = {
  s1: [
    {
      id: 'm1',
      sessionId: 's1',
      sender: 'student',
      senderName: 'You',
      type: 'text',
      content: "I'm really confused about when to use TCP vs UDP. Can you help me understand the key differences?",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: 'm2',
      sessionId: 's1',
      sender: 'trainer',
      senderName: 'Dr. Sarah Chen',
      type: 'text',
      content:
        'Great question! TCP (Transmission Control Protocol) is connection-oriented — it establishes a connection before sending data and guarantees delivery. Think of it like a registered mail.',
      timestamp: new Date(Date.now() - 1000 * 60 * 28),
    },
    {
      id: 'm3',
      sessionId: 's1',
      sender: 'trainer',
      senderName: 'Dr. Sarah Chen',
      type: 'text',
      content:
        'UDP (User Datagram Protocol) is connectionless — it just sends packets without establishing a connection. No delivery guarantee, but much faster. Think of it like shouting across a room.',
      timestamp: new Date(Date.now() - 1000 * 60 * 27),
    },
    {
      id: 'm4',
      sessionId: 's1',
      sender: 'student',
      senderName: 'You',
      type: 'text',
      content: 'So for a video call, which one would I use?',
      timestamp: new Date(Date.now() - 1000 * 60 * 20),
    },
    {
      id: 'm5',
      sessionId: 's1',
      sender: 'trainer',
      senderName: 'Dr. Sarah Chen',
      type: 'code',
      content: `# Real-world usage examples:

# TCP use cases:
# - Web browsing (HTTP/HTTPS)
# - File transfer (FTP)
# - Email (SMTP/IMAP)
# - SSH connections

# UDP use cases:
# - Video streaming
# - Online gaming
# - DNS lookups
# - Voice over IP (VoIP)

# The key insight: if you NEED reliability
# → use TCP. If you NEED speed and can
# tolerate some loss → use UDP.`,
      timestamp: new Date(Date.now() - 1000 * 60 * 18),
    },
    {
      id: 'm6',
      sessionId: 's1',
      sender: 'trainer',
      senderName: 'Dr. Sarah Chen',
      type: 'text',
      content: 'TCP guarantees delivery, while UDP is faster. Most video apps actually use a hybrid — UDP for the media stream, TCP for signaling.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
  ],
  s2: [
    {
      id: 'm10',
      sessionId: 's2',
      sender: 'student',
      senderName: 'You',
      type: 'text',
      content: 'What is the time complexity of searching in a BST?',
      timestamp: new Date(Date.now() - 1000 * 60 * 65),
    },
    {
      id: 'm11',
      sessionId: 's2',
      sender: 'trainer',
      senderName: 'Prof. James Liu',
      type: 'text',
      content: 'The time complexity for balanced BST is O(log n), but for a skewed/unbalanced BST it degrades to O(n).',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
    },
  ],
}

export default function DoubtChatView() {
  const { user } = useAppStore()
  const [sessions] = useState<DoubtSession[]>(mockSessions)
  const [activeSessionId, setActiveSessionId] = useState<string>('s1')
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [codeMode, setCodeMode] = useState(false)
  const [codeValue, setCodeValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [connected, setConnected] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<ReturnType<typeof io> | null>(null)

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0]
  const currentMessages = messagesMap[activeSessionId] || []

  // Connect to socket.io
  useEffect(() => {
    const socket = io('/?XTransformPort=3004', {
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join-session', activeSessionId)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    socket.on('receive-message', (msg: ChatMessage) => {
      setMessagesMap((prev) => ({
        ...prev,
        [msg.sessionId]: [...(prev[msg.sessionId] || []), msg],
      }))
    })

    socket.on('trainer-typing', () => {
      setIsTyping(true)
      setTimeout(() => setIsTyping(false), 2000)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
    }, [])

  // Join session on change
  useEffect(() => {
    socketRef.current?.emit('join-session', activeSessionId)
  }, [activeSessionId])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [currentMessages, isTyping])

  const sendMessage = useCallback(() => {
    const content = codeMode ? codeValue.trim() : inputValue.trim()
    if (!content) return

    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      sessionId: activeSessionId,
      sender: 'student',
      senderName: user?.name || 'You',
      type: codeMode ? 'code' : 'text',
      content,
      timestamp: new Date(),
    }

    socketRef.current?.emit('send-message', msg)

    setMessagesMap((prev) => ({
      ...prev,
      [activeSessionId]: [...(prev[activeSessionId] || []), msg],
    }))

    setInputValue('')
    setCodeValue('')
    setCodeMode(false)
  }, [codeMode, codeValue, inputValue, activeSessionId, user?.name])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      sendMessage()
    }
    // Allow tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.target as HTMLTextAreaElement
      const start = target.selectionStart
      const end = target.selectionEnd
      const newCode = codeValue.substring(0, start) + '    ' + codeValue.substring(end)
      setCodeValue(newCode)
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4
      }, 0)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="h-full flex bg-white dark:bg-[#0f1117] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
      {/* Left Panel — Sessions List */}
      <div className="w-[280px] shrink-0 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Doubt Sessions
            </h2>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Circle
              className={`size-2 fill-current ${
                connected ? 'text-green-500' : 'text-red-400'
              }`}
            />
            <span className={connected ? 'text-green-600' : 'text-red-400'}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <Separator />

        {/* Sessions List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <motion.button
                key={session.id}
                className={`w-full text-left p-3 rounded-xl transition-colors flex gap-3 items-start group ${
                  activeSessionId === session.id
                    ? 'bg-[#6c5ce7]/10 dark:bg-[#6c5ce7]/20'
                    : 'hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
                onClick={() => setActiveSessionId(session.id)}
                whileTap={{ scale: 0.98 }}
              >
                <div className="mt-0.5 relative shrink-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      activeSessionId === session.id
                        ? 'bg-[#6c5ce7]'
                        : 'bg-gray-400 dark:bg-gray-600'
                    }`}
                  >
                    <Bot className="size-4" />
                  </div>
                  {session.trainerOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#0f1117]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm font-medium truncate ${
                        activeSessionId === session.id
                          ? 'text-[#6c5ce7] dark:text-[#a29bfe]'
                          : 'text-gray-900 dark:text-gray-200'
                      }`}
                    >
                      {session.title}
                    </p>
                    {session.unread > 0 && (
                      <Badge className="h-5 min-w-5 rounded-full bg-red-500 text-white text-[10px] px-1.5 flex items-center justify-center shrink-0">
                        {session.unread}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {session.lastMessage}
                  </p>
                  <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">
                    {session.timeAgo} ago
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel — Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#6c5ce7] flex items-center justify-center text-white">
              <Bot className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {activeSession.title}
              </h3>
              <p className="text-xs text-gray-400">{activeSession.trainerName}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeSession.trainerOnline
                ? 'border-green-500/30 bg-green-500/10 text-green-600'
                : 'border-gray-400/30 bg-gray-400/10 text-gray-500'
            }`}
          >
            <Circle
              className={`size-1.5 mr-1 fill-current ${
                activeSession.trainerOnline ? 'text-green-500' : 'text-gray-400'
              }`}
            />
            {activeSession.trainerOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Messages Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        >
          {currentMessages.map((msg) => {
            const isStudent = msg.sender === 'student'
            return (
              <motion.div
                key={msg.id}
                className={`flex gap-2.5 ${isStudent ? 'flex-row-reverse' : 'flex-row'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-1 ${
                    isStudent ? 'bg-blue-500' : 'bg-[#6c5ce7]'
                  }`}
                >
                  {isStudent ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[70%] ${
                    isStudent ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-gray-300 dark:text-gray-600">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  {msg.type === 'code' ? (
                    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 dark:bg-gray-900 text-gray-400 text-[10px]">
                        <Code2 className="size-3" />
                        <span>Code</span>
                      </div>
                      <pre className="p-3 bg-[#1e1e2e] text-[13px] leading-relaxed overflow-x-auto">
                        <code className="text-green-400 font-mono">{msg.content}</code>
                      </pre>
                    </div>
                  ) : (
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        isStudent
                          ? 'bg-[#6c5ce7] text-white rounded-br-md'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                className="flex gap-2.5 items-end"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-7 h-7 rounded-full bg-[#6c5ce7] flex items-center justify-center text-white shrink-0">
                  <Bot className="size-3.5" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 p-4">
          <AnimatePresence mode="wait">
            {codeMode ? (
              <motion.div
                key="code-input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <Code2 className="size-3.5" />
                  <span>Code Mode — Press Ctrl+Enter to send, Tab to indent</span>
                </div>
                <textarea
                  value={codeValue}
                  onChange={(e) => setCodeValue(e.target.value)}
                  onKeyDown={handleCodeKeyDown}
                  placeholder="Paste or write code here..."
                  className="w-full h-32 bg-[#1e1e2e] text-green-400 font-mono text-sm rounded-xl p-4 border border-gray-700 focus:outline-none focus:border-[#6c5ce7] resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCodeMode(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={sendMessage}
                    disabled={!codeValue.trim()}
                    className="bg-[#6c5ce7] hover:bg-[#5a4bd6] text-white text-xs"
                  >
                    <Send className="size-3.5 mr-1.5" />
                    Send Code
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="text-input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-2 items-center"
              >
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your doubt..."
                  className="flex-1 h-10 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/30 border border-transparent focus:border-[#6c5ce7]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCodeMode(true)}
                  className="h-10 w-10 p-0 rounded-xl shrink-0"
                  title="Code mode"
                >
                  <Code2 className="size-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={sendMessage}
                  disabled={!inputValue.trim()}
                  className="h-10 w-10 p-0 rounded-xl shrink-0 bg-[#6c5ce7] hover:bg-[#5a4bd6] text-white"
                >
                  <Send className="size-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}