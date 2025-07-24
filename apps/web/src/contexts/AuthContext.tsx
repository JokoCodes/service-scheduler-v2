'use client'

import { createContext, useContext, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface AuthContextValue {
  user: any
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: any) => Promise<any>
  logout: () => void
  refreshAuth: () => Promise<boolean>
  handleAuthError: (error: any) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()

  const handleAuthError = useCallback((error: any) => {
    if (error.message && error.message.includes('Session expired')) {
      console.warn('Session expired, redirecting to login')
      auth.logout()
      // Only redirect if we're not already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
  }, [auth])

  const contextValue: AuthContextValue = {
    ...auth,
    handleAuthError,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
