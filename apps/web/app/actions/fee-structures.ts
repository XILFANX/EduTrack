'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function requireBursarOrAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', supabase, user: null, profile: null }
  const { data: profile } = await supabase.from('users').select('school_id, role').eq('id', user.id).single()
  const p = profile as any
  const allowed = ['admin', 'principal', 'headteacher', 'bursar']
  if (!p?.school_id || !allowed.some(r => p.role?.includes(r))) return { error: 'Unauthorized', supabase, user: null, profile: null }
  return { error: null, supabase, user, profile: p }
}

// ─── Fee Templates ────────────────────────────────────────────────────────────

export async function createFeeTemplate(data: {
  name: string
  termId: string
  yearId: string
  classId: string | null
  items: { description: string; amount: number; sort_order: number }[]
}) {
  const { error: authError, supabase, profile } = await requireBursarOrAdmin()
  if (authError || !profile) return { error: authError }

  const { data: template, error } = await supabase
    .from('fee_templates' as any)
    .insert({
      school_id: profile.school_id,
      name: data.name,
      term_id: data.termId,
      year_id: data.yearId,
      class_id: data.classId || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Insert fee items
  if (data.items.length > 0) {
    const admin = createAdminClient()
    const { error: itemsError } = await admin.from('fee_items' as any).insert(
      data.items.map(item => ({ ...item, template_id: (template as any).id }))
    )
    if (itemsError) return { error: `Template created but items failed: ${itemsError.message}` }
  }

  revalidatePath('/bursar/fee-structures')
  return { success: true, template }
}

export async function deleteFeeTemplate(id: string) {
  const { error: authError, supabase, profile } = await requireBursarOrAdmin()
  if (authError || !profile) return { error: authError }

  const { error } = await supabase.from('fee_templates' as any).delete().eq('id', id).eq('school_id', profile.school_id)
  if (error) return { error: error.message }

  revalidatePath('/bursar/fee-structures')
  return { success: true }
}

export async function duplicateTemplateFromTerm(sourceTemplateId: string, newName: string, termId: string, yearId: string) {
  const { error: authError, supabase, profile } = await requireBursarOrAdmin()
  if (authError || !profile) return { error: authError }

  const admin = createAdminClient()
  // Fetch source template + items
  const { data: srcRaw } = await admin.from('fee_templates' as any)
    .select('*, fee_items(*)')
    .eq('id', sourceTemplateId)
    .single()
  const src = srcRaw as any
  if (!src) return { error: 'Source template not found' }

  const { data: newTemplate, error: tErr } = await supabase.from('fee_templates' as any)
    .insert({ school_id: profile.school_id, name: newName, term_id: termId, year_id: yearId, class_id: src.class_id })
    .select().single()
  if (tErr) return { error: tErr.message }

  if (src.fee_items?.length > 0) {
    await admin.from('fee_items' as any).insert(
      src.fee_items.map((item: any) => ({
        template_id: (newTemplate as any).id,
        description: item.description,
        amount: item.amount,
        sort_order: item.sort_order,
      }))
    )
  }

  revalidatePath('/bursar/fee-structures')
  return { success: true, template: newTemplate }
}

// ─── Invoice Generation ───────────────────────────────────────────────────────

export async function generateInvoicesFromTemplate(templateId: string) {
  const { error: authError, supabase, profile } = await requireBursarOrAdmin()
  if (authError || !profile) return { error: authError }

  const admin = createAdminClient()

  // Fetch template + items
  const { data: tmplRaw } = await admin.from('fee_templates' as any)
    .select('*, fee_items(*)')
    .eq('id', templateId)
    .single()
  const tmpl = tmplRaw as any
  if (!tmpl) return { error: 'Template not found' }

  const totalAmount = (tmpl.fee_items || []).reduce((s: number, i: any) => s + Number(i.amount), 0)

  // Get students (filter by class if template is class-specific)
  let studentsQuery = admin.from('students').select('id').eq('school_id', profile.school_id)
  if (tmpl.class_id) studentsQuery = studentsQuery.eq('class_id', tmpl.class_id)
  const { data: studentsRaw } = await studentsQuery
  const students = (studentsRaw || []) as any[]

  if (students.length === 0) return { error: 'No students found for this template.' }

  // Check which students already have an invoice for this template
  const { data: existingRaw } = await admin.from('invoices')
    .select('student_id')
    .eq('template_id', templateId)
    .eq('school_id', profile.school_id)
  const existing = new Set(((existingRaw || []) as any[]).map((i: any) => i.student_id))

  const newStudents = students.filter((s: any) => !existing.has(s.id))
  if (newStudents.length === 0) return { error: 'All students in this template already have invoices.' }

  // Bulk insert invoices
  const invoices = newStudents.map((s: any) => ({
    school_id: profile.school_id,
    student_id: s.id,
    template_id: templateId,
    term_id: tmpl.term_id,
    amount: totalAmount,
    paid: 0,
    discount_amount: 0,
    status: 'unpaid',
  }))

  const { error: invErr } = await admin.from('invoices').insert(invoices)
  if (invErr) return { error: invErr.message }

  revalidatePath('/bursar/fee-structures')
  revalidatePath('/bursar/invoices')
  return { success: true, count: newStudents.length }
}

export async function applyDiscount(invoiceId: string, discountAmount: number, reason: string) {
  const { error: authError, supabase, profile } = await requireBursarOrAdmin()
  if (authError || !profile) return { error: authError }

  const { error } = await supabase.from('invoices')
    .update({ discount_amount: discountAmount, discount_reason: reason })
    .eq('id', invoiceId)
    .eq('school_id', profile.school_id)

  if (error) return { error: error.message }
  revalidatePath('/bursar/fee-structures')
  return { success: true }
}
