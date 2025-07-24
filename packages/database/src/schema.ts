import { pgTable, text, timestamp, integer, boolean, decimal, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table (managed by Supabase Auth, but we can reference it)
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('employee'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Profiles table for additional user information
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => users.id),
  name: text('name').notNull(),
  phone: text('phone'),
  avatar: text('avatar'),
  position: text('position'),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Services table
export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  duration: integer('duration').notNull(), // in minutes
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Customers table
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Bookings table
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  assignedEmployeeId: uuid('assigned_employee_id').references(() => profiles.id),
  scheduledDate: timestamp('scheduled_date').notNull(),
  scheduledTime: text('scheduled_time').notNull(), // HH:MM format
  status: text('status').notNull().default('pending'),
  serviceAddress: text('service_address').notNull(),
  notes: text('notes'),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  staffRequired: integer('staff_required').notNull().default(1), // Number of staff members required
  staffFulfilled: integer('staff_fulfilled').notNull().default(0), // Number of staff members assigned
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Job status updates (mobile tracking)
export const jobStatusUpdates = pgTable('job_status_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id),
  employeeId: uuid('employee_id').notNull().references(() => profiles.id),
  status: text('status').notNull(),
  notes: text('notes'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  photos: text('photos').array(), // JSON array of photo URLs
  customerSignature: text('customer_signature'), // Base64 signature
  timestamp: timestamp('timestamp').notNull().defaultNow()
})

// Employee availability
export const employeeAvailability = pgTable('employee_availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => profiles.id),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sunday-Saturday)
  startTime: text('start_time').notNull(), // HH:MM format
  endTime: text('end_time').notNull(), // HH:MM format
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Employee locations (real-time tracking)
export const employeeLocations = pgTable('employee_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => profiles.id),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  timestamp: timestamp('timestamp').notNull().defaultNow()
})

// Notifications
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: text('data'), // JSON data
  priority: text('priority').notNull().default('medium'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

// Employee skills (many-to-many relationship)
export const employeeSkills = pgTable('employee_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => profiles.id),
  skill: text('skill').notNull(),
  level: text('level'), // beginner, intermediate, advanced
  createdAt: timestamp('created_at').notNull().defaultNow()
})

// Define relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.id] }),
  notifications: many(notifications)
}))

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, { fields: [profiles.id], references: [users.id] }),
  assignedBookings: many(bookings),
  jobStatusUpdates: many(jobStatusUpdates),
  availability: many(employeeAvailability),
  locations: many(employeeLocations),
  skills: many(employeeSkills)
}))

export const servicesRelations = relations(services, ({ many }) => ({
  bookings: many(bookings)
}))

export const customersRelations = relations(customers, ({ many }) => ({
  bookings: many(bookings)
}))

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customer: one(customers, { fields: [bookings.customerId], references: [customers.id] }),
  service: one(services, { fields: [bookings.serviceId], references: [services.id] }),
  assignedEmployee: one(profiles, { fields: [bookings.assignedEmployeeId], references: [profiles.id] }),
  statusUpdates: many(jobStatusUpdates)
}))

export const jobStatusUpdatesRelations = relations(jobStatusUpdates, ({ one }) => ({
  booking: one(bookings, { fields: [jobStatusUpdates.bookingId], references: [bookings.id] }),
  employee: one(profiles, { fields: [jobStatusUpdates.employeeId], references: [profiles.id] })
}))

export const employeeAvailabilityRelations = relations(employeeAvailability, ({ one }) => ({
  employee: one(profiles, { fields: [employeeAvailability.employeeId], references: [profiles.id] })
}))

export const employeeLocationsRelations = relations(employeeLocations, ({ one }) => ({
  employee: one(profiles, { fields: [employeeLocations.employeeId], references: [profiles.id] })
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] })
}))

export const employeeSkillsRelations = relations(employeeSkills, ({ one }) => ({
  employee: one(profiles, { fields: [employeeSkills.employeeId], references: [profiles.id] })
}))
