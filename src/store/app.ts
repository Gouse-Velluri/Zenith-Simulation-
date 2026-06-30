import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewName =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'network-hub'
  | 'pulse'
  | 'operator-profile'
  | 'network-analysis'
  | 'doubt-chat'
  | 'proctored-sandbox'

export interface OnlineUser {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  lastActiveAt: string
}

interface AppState {
  currentView: ViewName
  user: {
    id: string
    name: string
    email: string
    role: string
    avatar?: string
    bio?: string | null
    level: number
    status: string
  } | null
  sidebarCollapsed: boolean
  onlineUsers: OnlineUser[]
  setView: (view: ViewName) => void
  setUser: (user: AppState['user']) => void
  updateUser: (updates: Partial<NonNullable<AppState['user']>>) => void
  logout: () => void
  toggleSidebar: () => void
  setOnlineUsers: (users: OnlineUser[]) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: 'landing',
      user: null,
      sidebarCollapsed: false,
      onlineUsers: [],
      setView: (view) => set({ currentView: view }),
      setUser: (user) => set({ user, currentView: 'dashboard' }),
      updateUser: (updates) =>
        set((s) => ({
          user: s.user ? { ...s.user, ...updates } : null,
        })),
      logout: () => set({ user: null, currentView: 'landing', onlineUsers: [] }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setOnlineUsers: (users) => set({ onlineUsers: users }),
    }),
    {
      name: 'zenith-app-store',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null
          const str = sessionStorage.getItem(name)
          return str ? JSON.parse(str) : null
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return
          sessionStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return
          sessionStorage.removeItem(name)
        },
      },
      partialize: (state) => ({
        user: state.user,
        currentView: state.currentView,
      }),
    }
  )
)