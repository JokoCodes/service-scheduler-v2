import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, router } from 'expo-router'
import { jobsService, JobWithPayment } from '../../lib/services/jobsService'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')
const isTablet = screenWidth >= 768
const isSmallDevice = screenWidth < 375

interface JobDetails {
  id: string
  customerName: string
  serviceName: string
  customerImage?: string
  address: string
  date: string
  startTime: string
  endTime: string
  bedrooms?: number
  bathrooms?: number
  description: string
  status: 'available' | 'assigned' | 'in-progress' | 'completed'
  teamMembers: {
    id: string
    name: string
    avatar?: string
    isOnline: boolean
  }[]
  price: number
}

type TabType = 'details' | 'chat'

export default function JobDetailsScreen() {
  console.log('🚀 [JobDetails] Component mounting/re-rendering')
  
  const { id, status, tab } = useLocalSearchParams()
  console.log('📝 [JobDetails] Route params:', { id, status, tab })
  
  const [activeTab, setActiveTab] = useState<TabType>('details')
  const [jobStatus, setJobStatus] = useState<JobDetails['status']>(status as JobDetails['status'] || 'available')
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0) // in seconds
  const [loading, setLoading] = useState(true)
  const [jobData, setJobData] = useState<JobWithPayment | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  console.log('🎯 [JobDetails] Current state:', { loading, jobData: !!jobData, jobStatus })
  
  // Load job data from database - MOVED TO TOP
  useEffect(() => {
    console.log('🔄 [JobDetails] useEffect triggered - START')
    console.log('🔄 [JobDetails] useEffect - id value:', id)
    console.log('🔄 [JobDetails] useEffect - id type:', typeof id)
    console.log('🔄 [JobDetails] useEffect - id truthy check:', !!id)
    
    const fetchJobData = async () => {
      if (!id) {
        console.warn('⚠️ [JobDetails] No ID provided in useEffect')
        return
      }
      
      try {
        console.log('🔄 [JobDetails] Starting job fetch for ID:', id)
        setLoading(true)
        
        const job = await jobsService.getJobById(id as string)
        console.log('🔄 [JobDetails] Job fetch result:', job ? 'success' : 'null')
        
        if (job) {
          console.log('✅ [JobDetails] Setting job data and status')
          setJobData(job)
          setJobStatus(job.status as JobDetails['status'])
        } else {
          console.warn('⚠️ [JobDetails] Job not found')
          Alert.alert('Error', 'Job not found')
          router.back()
        }
      } catch (error) {
        console.error('❌ [JobDetails] Error in useEffect:', error)
        Alert.alert('Error', 'Failed to load job details')
        router.back()
      } finally {
        console.log('🔄 [JobDetails] Setting loading to false')
        setLoading(false)
      }
    }
    
    fetchJobData()
    console.log('🔄 [JobDetails] useEffect triggered - END')
  }, [id])

  // Cleanup timer on unmount
  useEffect(() => {
    console.log('🧹 [JobDetails] Setting up cleanup effect')
    return () => {
      console.log('🧹 [JobDetails] Cleanup: stopping timer')
      stopTimer()
    }
  }, [])

  const loadJobData = async () => {
    try {
      console.log('🔍 [JobDetails] Starting loadJobData for ID:', id)
      console.log('🔍 [JobDetails] Setting loading to true')
      setLoading(true)
      
      console.log('🔍 [JobDetails] About to call jobsService.getJobById')
      const job = await jobsService.getJobById(id as string)
      console.log('🔍 [JobDetails] getJobById returned:', job ? 'job data' : 'null')
      
      if (job) {
        console.log('✅ [JobDetails] Job data received:', {
          id: job.id,
          service_name: job.service_name,
          customer_name: job.customer_name,
          service_address: job.service_address,
          scheduled_date: job.scheduled_date,
          scheduled_time: job.scheduled_time,
          status: job.status,
          final_amount: job.final_amount
        })
        
        console.log('🔍 [JobDetails] Setting job data')
        setJobData(job)
        console.log('🔍 [JobDetails] Setting job status to:', job.status)
        setJobStatus(job.status as JobDetails['status'])
        console.log('✅ [JobDetails] Job data and status set successfully')
      } else {
        console.warn('⚠️ [JobDetails] Job not found - showing alert')
        Alert.alert('Error', 'Job not found')
        router.back()
      }
    } catch (error) {
      console.error('❌ [JobDetails] Error loading job:', error)
      console.error('❌ [JobDetails] Error details:', error.message || 'Unknown error')
      Alert.alert('Error', 'Failed to load job details')
      router.back()
    } finally {
      console.log('🔍 [JobDetails] Setting loading to false')
      setLoading(false)
      console.log('✅ [JobDetails] loadJobData completed')
    }
  }

  // Helper function to get customer display name
  const getCustomerName = (job: JobWithPayment): string => {
    if (job.customer?.full_name) return job.customer.full_name
    if (job.customer?.email) return job.customer.email
    if (job.customer_name) return job.customer_name
    return 'Unknown Customer'
  }

  // Helper function to format date
  const formatJobDate = (dateString: string): string => {
    return jobsService.formatDate(dateString)
  }

  // Helper function to format time range
  const formatTimeRange = (startTime: string, endTime?: string): string => {
    const formattedStart = jobsService.formatTime(startTime)
    if (endTime) {
      const formattedEnd = jobsService.formatTime(endTime)
      return `${formattedStart} - ${formattedEnd}`
    }
    return formattedStart
  }

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Show error if no job data
  if (!jobData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Job Not Found</Text>
          <Text style={styles.errorText}>The requested job could not be found.</Text>
          <TouchableOpacity style={styles.backToJobsButton} onPress={() => router.back()}>
            <Text style={styles.backToJobsText}>Back to Jobs</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Transform job data to match UI expectations
  const jobDetails: JobDetails = {
    id: jobData.id,
    customerName: getCustomerName(jobData),
    serviceName: jobData.service_name || 'Service',
    customerImage: undefined, // Could be added later
    address: jobData.service_address || 'Address not available',
    date: formatJobDate(jobData.scheduled_date),
    startTime: jobsService.formatTime(jobData.scheduled_time),
    endTime: '', // End time not available in current schema
    bedrooms: undefined, // Not available in current schema
    bathrooms: undefined, // Not available in current schema
    description: jobData.notes || 'No description available',
    status: jobStatus,
    teamMembers: [
      {
        id: '1',
        name: 'You',
        isOnline: true,
      }
    ],
    price: jobData.final_amount || 0
  }

  const handleAcceptJob = () => {
    Alert.alert(
      'Accept Job',
      'Do you want to accept this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Accept', 
          onPress: () => {
            // Update job status to assigned
            setJobStatus('assigned')
            Alert.alert('Success', 'Job accepted successfully!')
          }
        }
      ]
    )
  }

  const handleStartTask = () => {
    Alert.alert(
      'Start Task',
      'Are you ready to start this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: () => {
            // Change job status to 'in-progress'
            setJobStatus('in-progress')
            setActiveTab('chat')
            // Start timer
            const startTime = new Date()
            setTimerStartTime(startTime)
            setElapsedTime(0)
            startTimer()
            Alert.alert('Success', 'Task started successfully! Timer started.')
          }
        }
      ]
    )
  }

  const handleEndJob = () => {
    Alert.alert(
      'End Job',
      `Are you sure you want to end this job?\n\nTotal time worked: ${formatElapsedTime(elapsedTime)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Job', 
          style: 'destructive',
          onPress: () => {
            // Stop timer
            stopTimer()
            // Change job status to 'completed'
            setJobStatus('completed')
            Alert.alert('Job Completed', `Total time worked: ${formatElapsedTime(elapsedTime)}`)
          }
        }
      ]
    )
  }

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const handleCall = () => {
    Alert.alert('Call', `Calling ${jobDetails.customerName}...`)
  }

  const handleMessage = () => {
    Alert.alert('Message', `Opening message thread with ${jobDetails.customerName}...`)
  }

  const handleDirections = () => {
    Alert.alert('Directions', `Opening directions to ${jobDetails.address}...`)
  }

  const renderTaskDetails = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Customer Info */}
      <View style={styles.customerSection}>
        <View style={styles.customerHeader}>
          <View style={styles.customerInfo}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {jobDetails.customerName.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.customerDetails}>
              <Text style={styles.serviceName}>{jobDetails.serviceName} for {jobDetails.customerName}</Text>
            </View>
          </View>
          <View style={styles.customerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call" size={24} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
              <Ionicons name="mail" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>Map View</Text>
          <View style={styles.mapPin}>
            <Ionicons name="location" size={24} color="#ffffff" />
          </View>
        </View>
        <TouchableOpacity style={styles.directionsButton} onPress={handleDirections}>
          <Ionicons name="navigate" size={16} color="#3b82f6" />
          <Text style={styles.directionsText}>Directions</Text>
        </TouchableOpacity>
      </View>

      {/* Job Details */}
      <View style={styles.detailsSection}>
        <View style={styles.detailItem}>
          <Text style={styles.detailAddress}>{jobDetails.address}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{jobDetails.date}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{jobDetails.startTime}</Text>
          </View>
        </View>

        {jobDetails.price > 0 && (
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Price:</Text>
              <Text style={styles.detailValue}>{jobsService.formatCurrency(jobDetails.price)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Team Section */}
      <View style={styles.teamSection}>
        <Text style={styles.teamTitle}>TEAM: {jobDetails.teamMembers.length}</Text>
        <View style={styles.teamMembers}>
          {jobDetails.teamMembers.map((member, index) => (
            <View key={member.id} style={styles.teamMember}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </Text>
                {member.isOnline && <View style={styles.onlineIndicator} />}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Task Description */}
      {jobDetails.description && (
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>DESCRIPTION</Text>
          <Text style={styles.descriptionText}>{jobDetails.description}</Text>
        </View>
      )}
    </ScrollView>
  )

  const renderChat = () => (
    <View style={styles.chatContainer}>
      <View style={styles.chatPlaceholder}>
        <Ionicons name="chatbubbles-outline" size={64} color="#9ca3af" />
        <Text style={styles.chatPlaceholderTitle}>No messages yet</Text>
        <Text style={styles.chatPlaceholderText}>
          Start a conversation with your team or the customer
        </Text>
      </View>
    </View>
  )

  const shouldShowChatTab = jobStatus === 'assigned' || jobStatus === 'in-progress'

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{jobDetails.date}</Text>
          {jobStatus === 'in-progress' && (
            <View style={styles.timerContainer}>
              <Ionicons name="time" size={16} color="#ef4444" />
              <Text style={styles.timerText}>{formatElapsedTime(elapsedTime)}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.activeTab]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
            Task Details
          </Text>
        </TouchableOpacity>
        {shouldShowChatTab && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
            onPress={() => setActiveTab('chat')}
          >
            <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>
              Chat
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'details' ? renderTaskDetails() : renderChat()}
      </View>

      {/* Action Buttons */}
      {jobStatus === 'available' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptJob}>
            <Text style={styles.acceptButtonText}>Accept Job</Text>
          </TouchableOpacity>
        </View>
      )}
      {jobStatus === 'assigned' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.startButton} onPress={handleStartTask}>
            <Text style={styles.startButtonText}>Start Task</Text>
          </TouchableOpacity>
        </View>
      )}
      {jobStatus === 'in-progress' && (
        <View style={styles.footer}>
          <View style={styles.inProgressContainer}>
            <View style={styles.timerDisplay}>
              <Ionicons name="time" size={20} color="#ef4444" />
              <Text style={styles.timerDisplayText}>Time: {formatElapsedTime(elapsedTime)}</Text>
            </View>
            <TouchableOpacity style={styles.endButton} onPress={handleEndJob}>
              <Text style={styles.endButtonText}>End Job</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? 32 : isSmallDevice ? 16 : 20,
    paddingVertical: isTablet ? 20 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: isTablet ? 22 : isSmallDevice ? 16 : 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
  },
  headerRight: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingBottom: 100,
  },
  customerSection: {
    paddingHorizontal: isTablet ? 32 : isSmallDevice ? 16 : 20,
    paddingVertical: isTablet ? 24 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    width: isTablet ? 80 : isSmallDevice ? 50 : 60,
    height: isTablet ? 80 : isSmallDevice ? 50 : 60,
    borderRadius: isTablet ? 40 : isSmallDevice ? 25 : 30,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: isTablet ? 20 : 16,
  },
  customerAvatarText: {
    fontSize: isTablet ? 26 : isSmallDevice ? 16 : 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  customerDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: isTablet ? 22 : isSmallDevice ? 16 : 18,
    fontWeight: '600',
    color: '#1f2937',
    flexWrap: 'wrap',
  },
  customerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: isTablet ? 56 : isSmallDevice ? 44 : 48,
    height: isTablet ? 56 : isSmallDevice ? 44 : 48,
    borderRadius: isTablet ? 28 : isSmallDevice ? 22 : 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    marginHorizontal: isTablet ? 32 : isSmallDevice ? 16 : 20,
    marginVertical: isTablet ? 24 : 20,
    borderRadius: isTablet ? 16 : 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mapPlaceholder: {
    height: isTablet ? 300 : isSmallDevice ? 180 : 200,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mapText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  mapPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    gap: 4,
  },
  directionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  detailsSection: {
    paddingHorizontal: isTablet ? 32 : isSmallDevice ? 16 : 20,
    paddingVertical: isTablet ? 24 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: isTablet ? 16 : isSmallDevice ? 13 : 14,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.5,
    marginBottom: isTablet ? 20 : 16,
  },
  detailAddress: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 8,
  },
  detailItem: {
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    display: 'inline',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 4,
  },
  teamSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  teamTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  teamMembers: {
    flexDirection: 'row',
    gap: 12,
  },
  teamMember: {
    alignItems: 'center',
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  descriptionSection: {
    padding: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  chatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  chatPlaceholder: {
    alignItems: 'center',
  },
  chatPlaceholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  chatPlaceholderText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  startButton: {
    backgroundColor: '#fbbf24',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  acceptButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  inProgressContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  timerDisplayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  endButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  endButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  backToJobsButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backToJobsText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
})
