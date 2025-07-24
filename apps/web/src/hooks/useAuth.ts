'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import type { LoginRequest } from '@service-scheduler/shared-types'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = () => {
      const isAuthenticated = apiClient.isAuthenticated()
      const user = apiClient.getCurrentUser()

      if (isAuthenticated && user) {
        // Don't refresh token on every page load - let the API client handle it automatically when needed
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    }

    initializeAuth()
  }, [])

  const login = useCallback(async (credentials: LoginRequest) => {
    setAuthState(prev => ({ ...prev, isLoading: true }))

    try {
      const response = await apiClient.login(credentials)
      
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      })
      
      return { success: true, user: response.user }
    } catch (error: any) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
      
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      }
    }
  }, [])

  const logout = useCallback(() => {
    apiClient.logout()
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }, [])

  const refreshAuth = useCallback(async () => {
    try {
      const refreshedAuth = await apiClient.refreshToken()
      if (refreshedAuth) {
        setAuthState({
          user: refreshedAuth.user,
          isAuthenticated: true,
          isLoading: false,
        })
        return true
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
    }
    return false
  }, [logout])

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    logout,
    refreshAuth,
  }
}
