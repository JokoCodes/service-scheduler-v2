import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Calendar } from 'react-native-calendars'

interface AvailabilitySlot {
  date: string
  timeSlots: {
    id: string
    startTime: string
    endTime: string
    available: boolean
  }[]
}

export default function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [availability, setAvailability] = useState<Record<string, AvailabilitySlot>>({
    [selectedDate]: {
      date: selectedDate,
      timeSlots: [
        { id: '1', startTime: '08:00', endTime: '12:00', available: false },
        { id: '2', startTime: '12:00', endTime: '16:00', available: false },
        { id: '3', startTime: '16:00', endTime: '20:00', available: false },
      ]
    }
  })

  const getCurrentMonth = () => {
    const date = new Date()
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const getMarkedDates = () => {
    const marked: Record<string, any> = {}
    
    Object.keys(availability).forEach(date => {
      const hasAvailability = availability[date].timeSlots.some(slot => slot.available)
      marked[date] = {
        marked: hasAvailability,
        dotColor: '#10b981',
        selectedColor: date === selectedDate ? '#3b82f6' : undefined,
        selected: date === selectedDate,
      }
    })

    if (!marked[selectedDate]) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#3b82f6',
      }
    }

    return marked
  }

  const toggleTimeSlot = (slotId: string) => {
    setAvailability(prev => ({
      ...prev,
      [selectedDate]: {
        ...prev[selectedDate],
        timeSlots: prev[selectedDate]?.timeSlots.map(slot =>
          slot.id === slotId ? { ...slot, available: !slot.available } : slot
        ) || []
      }
    }))
  }

  const addFullDayAvailability = () => {
    const newAvailability = {
      date: selectedDate,
      timeSlots: [
        { id: '1', startTime: '08:00', endTime: '12:00', available: true },
        { id: '2', startTime: '12:00', endTime: '16:00', available: true },
        { id: '3', startTime: '16:00', endTime: '20:00', available: true },
      ]
    }

    setAvailability(prev => ({
      ...prev,
      [selectedDate]: newAvailability
    }))
  }

  const clearDayAvailability = () => {
    setAvailability(prev => ({
      ...prev,
      [selectedDate]: {
        date: selectedDate,
        timeSlots: [
          { id: '1', startTime: '08:00', endTime: '12:00', available: false },
          { id: '2', startTime: '12:00', endTime: '16:00', available: false },
          { id: '3', startTime: '16:00', endTime: '20:00', available: false },
        ]
      }
    }))
  }

  const saveAvailability = () => {
    Alert.alert(
      'Success',
      'Your availability has been saved successfully!',
      [{ text: 'OK' }]
    )
  }

  const onDateSelect = (day: any) => {
    setSelectedDate(day.dateString)
    
    // Initialize availability for the selected date if it doesn't exist
    if (!availability[day.dateString]) {
      setAvailability(prev => ({
        ...prev,
        [day.dateString]: {
          date: day.dateString,
          timeSlots: [
            { id: '1', startTime: '08:00', endTime: '12:00', available: false },
            { id: '2', startTime: '12:00', endTime: '16:00', available: false },
            { id: '3', startTime: '16:00', endTime: '20:00', available: false },
          ]
        }
      }))
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const currentDaySlots = availability[selectedDate]?.timeSlots || []

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Schedule</Text>
        <Text style={styles.subtitle}>Set your availability for {getCurrentMonth()}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={onDateSelect}
            markedDates={getMarkedDates()}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#374151',
              selectedDayBackgroundColor: '#3b82f6',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#3b82f6',
              dayTextColor: '#374151',
              textDisabledColor: '#9ca3af',
              dotColor: '#10b981',
              selectedDotColor: '#ffffff',
              arrowColor: '#3b82f6',
              monthTextColor: '#1f2937',
              indicatorColor: '#3b82f6',
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
          />
        </View>

        <View style={styles.availabilitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Availability for {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionButton, styles.primaryButton]}
              onPress={addFullDayAvailability}
            >
              <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
              <Text style={styles.quickActionTextPrimary}>Full Day</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionButton, styles.secondaryButton]}
              onPress={clearDayAvailability}
            >
              <Ionicons name="close-circle" size={16} color="#6b7280" />
              <Text style={styles.quickActionTextSecondary}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeSlots}>
            {currentDaySlots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.timeSlot,
                  slot.available ? styles.timeSlotActive : styles.timeSlotInactive,
                ]}
                onPress={() => toggleTimeSlot(slot.id)}
              >
                <View style={styles.timeSlotContent}>
                  <View style={styles.timeInfo}>
                    <Text style={[
                      styles.timeText,
                      slot.available ? styles.timeTextActive : styles.timeTextInactive
                    ]}>
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </Text>
                    <Text style={[
                      styles.durationText,
                      slot.available ? styles.durationTextActive : styles.durationTextInactive
                    ]}>
                      4 hours
                    </Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    slot.available ? styles.checkboxActive : styles.checkboxInactive
                  ]}>
                    {slot.available && (
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Available days</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveAvailability}>
          <Text style={styles.saveButtonText}>Save Availability</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  content: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  availabilitySection: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  quickActionTextPrimary: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  quickActionTextSecondary: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
  },
  timeSlots: {
    gap: 12,
  },
  timeSlot: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
  },
  timeSlotActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  timeSlotInactive: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  timeSlotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeTextActive: {
    color: '#1f2937',
  },
  timeTextInactive: {
    color: '#6b7280',
  },
  durationText: {
    fontSize: 14,
  },
  durationTextActive: {
    color: '#6b7280',
  },
  durationTextInactive: {
    color: '#9ca3af',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  checkboxActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkboxInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
  },
  legend: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})
