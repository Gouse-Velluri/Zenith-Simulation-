'use client'

import { useEffect, useRef } from 'react'
import { useAppStore, type OnlineUser } from '@/store/app'

const HEARTBEAT_INTERVAL_MS = 15_000 // 15 seconds

export function usePresence() {
  const user = useAppStore((s) => s.user)
  const setOnlineUsers = useAppStore((s) => s.setOnlineUsers)
  const onlineUsers = useAppStore((s) => s.onlineUsers)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const sendHeartbeat = async () => {
      try {
        const res = await fetch('/api/presence/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
        if (res.ok) {
          const data = await res.json()
          setOnlineUsers(data.onlineUsers as OnlineUser[])
        }
      } catch {
        // Silently fail — presence is non-critical
      }
    }

    // Send first heartbeat immediately
    sendHeartbeat()

    // Then every 15 seconds
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [user, setOnlineUsers])

  const isUserOnline = (userId: string) => {
    return onlineUsers.some((u) => u.id === userId)
  }

  const onlineCount = onlineUsers.length

  return { onlineUsers, onlineCount, isUserOnline }
}