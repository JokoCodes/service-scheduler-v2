import React, { useState, useEffect, useRef } from 'react'
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
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { earningsService, EarningsData, EmployeePayout } from '../../lib/services/earningsService'
import { supabase } from '../../lib/supabase'
import { router } from 'expo-router'

const { width, height } = Dimensions.get('window')
const isTablet = width >= 768
const isSmallDevice = width < 375

// Helper function to get month names
const getMonthName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'long' })
}

// Helper function to get month/year string
const getMonthYear = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// Generate array of months - 24 past months + current + 12 future months (chronological order)
const generateMonths = (): Date[] => {
  const months: Date[] = []
  const currentDate = new Date()
  
  // Start from 24 months ago and go chronologically to 12 months in the future
  for (let i = -24; i <= 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
    months.push(date)
  }
  
  return months
}

interface JobInvoice {
  id: string
  customerName: string
  serviceName: string
  jobDate: string
  amount: number
  status: 'completed' | 'pending'
}

interface WeeklyPayout {
  id: string
  weekStartDate: string
  weekEndDate: string
  totalAmount: number
  status: 'sent' | 'pending' | 'processing'
  sentToBankDate?: string
  jobsIncluded: string[]
}

export default function EarningsScreen() {
  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'invoices' | 'payouts'>('invoices')
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [monthlyData, setMonthlyData] = useState<{[key: string]: any}>({})
  const [currentSummaryIndex, setCurrentSummaryIndex] = useState(0)
  const [stripeOnboardingCompleted, setStripeOnboardingCompleted] = useState<boolean>(true)
  
  const monthScrollRef = useRef<ScrollView>(null)
  const summaryScrollRef = useRef<ScrollView>(null)
  const availableMonths = generateMonths()

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentDate = new Date()
      const currentMonthIndex = availableMonths.findIndex(
        month => month.getMonth() === currentDate.getMonth() && 
                month.getFullYear() === currentDate.getFullYear()
      )
      
      if (currentMonthIndex !== -1 && monthScrollRef.current) {
        // Calculate scroll position - assuming each month button is about 80px wide + 8px margin
        const buttonWidth = 88 // approximate width including margin
        const scrollPosition = Math.max(0, (currentMonthIndex * buttonWidth) - (width / 2) + (buttonWidth / 2))
        monthScrollRef.current.scrollTo({ x: scrollPosition, animated: false })
      }
    }, 100) // Slightly longer delay to ensure layout is complete
    return () => clearTimeout(timer)
  }, [monthScrollRef, availableMonths])

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
      
      // Check stripe onboarding status
      await checkStripeOnboardingStatus(userId)
    } catch (error) {
      console.error('❌ [Earnings] Error loading earnings:', error)
      Alert.alert('Error', 'Failed to load earnings data')
    }
  }

  const checkStripeOnboardingStatus = async (userId: string) => {
    try {
      console.log('🔄 [Earnings] Checking stripe onboarding status for user:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_onboarding_completed')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('❌ [Earnings] Error fetching profile:', error)
        return
      }
      
      console.log('✅ [Earnings] Profile data:', data)
      setStripeOnboardingCompleted(data?.stripe_onboarding_completed || false)
    } catch (error) {
      console.error('❌ [Earnings] Error checking stripe onboarding status:', error)
    }
  }

  const onRefresh = async () => {
    if (!currentUser) return
    
    setRefreshing(true)
    await loadEarnings(currentUser.id)
    setRefreshing(false)
  }

  const handleMonthSelect = (month: Date) => {
    setSelectedMonth(month)
    // Load data for selected month
    if (currentUser) {
      loadMonthlyData(currentUser.id, month)
    }
  }

  const loadMonthlyData = async (userId: string, month: Date) => {
    // Implementation for loading month-specific data
    // This would call your API with month filters
  }

  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const renderSummarySection = () => {
    // Use real earnings data
    const summaryData = [
      {
        title: 'This Week',
        amount: earnings ? earningsService.formatCurrency(earnings.thisWeekEarnings) : '$0.00'
      },
      {
        title: getMonthYear(new Date()),
        amount: earnings ? earningsService.formatCurrency(earnings.thisMonthEarnings) : '$0.00'
      },
      {
        title: 'All Time',
        amount: earnings ? earningsService.formatCurrency(earnings.totalEarnings) : '$0.00'
      }
    ]

    const handleSummaryScroll = (event: any) => {
      const contentOffset = event.nativeEvent.contentOffset.x
      const currentIndex = Math.round(contentOffset / width)
      setCurrentSummaryIndex(currentIndex)
    }

    return (
      <View style={styles.summaryContainer}>
        <ScrollView
          ref={summaryScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleSummaryScroll}
          scrollEventThrottle={16}
          style={styles.summaryScrollView}
        >
          {summaryData.map((item, index) => (
            <LinearGradient
              key={index}
              colors={['#4F46E5', '#7C3AED']}
              style={styles.summaryCard}
            >
              <Text style={styles.summaryTitle}>{item.title}</Text>
              <Text style={styles.summaryAmount}>{item.amount}</Text>
              <View style={styles.paginationDots}>
                {summaryData.map((_, dotIndex) => (
                  <TouchableOpacity
                    key={dotIndex}
                    onPress={() => {
                      setCurrentSummaryIndex(dotIndex)
                      summaryScrollRef.current?.scrollTo({ x: dotIndex * width, animated: true })
                    }}
                    style={[
                      styles.dot, 
                      dotIndex === currentSummaryIndex ? styles.activeDot : styles.inactiveDot
                    ]} 
                  />
                ))}
              </View>
            </LinearGradient>
          ))}
        </ScrollView>
      </View>
    )
  }

  const renderInvoiceItem = ({ item }: { item: any }) => {
    const isExpanded = expandedItems.has(item.id)
    
    return (
      <TouchableOpacity 
        style={styles.listItem}
        onPress={() => toggleItemExpansion(item.id)}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <Text style={styles.itemDate}>{item.date}</Text>
          </View>
          <View style={styles.itemRight}>
            <Text style={styles.itemAmount}>${item.amount.toFixed(2)}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        </View>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.expandedText}>$ {item.amount.toFixed(2)} total comp</Text>
            <Text style={styles.expandedText}>Sent to bank {item.date}</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderPayoutItem = ({ item }: { item: EmployeePayout }) => {
    const isExpanded = expandedItems.has(item.id)
    const statusColor = earningsService.getStatusColor(item.status)
    const statusText = earningsService.getStatusText(item.status)
    const payoutDate = new Date(item.created_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    
    return (
      <TouchableOpacity 
        style={styles.listItem}
        onPress={() => toggleItemExpansion(item.id)}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.customerName}>
              {item.payout_type === 'instant' ? 'Instant Payout' : 'Standard Payout'}
            </Text>
            <Text style={styles.serviceName}>Stripe Transfer</Text>
            <Text style={styles.itemDate}>{payoutDate}</Text>
          </View>
          <View style={styles.itemRight}>
            <Text style={styles.itemAmount}>{earningsService.formatCurrency(item.net_amount)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusText.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.expandedText}>
              {earningsService.formatCurrency(item.amount)} gross amount
            </Text>
            {item.fee_amount > 0 && (
              <Text style={styles.expandedText}>
                -{earningsService.formatCurrency(item.fee_amount)} processing fee
              </Text>
            )}
            <Text style={styles.expandedText}>
              {earningsService.formatCurrency(item.net_amount)} net amount
            </Text>
            <Text style={styles.expandedText}>
              Transfer ID: {item.stripe_transfer_id || 'Pending'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

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

  // Helper function to render empty state
  const renderEmptyState = (message: string) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
      <Text style={styles.emptyTitle}>No data found</Text>
      <Text style={styles.emptyDescription}>{message}</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Blue Summary Section */}
        {renderSummarySection()}

        {/* Month Selection */}
        <View style={styles.monthContainer}>
          <ScrollView 
            ref={monthScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthScrollContent}
          >
            {availableMonths.map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthButton,
                  selectedMonth.getMonth() === month.getMonth() && 
                  selectedMonth.getFullYear() === month.getFullYear() && 
                  styles.selectedMonthButton
                ]}
                onPress={() => handleMonthSelect(month)}
              >
                <Text style={[
                  styles.monthButtonText,
                  selectedMonth.getMonth() === month.getMonth() && 
                  selectedMonth.getFullYear() === month.getFullYear() && 
                  styles.selectedMonthButtonText
                ]}>
                  {getMonthName(month)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'invoices' && styles.activeTab]}
            onPress={() => setActiveTab('invoices')}
          >
            <Text style={[styles.tabText, activeTab === 'invoices' && styles.activeTabText]}>
              Invoices
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
          <TouchableOpacity 
            style={styles.moreInfoButton}
            onPress={() => setShowInfoModal(!showInfoModal)}
          >
            <Text style={styles.moreInfoText}>More info</Text>
            <Ionicons name="information-circle-outline" size={16} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.contentContainer}>
          {activeTab === 'invoices' ? (
            earnings?.payouts && earnings.payouts.length > 0 ? (
              <FlatList
                data={earnings.payouts}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.listItem}
                    onPress={() => toggleItemExpansion(item.id)}
                  >
                    <View style={styles.itemHeader}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.customerName}>Job Invoice</Text>
                        <Text style={styles.serviceName}>Service Earnings</Text>
                        <Text style={styles.itemDate}>
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                      <View style={styles.itemRight}>
                        <Text style={styles.itemAmount}>
                          {earningsService.formatCurrency(item.net_amount)}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: earningsService.getStatusColor(item.status) }]}>
                          <Text style={styles.statusText}>
                            {earningsService.getStatusText(item.status).toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {expandedItems.has(item.id) && (
                      <View style={styles.expandedContent}>
                        <Text style={styles.expandedText}>
                          {earningsService.formatCurrency(item.amount)} gross amount
                        </Text>
                        {item.fee_amount > 0 && (
                          <Text style={styles.expandedText}>
                            -{earningsService.formatCurrency(item.fee_amount)} processing fee
                          </Text>
                        )}
                        <Text style={styles.expandedText}>
                          {earningsService.formatCurrency(item.net_amount)} net earnings
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              renderEmptyState('No job invoices found. Complete some jobs to see your earnings here.')
            )
          ) : (
            earnings?.payouts && earnings.payouts.length > 0 ? (
              <FlatList
                data={earnings.payouts}
                renderItem={renderPayoutItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              renderEmptyState('No payouts found. Your payments will appear here once processed.')
            )
          )}
        </View>

        {/* Bank Setup Alert */}
        {stripeOnboardingCompleted === false && (
          <View style={styles.connectCard}>
            <Ionicons name="alert-circle" size={24} color="#f59e0b" style={styles.connectIcon} />
            <View style={styles.connectInfo}>
              <Text style={styles.connectTitle}>Complete Your Banking Setup</Text>
              <Text style={styles.connectDescription}>Go to the Profile tab to add a bank account via Stripe Connect.</Text>
            </View>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={() => router.push("/profile")}
            >
              <Text style={styles.connectButtonText}>Setup Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Modal */}
        <Modal
          visible={showInfoModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowInfoModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>What's the difference?</Text>
              <Text style={styles.modalText}>
                <Text style={styles.modalBold}>Invoices:</Text> Shows each job you completed and how much you earned for that specific job.
              </Text>
              <Text style={styles.modalText}>
                <Text style={styles.modalBold}>Payouts:</Text> Shows the actual money sent to your bank account each week via Stripe.
              </Text>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowInfoModal(false)}
              >
                <Text style={styles.modalButtonText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  // Blue Summary Section Styles
  summaryContainer: {
    marginBottom: 20,
  },
  summaryScrollView: {
    height: 140,
  },
  summaryCard: {
    width: width - 32,
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: 'white',
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  // Month Selection Styles
  monthContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  monthScrollContent: {
    paddingHorizontal: 16,
  },
  monthButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedMonthButton: {
    backgroundColor: '#3b82f6',
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  selectedMonthButtonText: {
    color: 'white',
  },
  // Tab and More Info Styles
  moreInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  moreInfoText: {
    fontSize: 14,
    color: '#3b82f6',
    marginRight: 4,
  },
  // List Item Styles
  listItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  expandedText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  modalBold: {
    fontWeight: '600',
    color: '#1f2937',
  },
  modalButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
})
