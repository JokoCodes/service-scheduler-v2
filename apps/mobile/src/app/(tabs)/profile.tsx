import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { supabase, Tables } from '../../lib/supabase'
import { earningsService } from '../../lib/services/earningsService'

type Profile = Tables<'profiles'>

interface ProfileData {
  profile: Profile | null
  totalJobs: number
  avgRating: number
  completedJobs: number
  totalEarnings: number
}

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [editableProfile, setEditableProfile] = useState<Partial<Profile>>({})
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      console.log('🔄 [Profile] Starting to load profile data...')
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('👤 [Profile] Auth user result:', { user: user?.id, error: userError })
      
      if (userError || !user) {
        console.error('❌ [Profile] Auth error or no user:', userError)
        Alert.alert('Error', 'Please log in to view profile')
        return
      }
      setCurrentUser(user)
      console.log('✅ [Profile] User set:', user.id)

      // Get profile data
      console.log('📊 [Profile] Fetching profile data from Supabase...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      console.log('📊 [Profile] Profile query result:', { profile, profileError })

      if (profileError) {
        console.error('❌ [Profile] Profile error:', profileError)
        // Create a default profile if none exists
        const defaultProfile = {
          id: user.id,
          email: user.email || '',
          full_name: 'Employee User',
          phone: '',
          role: 'employee' as const,
          company_id: null,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          stripe_account_id: null,
          stripe_onboarding_completed: false,
          stripe_charges_enabled: false,
          stripe_payouts_enabled: false,
          payout_preference: 'standard' as const,
          stripe_connected_at: null,
          stripe_dashboard_url: null,
        }
        setProfileData({ 
          profile: defaultProfile, 
          totalJobs: 0, 
          avgRating: 0, 
          completedJobs: 0,
          totalEarnings: 0 
        })
        setEditableProfile(defaultProfile)
        return
      }

      // Get job statistics
      const { data: jobStats, error: jobStatsError } = await supabase
        .from('bookings')
        .select('status, final_amount')
        .eq('employee_id', user.id)

      let totalJobs = 0
      let completedJobs = 0
      let totalEarnings = 0

      if (jobStats) {
        totalJobs = jobStats.length
        completedJobs = jobStats.filter(job => job.status === 'completed').length
        totalEarnings = jobStats
          .filter(job => job.status === 'completed' && job.final_amount)
          .reduce((sum, job) => sum + (job.final_amount || 0), 0)
      }

      const avgRating = 4.8 // Mock rating - would come from reviews table

      setProfileData({
        profile,
        totalJobs,
        avgRating,
        completedJobs,
        totalEarnings,
      })
      setEditableProfile(profile)
    } catch (error) {
      console.error('Error loading profile:', error)
      Alert.alert('Error', 'Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadProfileData()
    setRefreshing(false)
  }

  const handleSave = async () => {
    if (!currentUser || !editableProfile) return
    
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editableProfile.full_name,
          phone: editableProfile.phone,
          payout_preference: editableProfile.payout_preference,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id)

      if (error) {
        throw error
      }

      setIsEditing(false)
      await loadProfileData() // Reload to get updated data
      Alert.alert('Success', 'Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      Alert.alert('Error', 'Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = () => {
    if (profileData?.profile) {
      setEditableProfile(profileData.profile)
    }
    setIsEditing(false)
  }

  const handleStripeConnect = async () => {
    Alert.alert(
      'Connect to Stripe',
      'To receive payouts, you need to connect your Stripe account. This will redirect you to Stripe to complete the setup.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // In a real app, this would open the Stripe Connect onboarding flow
            Alert.alert('Demo', 'In a real app, this would open Stripe Connect onboarding')
          }
        }
      ]
    )
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={20} color="#fbbf24" />
      )
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={20} color="#fbbf24" />
      )
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={20} color="#d1d5db" />
      )
    }

    return stars
  }

  const renderStripeConnectSection = () => {
    if (!profileData?.profile) return null

    const { profile } = profileData
    const isConnected = profile.stripe_onboarding_completed

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stripe Connect</Text>
        <Text style={styles.sectionSubtitle}>
          Connect your bank account to receive instant payouts
        </Text>

        {isConnected ? (
          <View style={styles.stripeConnectedCard}>
            <View style={styles.stripeIconContainer}>
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
            </View>
            <View style={styles.stripeConnectedInfo}>
              <Text style={styles.stripeConnectedTitle}>Account Connected</Text>
              <Text style={styles.stripeConnectedSubtitle}>
                You're all set to receive payouts
              </Text>
              <View style={styles.payoutPreferenceContainer}>
                <Text style={styles.payoutPreferenceLabel}>Payout Speed:</Text>
                <TouchableOpacity
                  style={styles.payoutPreferenceButton}
                  onPress={() => {
                    Alert.alert(
                      'Payout Preference',
                      `Current: ${profile.payout_preference === 'instant' ? 'Instant (1.5% fee)' : 'Standard (2-7 business days)'}`,
                      [
                        { text: 'OK' }
                      ]
                    )
                  }}
                >
                  <Text style={styles.payoutPreferenceText}>
                    {profile.payout_preference === 'instant' ? 'Instant' : 'Standard'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.stripeDisconnectedCard}>
            <View style={styles.stripeIconContainer}>
              <Ionicons name="card" size={32} color="#f59e0b" />
            </View>
            <View style={styles.stripeDisconnectedInfo}>
              <Text style={styles.stripeDisconnectedTitle}>Connect Your Account</Text>
              <Text style={styles.stripeDisconnectedSubtitle}>
                Set up instant payouts and manage your earnings
              </Text>
              <TouchableOpacity 
                style={styles.stripeConnectButton}
                onPress={handleStripeConnect}
              >
                <Text style={styles.stripeConnectButtonText}>Connect with Stripe</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Unable to load profile data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfileData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const { profile, totalJobs, avgRating, completedJobs, totalEarnings } = profileData

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <>
              <Ionicons 
                name={isEditing ? 'checkmark' : 'pencil'} 
                size={20} 
                color={isEditing ? '#10b981' : '#3b82f6'} 
              />
              <Text style={[styles.editButtonText, isEditing && styles.saveButtonText]}>
                {isEditing ? 'Save' : 'Edit'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile?.full_name || 'Employee'}</Text>
            <Text style={styles.email}>{profile?.email}</Text>
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderStars(avgRating)}
              </View>
              <Text style={styles.ratingText}>{avgRating.toFixed(1)}</Text>
              <Text style={styles.jobCount}>({completedJobs} jobs)</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedJobs}</Text>
            <Text style={styles.statLabel}>Jobs Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{avgRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {earningsService.formatCurrency(totalEarnings)}
            </Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Full Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editableProfile.full_name || ''}
                onChangeText={(text) => setEditableProfile(prev => ({ ...prev, full_name: text }))}
                placeholder="Enter your full name"
              />
            ) : (
              <Text style={styles.infoValue}>{profile?.full_name || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.email}</Text>
            <Text style={styles.infoNote}>Email cannot be changed here</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editableProfile.phone || ''}
                onChangeText={(text) => setEditableProfile(prev => ({ ...prev, phone: text }))}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.infoValue}>{profile?.phone || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Stripe Connect Section */}
        {renderStripeConnectSection()}

        {/* Payout Preferences (only when editing and Stripe is connected) */}
        {isEditing && profile?.stripe_onboarding_completed && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payout Preferences</Text>
            <Text style={styles.sectionSubtitle}>
              Choose your preferred payout speed
            </Text>

            <TouchableOpacity
              style={[
                styles.payoutPreferenceOption,
                editableProfile.payout_preference === 'standard' && styles.payoutPreferenceOptionActive
              ]}
              onPress={() => setEditableProfile(prev => ({ ...prev, payout_preference: 'standard' }))}
            >
              <View style={styles.payoutPreferenceOptionContent}>
                <Text style={styles.payoutPreferenceOptionTitle}>Standard</Text>
                <Text style={styles.payoutPreferenceOptionSubtitle}>2-7 business days • No fees</Text>
              </View>
              <Ionicons 
                name={editableProfile.payout_preference === 'standard' ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color={editableProfile.payout_preference === 'standard' ? '#3b82f6' : '#d1d5db'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.payoutPreferenceOption,
                editableProfile.payout_preference === 'instant' && styles.payoutPreferenceOptionActive
              ]}
              onPress={() => setEditableProfile(prev => ({ ...prev, payout_preference: 'instant' }))}
            >
              <View style={styles.payoutPreferenceOptionContent}>
                <Text style={styles.payoutPreferenceOptionTitle}>Instant</Text>
                <Text style={styles.payoutPreferenceOptionSubtitle}>Within 30 minutes • 1.5% fee</Text>
              </View>
              <Ionicons 
                name={editableProfile.payout_preference === 'instant' ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color={editableProfile.payout_preference === 'instant' ? '#3b82f6' : '#d1d5db'}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleCancel}
              disabled={updating}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
              disabled={updating}
            >
              <Text style={styles.saveButtonText}>
                {updating ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  saveButtonText: {
    color: '#10b981',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#ffffff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  jobCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoNote: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  input: {
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  stripeConnectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  stripeDisconnectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fefce8',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde047',
  },
  stripeIconContainer: {
    marginRight: 16,
  },
  stripeConnectedInfo: {
    flex: 1,
  },
  stripeDisconnectedInfo: {
    flex: 1,
  },
  stripeConnectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803d',
    marginBottom: 2,
  },
  stripeConnectedSubtitle: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 8,
  },
  stripeDisconnectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a16207',
    marginBottom: 2,
  },
  stripeDisconnectedSubtitle: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 12,
  },
  stripeConnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 8,
  },
  stripeConnectButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  payoutPreferenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payoutPreferenceLabel: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  payoutPreferenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  payoutPreferenceText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '600',
  },
  payoutPreferenceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  payoutPreferenceOptionActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  payoutPreferenceOptionContent: {
    flex: 1,
  },
  payoutPreferenceOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  payoutPreferenceOptionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    margin: 16,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
})
