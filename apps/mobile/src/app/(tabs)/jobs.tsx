import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { jobsService, JobsData, JobWithPayment } from '../../lib/services/jobsService'
import { supabase } from '../../lib/supabase'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')
const isTablet = screenWidth >= 768
const isSmallDevice = screenWidth < 375

interface Job {
  id: string
  customerName: string
  serviceName: string
  scheduledTime: string
  serviceAddress: string
  servicePrice: number
  status: 'available' | 'assigned' | 'completed'
  scheduledDate: string
  description?: string
}

type TabType = 'available' | 'assigned' | 'completed'

export default function JobsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('available')
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [jobsData, setJobsData] = useState<JobsData | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        Alert.alert('Error', 'Please log in to view jobs')
        return
      }
      setCurrentUser(user)

      // Load jobs data
      const jobs = await jobsService.getJobsForEmployee(user.id)
      setJobsData(jobs)
    } catch (error) {
      console.error('Error loading jobs:', error)
      Alert.alert('Error', 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadJobs()
    setRefreshing(false)
  }

  // Helper function to get display title and subtitle
  const getJobDisplayInfo = (job: JobWithPayment) => {
    if (job.customer?.full_name) {
      return {
        title: job.customer.full_name,
        subtitle: job.service_name
      }
    }
    if (job.customer?.email) {
      return {
        title: job.customer.email,
        subtitle: job.service_name
      }
    }
    // Fallback to service name as title when no customer data
    return {
      title: job.service_name || 'Service Job',
      subtitle: `Job #${job.id.substring(0, 8)}`
    }
  }

  const getCurrentJobs = (): JobWithPayment[] => {
    if (!jobsData) return []
    
    switch (activeTab) {
      case 'available':
        return jobsData.available
      case 'assigned':
        return jobsData.assigned
      case 'completed':
        return jobsData.completed
      default:
        return []
    }
  }

  const handleJobAction = async (job: JobWithPayment) => {
    if (!currentUser) return

    try {
      if (job.assigned_employee_id === null) {
        // This is an available job - assign it to the current user
        Alert.alert(
          'Pick Up Job',
          `Do you want to pick up this job: ${job.service_name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Pick Up',
              onPress: async () => {
                try {
                  await jobsService.assignJobToEmployee(job.id, currentUser.id)
                  await loadJobs() // Refresh the jobs list
                  Alert.alert('Success', 'Job assigned successfully!')
                } catch (error) {
                  console.error('Error assigning job:', error)
                  Alert.alert('Error', 'Failed to assign job')
                }
              }
            }
          ]
        )
      } else {
        // Navigate to job details
        router.push(`/job-details/${job.id}?status=${job.status}&tab=${activeTab}`)
      }
    } catch (error) {
      console.error('Error handling job action:', error)
    }
  }

  const getJobTabCount = (tab: TabType): number => {
    if (!jobsData) return 0
    
    switch (tab) {
      case 'available':
        return jobsData.available.length
      case 'assigned':
        return jobsData.assigned.length
      case 'completed':
        return jobsData.completed.length
      default:
        return 0
    }
  }

  const renderJobItem = ({ item }: { item: JobWithPayment }) => {
    const displayInfo = getJobDisplayInfo(item)
    
    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => router.push(`/job-details/${item.id}?status=${item.status}&tab=${activeTab}`)}
      >
        <View style={styles.jobHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.customerName}>{displayInfo.title}</Text>
            <Text style={styles.serviceName}>{displayInfo.subtitle}</Text>
          </View>
        <View style={[styles.statusBadge, { backgroundColor: jobsService.getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{jobsService.getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{jobsService.formatTime(item.scheduled_time)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.service_address}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            {item.final_amount ? jobsService.formatCurrency(item.final_amount) : 'TBD'}
          </Text>
        </View>
        {item.payment_status && (
          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={16} color={jobsService.getPaymentStatusColor(item.payment_status)} />
            <Text style={[styles.detailText, { color: jobsService.getPaymentStatusColor(item.payment_status) }]}>
              {jobsService.getPaymentStatusText(item.payment_status)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.jobActions}>
        {item.assigned_employee_id === null ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => handleJobAction(item)}
          >
            <Ionicons name="add-outline" size={16} color="#ffffff" />
            <Text style={[styles.actionText, styles.primaryButtonText]}>Pick Up Job</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/job-details/${item.id}?status=${item.status}&tab=${activeTab}`)}
          >
            <Ionicons name="eye-outline" size={16} color="#3b82f6" />
            <Text style={styles.actionText}>View Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Jobs</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Jobs 
          {jobsData && `(${getJobTabCount(activeTab)})`}
        </Text>
        <View style={styles.tabContainer}>
          {(['available', 'assigned', 'completed'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {jobsData && ` (${getJobTabCount(tab)})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={getCurrentJobs()}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No jobs available</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'available' 
                ? 'There are no available jobs at the moment. Pull to refresh.' 
                : `You don't have any ${activeTab} jobs.`}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: isTablet ? 32 : isSmallDevice ? 16 : 20,
    paddingVertical: isTablet ? 24 : 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: isTablet ? 32 : isSmallDevice ? 22 : 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  listContainer: {
    paddingHorizontal: isTablet ? 32 : isSmallDevice ? 12 : 16,
    paddingVertical: 16,
  },
  jobCard: {
    backgroundColor: '#ffffff',
    borderRadius: isTablet ? 16 : 12,
    padding: isTablet ? 24 : isSmallDevice ? 12 : 16,
    marginBottom: isTablet ? 16 : 12,
    marginHorizontal: isTablet ? 0 : 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: isTablet ? 22 : isSmallDevice ? 16 : 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: isTablet ? 16 : isSmallDevice ? 13 : 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  jobDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  jobActions: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 14,
    color: '#3b82f6',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: isTablet ? 12 : 8,
    paddingHorizontal: isTablet ? 20 : isSmallDevice ? 12 : 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: isTablet ? 16 : isSmallDevice ? 13 : 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
})
