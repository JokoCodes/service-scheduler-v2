import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { earningsService, EarningsData, EmployeePayout } from '../../lib/services/earningsService'
import { supabase } from '../../lib/supabase'

const { width, height } = Dimensions.get('window')
const isTablet = width >= 768
const isSmallDevice = width < 375

export default function EarningsScreen() {
  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'payouts'>('overview')

  useEffect(() => {
    loadUserAndEarnings()
  }, [])

  const loadUserAndEarnings = async () => {
    try {
      console.log('🔄 [Earnings] Starting to load user and earnings...')
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('👤 [Earnings] Auth user result:', { user: user?.id, error: userError })
      
      if (userError || !user) {
        console.error('❌ [Earnings] Auth error or no user:', userError)
        Alert.alert('Error', 'Please log in to view earnings')
        return
      }
      setCurrentUser(user)
      console.log('✅ [Earnings] User set:', user.id)

      // Load earnings data
      console.log('🔄 [Earnings] Loading earnings for user:', user.id)
      await loadEarnings(user.id)
    } catch (error) {
      console.error('❌ [Earnings] Error loading user and earnings:', error)
      Alert.alert('Error', 'Failed to load earnings data')
    } finally {
      setLoading(false)
      console.log('🏁 [Earnings] Loading complete')
    }
  }

  const loadEarnings = async (userId: string) => {
    try {
      console.log('📊 [Earnings] Calling earningsService.getEmployeeEarnings with userId:', userId)
      const earningsData = await earningsService.getEmployeeEarnings(userId)
      console.log('📊 [Earnings] Received earnings data:', earningsData)
      setEarnings(earningsData)
      console.log('✅ [Earnings] Earnings state updated successfully')
    } catch (error) {
      console.error('❌ [Earnings] Error loading earnings:', error)
      Alert.alert('Error', 'Failed to load earnings data')
    }
  }

  const onRefresh = async () => {
    if (!currentUser) return
    
    setRefreshing(true)
    await loadEarnings(currentUser.id)
    setRefreshing(false)
  }

  const handleConnectStripe = async () => {
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

  const renderPayoutItem = ({ item }: { item: EmployeePayout }) => (
    <View style={styles.payoutCard}>
      <View style={styles.payoutHeader}>
        <View style={styles.payoutInfo}>
          <Text style={styles.payoutAmount}>
            {earningsService.formatCurrency(item.net_amount)}
          </Text>
          <Text style={styles.payoutDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: earningsService.getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>
            {earningsService.getStatusText(item.status)}
          </Text>
        </View>
      </View>
      <Text style={styles.payoutDescription}>
        Job payout • {item.payout_type === 'instant' ? 'Instant' : 'Standard'} transfer
      </Text>
      {item.fee_amount > 0 && (
        <Text style={styles.feeText}>
          Fee: {earningsService.formatCurrency(item.fee_amount)}
        </Text>
      )}
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading earnings...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!earnings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Unable to load earnings data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserAndEarnings}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Earnings</Text>
          <Text style={styles.subtitle}>Track your payouts and earnings</Text>
        </View>

        {/* Stripe Connect Status */}
        {!earnings.stripeConnected && (
          <View style={styles.connectCard}>
            <View style={styles.connectIcon}>
              <Ionicons name="card" size={24} color="#f59e0b" />
            </View>
            <View style={styles.connectInfo}>
              <Text style={styles.connectTitle}>Connect your bank account</Text>
              <Text style={styles.connectDescription}>
                Connect to Stripe to receive instant payouts
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.connectButton} 
              onPress={handleConnectStripe}
            >
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Earnings Overview Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {earningsService.formatCurrency(earnings.totalEarnings)}
            </Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {earningsService.formatCurrency(earnings.pendingPayouts)}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {earningsService.formatCurrency(earnings.thisWeekEarnings)}
            </Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {earningsService.formatCurrency(earnings.thisMonthEarnings)}
            </Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'payouts' && styles.activeTab]}
            onPress={() => setActiveTab('payouts')}
          >
            <Text style={[styles.tabText, activeTab === 'payouts' && styles.activeTabText]}>
              Payouts
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <View style={styles.overviewContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Earnings Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Jobs Completed:</Text>
                <Text style={styles.summaryValue}>{earnings.completedJobs}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Earned:</Text>
                <Text style={styles.summaryValue}>
                  {earningsService.formatCurrency(earnings.totalEarnings)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Paid Out:</Text>
                <Text style={styles.summaryValue}>
                  {earningsService.formatCurrency(earnings.paidPayouts)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pending:</Text>
                <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>
                  {earningsService.formatCurrency(earnings.pendingPayouts)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.payoutsContainer}>
            {earnings.payouts.length > 0 ? (
              <FlatList
                data={earnings.payouts}
                renderItem={renderPayoutItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="wallet" size={48} color="#9ca3af" />
                <Text style={styles.emptyTitle}>No payouts yet</Text>
                <Text style={styles.emptyDescription}>
                  Complete jobs to start earning payouts
                </Text>
              </View>
            )}
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
  scrollView: {
    flex: 1,
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
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  connectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef9c3',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde047',
  },
  connectIcon: {
    marginRight: 12,
  },
  connectInfo: {
    flex: 1,
  },
  connectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 2,
  },
  connectDescription: {
    fontSize: 14,
    color: '#a16207',
  },
  connectButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    margin: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  overviewContainer: {
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  payoutsContainer: {
    paddingHorizontal: 16,
  },
  payoutCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  payoutDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  payoutDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  feeText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
})
