'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  FileText,
  Network,
  Bell,
  Activity,
  User,
  MessageSquare,
  Terminal,
  MessageCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAppStore, type ViewName } from '@/store/app'
import { cn } from '@/lib/utils'

const navItems: { label: string; view: ViewName; icon: React.ElementType }[] = [
  { label: 'Simulation Feed', view: 'dashboard', icon: FileText },
  { label: 'Network', view: 'network-hub', icon: Network },
  { label: 'Pulse', view: 'pulse', icon: Bell },
  { label: 'Network Analysis', view: 'network-analysis', icon: Activity },
  { label: 'Operator Profile', view: 'operator-profile', icon: User },
  { label: 'Doubt Session', view: 'doubt-chat', icon: MessageSquare },
  { label: 'Proctored Sandbox', view: 'proctored-sandbox', icon: Terminal },
]

export default function Sidebar() {
  const { currentView, user, sidebarCollapsed, setView, logout, toggleSidebar } =
    useAppStore()

  const level = user?.level ?? 42
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'OP'

  return (
    <motion.aside
      className="flex flex-col h-full bg-[#1a1f36] text-white shrink-0 overflow-hidden"
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Top section: Zenith Hub + level */}
      <div className="flex flex-col gap-1 px-4 pt-5 pb-3">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.div
              key="expanded-header"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-0.5"
            >
              <span className="font-bold text-base tracking-tight">Zenith Hub</span>
              <span className="text-gray-400 text-xs">Operator {String(level).padStart(3, '0')}</span>
            </motion.div>
          )}
        </AnimatePresence>
        {sidebarCollapsed && (
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-bold text-base">Z</span>
            <span className="text-gray-400 text-[10px]">{level}</span>
          </div>
        )}
      </div>

      {/* New Simulation button */}
      <div className="px-3 pb-3">
        <button
          onClick={() => setView('dashboard')}
          className={cn(
            'flex items-center justify-center gap-2 w-full rounded-lg bg-[#6c5ce7] text-white text-sm font-medium h-9 transition-colors hover:bg-[#5a4bd6]',
            sidebarCollapsed && 'px-0'
          )}
        >
          <Plus className="size-4 shrink-0" />
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.span
                key="btn-text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                New Simulation
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = currentView === item.view
          const Icon = item.icon
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              title={sidebarCollapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg h-9 px-3 text-sm font-medium transition-colors w-full text-left',
                isActive
                  ? 'bg-[#6c5ce7] text-white'
                  : 'text-gray-400 hover:bg-white/10 hover:text-gray-200'
              )}
            >
              <Icon className="size-4 shrink-0" />
              <AnimatePresence mode="wait">
                {!sidebarCollapsed && (
                  <motion.span
                    key={item.view + '-label'}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="flex flex-col gap-1 px-3 pb-3">
        {/* Support */}
        <button
          title={sidebarCollapsed ? 'Support' : undefined}
          className="flex items-center gap-3 rounded-lg h-9 px-3 text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors w-full text-left"
        >
          <MessageCircle className="size-4 shrink-0" />
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.span
                key="support-label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Support
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          title={sidebarCollapsed ? 'Logout' : undefined}
          className="flex items-center gap-3 rounded-lg h-9 px-3 text-sm font-medium text-red-400 hover:bg-white/10 hover:text-red-300 transition-colors w-full text-left"
        >
          <LogOut className="size-4 shrink-0" />
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.span
                key="logout-label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center gap-2 rounded-lg h-9 text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors w-full mt-1"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="size-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="size-4 shrink-0" />
              <AnimatePresence mode="wait">
                <motion.span
                  key="collapse-label"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap text-sm"
                >
                  Collapse
                </motion.span>
              </AnimatePresence>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  )
}