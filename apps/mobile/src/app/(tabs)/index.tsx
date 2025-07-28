import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { jobsService, JobWithPayment } from '../../lib/services/jobsService';
import { earningsService } from '../../lib/services/earningsService';

interface HomeStats {
  todayEarnings: number
  activeJobs: number
  thisWeekEarnings: number
  rating: number
}

export default function HomeScreen() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [homeStats, setHomeStats] = useState<HomeStats>({
    todayEarnings: 0,
    activeJobs: 0,
    thisWeekEarnings: 0,
    rating: 0
  })
  const [todayJobs, setTodayJobs] = useState<JobWithPayment[]>([])

  useEffect(() => {
    loadHomeData()
  }, [])

  const loadHomeData = async () => {
    try {
      console.log('🏠 [Home] Starting to load home data...')
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('👤 [Home] Auth user result:', { user: user?.id, error: userError })
      
      if (userError || !user) {
        console.error('❌ [Home] Auth error or no user:', userError)
        // For demo purposes, don't show error alert on home screen
        setLoading(false)
        return
      }
      setCurrentUser(user)
      console.log('✅ [Home] User set:', user.id)

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
      }

      // Load jobs data
      console.log('📊 [Home] Loading jobs data...')
      const jobsData = await jobsService.getJobsForEmployee(user.id)
      
      // Filter today's jobs (assigned + today's available jobs)
      const today = new Date().toISOString().split('T')[0]
      const todaysAssigned = jobsData.assigned.filter(job => 
        job.scheduled_date === today
      )
      const todaysAvailable = jobsData.available.filter(job => 
        job.scheduled_date === today
      )
      const todaysJobs = [...todaysAssigned, ...todaysAvailable].slice(0, 3) // Limit to 3 for home screen
      setTodayJobs(todaysJobs)
      
      // Load earnings data
      console.log('💰 [Home] Loading earnings data...')
      const earningsData = await earningsService.getEmployeeEarnings(user.id)
      
      // Calculate today's earnings (mock for now - would need more complex date filtering)
      const todayEarnings = earningsData.thisWeekEarnings / 7 // Rough estimate
      
      setHomeStats({
        todayEarnings: todayEarnings,
        activeJobs: jobsData.assigned.length,
        thisWeekEarnings: earningsData.thisWeekEarnings,
        rating: 4.8 // Mock rating - would come from reviews
      })
      
      console.log('✅ [Home] All data loaded successfully')
    } catch (error) {
      console.error('❌ [Home] Error loading home data:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadHomeData()
    setRefreshing(false)
  }

  const stats = [
    {
      title: "Today's Earnings",
      value: earningsService.formatCurrency(homeStats.todayEarnings),
      icon: <Feather name="dollar-sign" size={20} color="#16a34a" />,
      bgColor: "#dcfce7",
    },
    {
      title: "Active Jobs",
      value: homeStats.activeJobs.toString(),
      icon: <Ionicons name="calendar" size={20} color="#2563eb" />,
      bgColor: "#dbeafe",
    },
    {
      title: "This Week",
      value: earningsService.formatCurrency(homeStats.thisWeekEarnings),
      icon: <Feather name="clock" size={20} color="#7c3aed" />,
      bgColor: "#ede9fe",
    },
    {
      title: "Rating",
      value: homeStats.rating.toFixed(1),
      icon: <FontAwesome name="star" size={20} color="#eab308" />,
      bgColor: "#fef9c3",
    },
  ]

  // Messages - empty array means no messages to display
  const messages: Array<{client: string, message: string, time: string, unread: boolean}> = [
    // Uncomment below to show sample message
    // {
    //   client: "Sarah J.",
    //   message: "Running 10 minutes late, see you soon!",
    //   time: "2 mins ago",
    //   unread: true,
    // }
  ]

  const getStatusStyles = (status: string) => {
    return status === "confirmed"
      ? { badge: styles.badgeConfirmed, text: styles.badgeTextConfirmed }
      : { badge: styles.badgePending, text: styles.badgeTextPending };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.name}>{profile?.full_name || currentUser?.email?.split('@')[0] || 'Employee'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="#6b7280" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Messages Section - Only show if there are messages */}
        {messages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Messages</Text>
              <TouchableOpacity onPress={() => router.push('/messages')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {messages.map((message, index) => (
              <TouchableOpacity key={index} style={styles.messageCard} onPress={() => router.push('/messages')}>
                <View style={styles.messageIcon}>
                  <MaterialCommunityIcons name="message-text-outline" size={20} color="#2563eb" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageClient}>{message.client}</Text>
                    <View style={styles.messageTimeRow}>
                      <Text style={styles.messageTime}>{message.time}</Text>
                      {message.unread && <View style={styles.unreadDot} />}
                    </View>
                  </View>
                  <Text style={styles.messageText}>{message.message}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <View key={idx} style={[styles.statCard, { backgroundColor: stat.bgColor }]}>
              <View style={styles.statIcon}>{stat.icon}</View>
              <View>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Today's Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Jobs</Text>
            <TouchableOpacity onPress={() => router.push('/jobs')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {todayJobs.length > 0 ? todayJobs.map((job) => {
            const statusStyles = getStatusStyles(job.status);
            const isAssigned = job.assigned_employee_id !== null;
            return (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() => {
                  // Navigate to job details based on assignment status
                  if (isAssigned) {
                    router.push(`/job-details/${job.id}?status=assigned`);
                  } else {
                    router.push(`/job-details/${job.id}?status=available`);
                  }
                }}
              >
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitle}>{job.service_name}</Text>
                  <View style={[styles.badge, statusStyles.badge]}>
                    <Text style={statusStyles.text}>{jobsService.getStatusText(job.status)}</Text>
                  </View>
                </View>
                <Text style={styles.jobClient}>Customer: {job.customer?.full_name || job.customer?.email || 'N/A'}</Text>
                <View style={styles.jobDetailsRow}>
                  <Feather name="clock" size={14} color="#6b7280" />
                  <Text style={styles.jobDetail}>{jobsService.formatTime(job.scheduled_time)}</Text>
                  <Text style={styles.jobDetail}>• {jobsService.formatDate(job.scheduled_date)}</Text>
                  <Feather name="map-pin" size={14} color="#6b7280" />
                  <Text style={styles.jobDetail} numberOfLines={1}>{job.service_address}</Text>
                  <Text style={styles.jobPayment}>
                    {job.final_amount ? jobsService.formatCurrency(job.final_amount) : 'TBD'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={() => router.push(`/directions/${job.id}`)}
                >
                  <Feather name="navigation" size={16} color="#fff" />
                  <Text style={styles.directionsText}>Directions</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }) : (
            <View style={styles.emptyJobsContainer}>
              <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyJobsTitle}>No jobs today</Text>
              <Text style={styles.emptyJobsText}>Check the Jobs tab for available work</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8fafc" 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  section: { 
    marginBottom: 24 
  },
  sectionHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 12 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#1f2937" 
  },
  viewAllText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  messageCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 8, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  messageIcon: { 
    backgroundColor: "#dbeafe", 
    borderRadius: 20, 
    width: 40, 
    height: 40, 
    alignItems: "center", 
    justifyContent: "center", 
    marginRight: 12 
  },
  messageHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  messageClient: { 
    fontWeight: "bold", 
    color: "#1f2937" 
  },
  messageTimeRow: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  messageTime: { 
    fontSize: 12, 
    color: "#6b7280" 
  },
  unreadDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: "#2563eb", 
    marginLeft: 4 
  },
  messageText: { 
    fontSize: 13, 
    color: "#6b7280", 
    marginTop: 4,
  },
  statsGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-between", 
    marginBottom: 24 
  },
  statCard: { 
    width: "48%", 
    borderRadius: 12, 
    padding: 16, 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statIcon: { 
    marginRight: 12 
  },
  statTitle: { 
    fontSize: 12, 
    color: "#6b7280" 
  },
  statValue: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#1f2937" 
  },
  jobCard: { 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  jobHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 4 
  },
  jobTitle: { 
    fontWeight: "bold", 
    color: "#1f2937", 
    fontSize: 15 
  },
  badge: { 
    borderRadius: 8, 
    paddingHorizontal: 8, 
    paddingVertical: 2 
  },
  badgeConfirmed: { 
    backgroundColor: "#bbf7d0" 
  },
  badgeTextConfirmed: { 
    color: "#166534", 
    fontWeight: "bold", 
    fontSize: 12 
  },
  badgePending: { 
    backgroundColor: "#fef9c3" 
  },
  badgeTextPending: { 
    color: "#a16207", 
    fontWeight: "bold", 
    fontSize: 12 
  },
  jobClient: { 
    fontSize: 13, 
    color: "#6b7280", 
    marginBottom: 4 
  },
  jobDetailsRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 12 
  },
  jobDetail: { 
    fontSize: 12, 
    color: "#6b7280", 
    marginHorizontal: 4 
  },
  jobPayment: { 
    fontWeight: "bold", 
    color: "#16a34a", 
    marginLeft: "auto" 
  },
  directionsButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#2563eb", 
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  directionsText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 12,
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
  emptyJobsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyJobsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyJobsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
