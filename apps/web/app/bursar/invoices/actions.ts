'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ─── Generate invoices from fee structures for a class + term ────────────────
export async function generateInvoices(data: {
  schoolId: string
  termId: string
  classId: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()

  // Get applicable fee structures (class-specific OR whole-school for this term)
  const { data: feeStructures } = await admin
    .from('fee_structures')
    .select('id, description, amount, class_id')
    .eq('school_id', data.schoolId)
    .eq('term_id', data.termId)
    .or(`class_id.eq.${data.classId},class_id.is.null`)

  if (!feeStructures || feeStructures.length === 0) {
    return { error: 'No fee structures found for this class/term combination. Please set up fee structures first.' }
  }

  const totalAmount = feeStructures.reduce((sum: number, fs: any) => sum + fs.amount, 0)

  // Get students in this class
  const { data: students } = await admin
    .from('students')
    .select('id, first_name, last_name, admission_number')
    .eq('school_id', data.schoolId)
    .eq('class_id', data.classId)
    .is('deleted_at', null)

  if (!students || students.length === 0) {
    return { error: 'No students found in this class.' }
  }

  let created = 0
  let skipped = 0

  for (const student of students) {
    // Check if invoice already exists for this student + term
    const { data: existing } = await admin
      .from('invoices')
      .select('id')
      .eq('school_id', data.schoolId)
      .eq('student_id', student.id)
      .eq('term_id', data.termId)
      .is('deleted_at', null)
      .single()

    if (existing) {
      skipped++
      continue
    }

    // Create the invoice
    const { data: invoice, error: invErr } = await admin
      .from('invoices')
      .insert({
        school_id: data.schoolId,
        student_id: student.id,
        term_id: data.termId,
        amount: totalAmount,
        balance: totalAmount,
        status: 'unpaid',
      })
      .select('id')
      .single()

    if (invErr || !invoice) {
      console.error('Failed to create invoice for student', student.id, invErr)
      continue
    }

    const invoiceRecord = invoice as any

    // Create invoice line items
    const lineItems = (feeStructures as any[]).map((fs) => ({
      invoice_id: invoiceRecord.id,
      description: fs.description,
      amount: fs.amount,
    }))

    await admin.from('invoice_items').insert(lineItems)
    created++
  }

  revalidatePath('/bursar/invoices')
  return { created, skipped }
}

// ─── Record a manual payment against an invoice ──────────────────────────────
export async function recordPayment(data: {
  schoolId: string
  invoiceId: string
  studentId: string
  amount: number
  method: string
  mpesaReceipt?: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()

  // Get current invoice balance
  const { data: invoiceRaw } = await admin
    .from('invoices')
    .select('balance, amount')
    .eq('id', data.invoiceId)
    .single()

  const invoice = invoiceRaw as { balance: number; amount: number } | null

  if (!invoice) return { error: 'Invoice not found.' }
  if (data.amount > invoice.balance) {
    return { error: `Payment exceeds outstanding balance of KES ${invoice.balance.toLocaleString()}` }
  }

  // Insert payment record
  const { error: payErr } = await admin.from('fee_payments').insert({
    school_id: data.schoolId,
    invoice_id: data.invoiceId,
    student_id: data.studentId,
    amount: data.amount,
    payment_method: data.method,
    mpesa_receipt: data.mpesaReceipt || null,
  })

  if (payErr) return { error: payErr.message }

  // Update invoice balance
  const newBalance = invoice.balance - data.amount
  const newStatus = newBalance <= 0 ? 'paid' : invoice.balance === invoice.amount ? 'unpaid' : 'partial'

  await admin
    .from('invoices')
    .update({ balance: newBalance, status: newStatus })
    .eq('id', data.invoiceId)

  revalidatePath('/bursar/invoices')
  return { success: true }
}

// ─── Get invoices with student and payment info ───────────────────────────────
export async function getInvoicesWithDetails(schoolId: string, termId: string | null) {
  const supabase = await createClient()

  let query = supabase
    .from('invoices')
    .select(`
      id, amount, balance, status, due_date, created_at,
      students(id, first_name, last_name, admission_number, classes(name)),
      academic_terms(name),
      invoice_items(description, amount),
      fee_payments(id, amount, payment_method, mpesa_receipt, payment_date)
    `)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (termId) {
    query = query.eq('term_id', termId)
  }

  const { data, error } = await query
  return { data: (data as any[]) || [], error }
}
