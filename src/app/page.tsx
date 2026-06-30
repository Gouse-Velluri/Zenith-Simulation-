'use client'

import { useAppStore } from '@/store/app'
import LandingPage from '@/components/landing/landing-page'
import LoginPage from '@/components/auth/login-page'
import RegisterPage from '@/components/auth/register-page'
import AppLayout from '@/components/layout/app-layout'

export default function Home() {
  const { currentView, user } = useAppStore()

  if (currentView === 'landing') return <LandingPage />
  if (currentView === 'login') return <LoginPage />
  if (currentView === 'register') return <RegisterPage />

  if (!user) return <LandingPage />

  return <AppLayout />
}