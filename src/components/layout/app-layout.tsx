'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Search, Settings, HelpCircle, WifiOff, Users } from 'lucide-react'
import { useAppStore } from '@/store/app'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { usePresence } from '@/hooks/use-presence'
import Sidebar from '@/components/layout/sidebar'
import DashboardView from '@/components/dashboard/dashboard-view'
import OperatorProfileView from '@/components/dashboard/operator-profile-view'
import NetworkHubView from '@/components/network/network-hub-view'
import PulseView from '@/components/pulse/pulse-view'
import NetworkAnalysisView from '@/components/analysis/network-analysis-view'
import DoubtChatView from '@/components/chat/doubt-chat-view'
import ProctoredSandboxView from '@/components/proctoring/proctored-sandbox-view'

export default function AppLayout() {
  const { user, currentView, setView } = useAppStore()
  const { isOnline, displayType, lastOfflineAt, reconnectAttempts } = useNetworkStatus()
  const { onlineCount } = usePresence()

  const firstName = user?.name?.split(' ')[0] ?? 'O'
  const firstLetter = firstName.charAt(0).toUpperCase()

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />
      case 'network-hub':
        return <NetworkHubView />
      case 'pulse':
        return <PulseView />
      case 'network-analysis':
        return <NetworkAnalysisView />
      case 'operator-profile':
        return <OperatorProfileView />
      case 'doubt-chat':
        return <DoubtChatView />
      case 'proctored-sandbox':
        return <ProctoredSandboxView />
      default:
        return <DashboardView />
    }
  }

  const offlineSeconds = lastOfflineAt ? Math.floor((Date.now() - lastOfflineAt) / 1000) : 0

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1f36]">
      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 48, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-950/90 border-b border-red-500/30 flex items-center justify-center gap-3 px-4 z-50 relative shrink-0 overflow-hidden"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <WifiOff className="size-4 text-red-400" />
            </motion.div>
            <p className="text-red-200 text-sm font-medium">
              Connection Lost — Real-time data paused.
              {offlineSeconds > 0 && ` Offline for ${offlineSeconds}s.`}
              {reconnectAttempts > 0 && ` (${reconnectAttempts} reconnect attempts)`}
            </p>
            <motion.div
              className="absolute inset-x-0 bottom-0 h-px"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ background: 'linear-gradient(90deg, transparent, #ef4444, transparent)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex items-center justify-between h-14 bg-[#1a1f36] px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-white font-bold font-mono text-lg tracking-tight">
            Zenith Simulation
          </span>
        </div>

        <div className="flex-1 flex justify-center px-4">
          <div className="relative w-full max-w-[40%] min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search simulations, operators, resources..."
              className="w-full h-9 rounded-lg bg-white/10 text-white placeholder-gray-400 text-sm pl-9 pr-3 outline-none border border-white/5 focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Online Users Count */}
          <motion.button
            onClick={() => setView('operator-profile')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-[#6c5ce7]/10 text-[#a29bfe] border border-[#6c5ce7]/20 hover:bg-[#6c5ce7]/20 transition-colors cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={`${onlineCount} user${onlineCount !== 1 ? 's' : ''} online — click to view`}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-green-500"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <Users className="size-3.5" />
            <span className="font-semibold">{onlineCount}</span>
          </motion.button>

          {/* Connection indicator in header */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-colors ${
            isOnline 
              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              animate={{
                backgroundColor: isOnline ? '#10b981' : '#ef4444',
                scale: isOnline ? [1, 1.5, 1] : 1,
              }}
              transition={isOnline ? { duration: 2, repeat: Infinity } : {}}
            />
            {isOnline ? displayType : 'OFFLINE'}
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Settings className="size-5" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <HelpCircle className="size-5" />
          </button>
          <div className="flex items-center justify-center size-9 rounded-full bg-[#6c5ce7] text-white font-semibold text-sm cursor-pointer" onClick={() => setView('operator-profile')}>
            {firstLetter}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-56px)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}