'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Add a new bus route
export async function addBusRoute(data: {
  schoolId: string
  routeName: string
  driverName: string
  vehicleRegistration: string
}) {
  const admin = await createAdminClient()

  const { error } = await admin.from('bus_routes').insert({
    school_id: data.schoolId,
    route_name: data.routeName,
    driver_name: data.driverName || null,
    vehicle_registration: data.vehicleRegistration || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/transport/dashboard')
  return { success: true }
}

// Assign a student to a bus route
export async function assignStudentToRoute(data: {
  schoolId: string
  studentId: string
  routeId: string
}) {
  const admin = await createAdminClient()

  const { error } = await admin.from('student_routes').upsert({
    school_id: data.schoolId,
    student_id: data.studentId,
    route_id: data.routeId,
  }, { onConflict: 'student_id' })

  if (error) return { error: error.message }

  revalidatePath('/transport/dashboard')
  return { success: true }
}

// Mark student boarding/alighting for the current trip
export async function markBoarding(data: {
  schoolId: string
  studentId: string
  routeId: string
  tripType: 'morning' | 'afternoon'
  status: 'boarded' | 'alighted' | 'absent'
  recordedBy: string
}) {
  const admin = await createAdminClient()

  const today = new Date().toISOString().split('T')[0]

  const { error } = await admin.from('transport_logs').upsert({
    school_id: data.schoolId,
    student_id: data.studentId,
    route_id: data.routeId,
    trip_type: data.tripType,
    status: data.status,
    date: today,
    recorded_by: data.recordedBy,
  }, { onConflict: 'student_id, date, trip_type' })

  if (error) return { error: error.message }

  revalidatePath('/transport/dashboard')
  return { success: true }
}
