'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Add a new book to the library
export async function addBook(data: {
  schoolId: string
  title: string
  author: string
  isbn: string | null
  copies: number
}) {
  const admin = await createAdminClient()

  // Insert one row per copy
  const rows = Array.from({ length: data.copies }, () => ({
    school_id: data.schoolId,
    title: data.title,
    author: data.author,
    isbn: data.isbn || null,
    status: 'available',
  }))

  const { error } = await admin.from('library_books').insert(rows)
  if (error) return { error: error.message }

  revalidatePath('/library/books')
  revalidatePath('/library/dashboard')
  return { success: true }
}

// Issue a book to a student
export async function issueBook(data: {
  schoolId: string
  bookId: string
  studentId: string
  issuedBy: string
  dueDays: number
}) {
  const admin = await createAdminClient()

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + data.dueDays)

  // Mark book as issued
  const { error: bookErr } = await admin
    .from('library_books')
    .update({ status: 'issued' })
    .eq('id', data.bookId)

  if (bookErr) return { error: bookErr.message }

  // Create issue record
  const { error: issueErr } = await admin
    .from('library_issues')
    .insert({
      school_id: data.schoolId,
      book_id: data.bookId,
      student_id: data.studentId,
      issued_by: data.issuedBy,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'issued',
    })

  if (issueErr) return { error: issueErr.message }

  revalidatePath('/library/issues')
  revalidatePath('/library/dashboard')
  return { success: true }
}

// Return a book
export async function returnBook(data: {
  issueId: string
  bookId: string
  isLost: boolean
  schoolId: string
  studentId: string
  fineToBursar: boolean
}) {
  const admin = await createAdminClient()

  const newBookStatus = data.isLost ? 'lost' : 'available'

  // Update book status
  await admin.from('library_books').update({ status: newBookStatus }).eq('id', data.bookId)

  // Close the issue record
  await admin.from('library_issues').update({
    returned_at: new Date().toISOString(),
    status: data.isLost ? 'lost' : 'returned',
  }).eq('id', data.issueId)

  // If lost and flagged for fine — add to student's next invoice as a note
  // This is a simple implementation: we log it to a library_fines table
  if (data.isLost && data.fineToBursar) {
    await admin.from('library_fines').insert({
      school_id: data.schoolId,
      student_id: data.studentId,
      issue_id: data.issueId,
      amount: 0, // Bursar sets the actual amount
      status: 'pending',
    })
  }

  revalidatePath('/library/issues')
  revalidatePath('/library/dashboard')
  return { success: true }
}
