'use client'

import { useSyncExternalStore, useCallback, useRef } from 'react'

interface NetworkStatus {
  isOnline: boolean
  connectionType: string        // raw effectiveType from API
  displayType: string           // human-readable: "5G", "4G", "WiFi", etc.
  carrierName: string           // carrier name if available
  lastOnlineAt: number | null
  lastOfflineAt: number | null
  reconnectAttempts: number
}

const listeners = new Set<() => void>()

function getConnectionType(): { raw: string; display: string } {
  const nav = navigator as any
  if (nav.connection) {
    const netType = nav.connection.type || ''        // 'wifi', 'cellular', 'ethernet', 'none', 'unknown'
    const effective = nav.connection.effectiveType || '' // '4g', '3g', '2g', 'slow-2g'

    // 1. Explicit WiFi / Ethernet → show the actual type
    if (netType === 'wifi') return { raw: 'wifi', display: 'WiFi' }
    if (netType === 'ethernet') return { raw: 'ethernet', display: 'Ethernet' }

    // 2. Cellular → show the effective speed class as-is (browser already maps 5G→4g in many cases)
    if (netType === 'cellular') {
      switch (effective) {
        case '4g':      return { raw: '4g', display: '4G+' }
        case '3g':      return { raw: '3g', display: '3G' }
        case '2g':      return { raw: '2g', display: '2G' }
        case 'slow-2g': return { raw: 'slow-2g', display: 'EDGE' }
        default:        return { raw: 'cellular', display: 'Cellular' }
      }
    }

    // 3. No type but effectiveType exists (some browsers)
    //    Most desktop/laptop browsers don't set type but do set effectiveType.
    //    Without type we cannot know if it's WiFi or cellular → default to WiFi.
    if (effective) return { raw: effective, display: 'WiFi' }

    // 4. Nothing available
    return { raw: 'unknown', display: 'WiFi' }
  }
  return { raw: 'unknown', display: 'WiFi' }
}

function getCarrierName(): string {
  const nav = navigator as any
  if (nav.connection) {
    return nav.connection.carrierName || ''
  }
  return ''
}

const initialConnection = typeof window !== 'undefined' ? getConnectionType() : { raw: 'unknown', display: 'WiFi' }
const initialCarrier = typeof window !== 'undefined' ? getCarrierName() : ''

const storeRef: { current: NetworkStatus } = {
  current: {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: initialConnection.raw,
    displayType: initialConnection.display,
    carrierName: initialCarrier,
    lastOnlineAt: null,
    lastOfflineAt: null,
    reconnectAttempts: 0,
  },
}

function emitChange() {
  listeners.forEach((fn) => fn())
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => { listeners.delete(callback) }
}

function getSnapshot(): NetworkStatus {
  return storeRef.current
}

const SERVER_SNAPSHOT: NetworkStatus = {
  isOnline: true,
  connectionType: 'unknown',
  displayType: 'WiFi',
  carrierName: '',
  lastOnlineAt: null,
  lastOfflineAt: null,
  reconnectAttempts: 0,
}

function getServerSnapshot(): NetworkStatus {
  return SERVER_SNAPSHOT
}

// Initialize connection type and listen for changes
if (typeof window !== 'undefined') {
  const conn = getConnectionType()
  storeRef.current.connectionType = conn.raw
  storeRef.current.displayType = conn.display
  storeRef.current.carrierName = getCarrierName()

  window.addEventListener('online', () => {
    const conn = getConnectionType()
    storeRef.current = {
      ...storeRef.current,
      isOnline: true,
      lastOnlineAt: Date.now(),
      reconnectAttempts: 0,
      connectionType: conn.raw,
      displayType: conn.display,
      carrierName: getCarrierName(),
    }
    emitChange()
  })

  window.addEventListener('offline', () => {
    storeRef.current = {
      ...storeRef.current,
      isOnline: false,
      lastOfflineAt: Date.now(),
      connectionType: 'disconnected',
      displayType: 'OFFLINE',
    }
    emitChange()
  })

  const nav = navigator as any
  if (nav.connection) {
    nav.connection.addEventListener('change', () => {
      const conn = getConnectionType()
      storeRef.current = {
        ...storeRef.current,
        connectionType: conn.raw,
        displayType: conn.display,
        carrierName: getCarrierName(),
      }
      emitChange()
    })
  }

  // Reconnect counter when offline
  setInterval(() => {
    if (!navigator.onLine) {
      storeRef.current = {
        ...storeRef.current,
        reconnectAttempts: storeRef.current.reconnectAttempts + 1,
      }
      emitChange()
    }
  }, 5000)
}

export function useNetworkStatus(): NetworkStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}