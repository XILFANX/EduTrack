'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Add a new bus route
export async function addBusRoute(data: {
  schoolId: string
  routeName: string
  driverName: string
  vehicleRegistration: string
  capacity: number
}) {
  const admin = await createAdminClient()

  const { error } = await admin.from('transport_routes').insert({
    school_id: data.schoolId,
    name: data.routeName,
    driver_name: data.driverName || null,
    vehicle_plate: data.vehicleRegistration || null,
    capacity: data.capacity || 0
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
export async function logTransport(data: {
  schoolId: string
  studentId: string
  routeId: string
  status: 'boarded' | 'dropped' | 'absent'
}) {
  const admin = await createAdminClient()

  const { error } = await admin.from('transport_logs').insert({
    school_id: data.schoolId,
    student_id: data.studentId,
    route_id: data.routeId,
    status: data.status,
  })

  if (error) return { error: error.message }

  revalidatePath('/transport/dashboard')
  return { success: true }
}
