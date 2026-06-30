'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'

// Use Daraja Sandbox endpoint for STK Push
const DARAJA_ENDPOINT = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'

// In a real app we'd fetch the auth token via Daraja OAuth API
const STUB_OAUTH_TOKEN = 'YOUR_ACCESS_TOKEN'

export async function generateInvoicesForClass(classId: string, termId: string, schoolId: string) {
  const admin = createAdminClient()

  // 1. Fetch fee structures for this class and term
  const { data: structures, error: structError } = await admin
    .from('fee_structures')
    .select('*')
    .eq('term_id', termId)
    .eq('class_id', classId)

  if (structError || !structures?.length) return { error: 'No fee structures found for this class and term.' }

  const totalExpectedAmount = structures.reduce((sum, item) => sum + item.amount, 0)

  // 2. Fetch all students in the class
  const { data: students, error: studentError } = await admin
    .from('students')
    .select('id')
    .eq('class_id', classId)

  if (studentError || !students?.length) return { error: 'No students found in this class.' }

  // 3. For each student, generate an invoice and invoice items
  let generatedCount = 0

  for (const student of students) {
    // Check if already invoiced
    const { data: existing } = await admin
      .from('invoices')
      .select('id')
      .eq('student_id', student.id)
      .eq('term_id', termId)
      .single()

    if (existing) continue // Skip

    const { data: invoice, error: invError } = await admin
      .from('invoices')
      .insert({
        school_id: schoolId,
        student_id: student.id,
        term_id: termId,
        amount: totalExpectedAmount,
        balance: totalExpectedAmount,
        status: 'unpaid',
      })
      .select('id')
      .single()

    if (!invError && invoice) {
      const invoiceData = invoice as any
      // Insert items
      const itemsToInsert = structures.map(s => ({
        invoice_id: invoiceData.id,
        description: s.description || 'General Fee',
        amount: s.amount,
      }))
      await admin.from('invoice_items').insert(itemsToInsert)
      generatedCount++
    }
  }

  return { success: true, count: generatedCount }
}

export async function initiateSTKPush(invoiceId: string, phone: string, amount: number) {
  // Normalize phone to 254 format
  const normalizedPhone = phone.replace(/^0/, '254').replace(/\+/g, '').replace(/\s+/g, '')

  // Note: Daraja requires a timestamp and password for sandbox requests
  // For the sake of the demo, we are mocking the fetch call.
  // In a real app, this would use the `fetch` API against Daraja.

  console.log(`[STK Push] Initiating push to ${normalizedPhone} for KES ${amount}...`)

  // Log a "pending" payment intent
  const admin = createAdminClient()
  const receiptPlaceholder = `STK-${randomUUID().substring(0, 8).toUpperCase()}`

  // Return success to the client
  return { 
    success: true, 
    message: 'STK Push sent to phone successfully.',
    checkoutRequestId: 'ws_CO_' + Date.now()
  }
}
