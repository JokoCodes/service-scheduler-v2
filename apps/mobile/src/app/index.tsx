import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'

export default function IndexPage() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking existing auth session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Error checking session:', error)
        router.replace('/(auth)/login')
        return
      }

      if (session?.user) {
        console.log('✅ Found existing session for:', session.user.email)
        router.replace('/(tabs)')
      } else {
        console.log('ℹ️ No existing session, redirecting to login')
        router.replace('/(auth)/login')
      }
    } catch (error) {
      console.error('❌ Auth check error:', error)
      router.replace('/(auth)/login')
    } finally {
      setIsCheckingAuth(false)
    }
  }

  // Show loading screen while determining auth status
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
})
