import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('Service Technician')
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUpMode, setIsSignUpMode] = useState(false)

  const handleSignUp = async () => {
    console.log('🚀 [SIGNUP] Starting signup process');
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    // Get company ID from environment
    const companyId = process.env.EXPO_PUBLIC_COMPANY_ID
    if (!companyId) {
      console.error('❌ [SIGNUP] No company ID configured in environment')
      Alert.alert('Configuration Error', 'Company ID not configured. Please contact support.')
      return
    }

    setIsLoading(true)
    let authUserId: string | null = null
    let employeeId: string | null = null
    let profileCreated = false
    
    try {
      console.log('📝 [SIGNUP] Creating new user account for:', email)
      console.log('🏢 [SIGNUP] Using company ID:', companyId)
      
      // Step 1: Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            name: name.trim(),
            role: 'employee'
          }
        }
      })
      
      if (authError) {
        console.error('❌ [SIGNUP] Auth user creation failed:', authError)
        Alert.alert('Sign Up Failed', authError.message)
        return
      }
      
      if (!authData.user) {
        console.error('❌ [SIGNUP] Auth user creation returned no user data')
        Alert.alert('Sign Up Failed', 'Failed to create user account')
        return
      }
      
      authUserId = authData.user.id
      console.log('✅ [SIGNUP] Auth user created successfully:', authUserId)
      
      // Step 2: Create employee record
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .insert({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          position: position.trim(),
          company_id: companyId,
          is_active: true,
          hourly_rate: 25.00, // Default hourly rate
          avg_rating: 0,
          total_ratings: 0,
          total_hours_worked: 0,
          total_bookings_completed: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()
      
      if (employeeError) {
        console.error('❌ [SIGNUP] Employee creation failed:', employeeError)
        console.log('🔄 [SIGNUP] Rolling back: Deleting auth user')
        
        // Rollback: Delete auth user
        try {
          await supabase.auth.admin.deleteUser(authUserId)
          console.log('✅ [SIGNUP] Auth user rollback successful')
        } catch (rollbackError) {
          console.error('💥 [SIGNUP] Auth user rollback failed:', rollbackError)
          console.log('⚠️ [SIGNUP] Manual cleanup may be required for auth user:', authUserId)
        }
        
        Alert.alert('Sign Up Failed', 'Failed to create employee record. Please try again.')
        return
      }
      
      employeeId = employeeData.id
      console.log('✅ [SIGNUP] Employee created successfully:', employeeId)
      
      // Step 3: Create profile record (links to auth user)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUserId, // Use auth user ID as primary key
          name: name.trim(),
          full_name: name.trim(), // Add full_name for compatibility
          phone: phone.trim() || null,
          position: position.trim(),
          hourly_rate: 25.00, // Default hourly rate
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (profileError) {
        console.error('❌ [SIGNUP] Profile creation failed:', profileError)
        console.log('🔄 [SIGNUP] Rolling back: Deleting employee and auth user')
        
        // Rollback: Delete employee
        try {
          await supabase.from('employees').delete().eq('id', employeeId)
          console.log('✅ [SIGNUP] Employee rollback successful')
        } catch (rollbackError) {
          console.error('💥 [SIGNUP] Employee rollback failed:', rollbackError)
          console.log('⚠️ [SIGNUP] Manual cleanup may be required for employee:', employeeId)
        }
        
        // Rollback: Delete auth user
        try {
          await supabase.auth.admin.deleteUser(authUserId)
          console.log('✅ [SIGNUP] Auth user rollback successful')
        } catch (rollbackError) {
          console.error('💥 [SIGNUP] Auth user rollback failed:', rollbackError)
          console.log('⚠️ [SIGNUP] Manual cleanup may be required for auth user:', authUserId)
        }
        
        Alert.alert('Sign Up Failed', 'Failed to create user profile. Please try again.')
        return
      }
      
      profileCreated = true
      console.log('✅ [SIGNUP] Profile created successfully')
      console.log('🎉 [SIGNUP] Complete! All records created:', {
        authUserId,
        employeeId,
        email: email.trim(),
        companyId
      })
      
      Alert.alert(
        'Account Created!', 
        `Welcome to ServiceScheduler Pro! Your account has been created successfully. You can now sign in.`, 
        [{ text: 'OK', onPress: () => setIsSignUpMode(false) }]
      )
    } catch (error) {
      console.error('💥 [SIGNUP] Unexpected error during signup:', error)
      console.log('🔄 [SIGNUP] Attempting rollback due to unexpected error')
      
      // Emergency rollback
      if (profileCreated && authUserId) {
        try {
          await supabase.from('profiles').delete().eq('id', authUserId)
          console.log('✅ [SIGNUP] Emergency profile rollback successful')
        } catch (rollbackError) {
          console.error('💥 [SIGNUP] Emergency profile rollback failed:', rollbackError)
        }
      }
      
      if (employeeId) {
        try {
          await supabase.from('employees').delete().eq('id', employeeId)
          console.log('✅ [SIGNUP] Emergency employee rollback successful')
        } catch (rollbackError) {
          console.error('💥 [SIGNUP] Emergency employee rollback failed:', rollbackError)
        }
      }
      
      if (authUserId) {
        try {
          await supabase.auth.admin.deleteUser(authUserId)
          console.log('✅ [SIGNUP] Emergency auth user rollback successful')
        } catch (rollbackError) {
          console.error('💥 [SIGNUP] Emergency auth user rollback failed:', rollbackError)
        }
      }
      
      Alert.alert('Sign Up Failed', 'An unexpected error occurred during sign up. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async () => {
    console.log('Login button pressed');
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password')
      return
    }

    setIsLoading(true)
    
    try {
      console.log('🔐 Attempting Supabase auth for:', email)
      
      // Development mode: First check if this is our known test employee
      if (email.trim().toLowerCase() === 'emanjoko@yahoo.com') {
        console.log('🔧 Development mode: Using special handling for test employee')
        
        // Try to sign in with a known password first
        let authResult = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: 'password123', // Use a consistent dev password
        })
        
        if (authResult.error) {
          console.log('🔄 Sign in failed, attempting signup for test employee...')
          // If sign in fails, create the auth user
          authResult = await supabase.auth.signUp({
            email: email.trim(),
            password: 'password123',
          })
          
          if (authResult.error) {
            console.error('❌ Failed to create auth user:', authResult.error)
            Alert.alert('Login Failed', 'Unable to authenticate test employee')
            return
          }
        }
        
        if (authResult.data.user) {
          console.log('✅ Test employee authenticated:', authResult.data.user.id)
          console.log('Demo login successful for:', email)
          
          // Wait for session to be established
          await new Promise(resolve => setTimeout(resolve, 500))
          
          router.replace('/(tabs)')
          return
        }
      }
      
      // For other emails, use normal auth flow
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (error) {
        console.error('❌ Supabase auth error:', error)
        // For development, if the user doesn't exist, try to sign them up
        if (error.message?.includes('Invalid login credentials')) {
          console.log('🔄 User not found, attempting signup...')
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: email.trim(),
            password: password.trim(),
          })
          
          if (signUpError) {
            console.error('❌ Signup error:', signUpError)
            Alert.alert('Login Failed', 'Unable to authenticate. Please check your credentials.')
            return
          }
          
          if (signUpData.user && signUpData.session) {
            console.log('✅ User signed up successfully:', signUpData.user.id)
            console.log('✅ Session established:', signUpData.session.access_token ? 'Yes' : 'No')
            console.log('Demo login successful for:', email)
            
            // Wait a moment for the session to be fully established
            await new Promise(resolve => setTimeout(resolve, 500))
            
            router.replace('/(tabs)')
            return
          }
        } else {
          Alert.alert('Login Failed', error.message || 'Invalid email or password')
          return
        }
      }

      if (data.user) {
        console.log('✅ Supabase auth successful for:', data.user.email, 'ID:', data.user.id)
        console.log('Demo login successful for:', email)
        
        // Navigate to main app using Expo Router
        router.replace('/(tabs)')
      } else {
        Alert.alert('Login Failed', 'Authentication failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      Alert.alert('Login Failed', 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo/Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="construct" size={60} color="#3b82f6" />
            </View>
            <Text style={styles.title}>Service Scheduler</Text>
            <Text style={styles.subtitle}>Employee Portal</Text>
          </View>

          {/* Auth Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Sign-up only fields */}
            {isSignUpMode && (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name *"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number (optional)"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="briefcase-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Position"
                    value={position}
                    onChangeText={setPosition}
                    autoCapitalize="words"
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={isSignUpMode ? handleSignUp : handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading 
                  ? (isSignUpMode ? 'Creating Account...' : 'Signing In...') 
                  : (isSignUpMode ? 'Create Account' : 'Sign In')
                }
              </Text>
            </TouchableOpacity>

            {/* Toggle between Sign In / Sign Up */}
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setIsSignUpMode(!isSignUpMode)
                // Clear form when switching modes
                setName('')
                setPhone('')
                setPosition('Service Technician')
              }}
              disabled={isLoading}
            >
              <Text style={styles.toggleButtonText}>
                {isSignUpMode 
                  ? 'Already have an account? Sign In' 
                  : 'New employee? Create Account'
                }
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Demo Mode: Test with existing employee
            </Text>
            <Text style={styles.demoText}>
              Try: emanjoko@yahoo.com / any password
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  demoText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
  },
})
