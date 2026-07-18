'use client'

import { useState } from 'react'
import { Plus, BookOpen, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { issueBook } from '../actions'

export function IssueBookModal({ 
  schoolId, 
  availableStudents, 
  availableBooks 
}: { 
  schoolId: string
  availableStudents: any[]
  availableBooks: any[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [studentId, setStudentId] = useState('')
  const [bookId, setBookId] = useState('')
  const [dueDays, setDueDays] = useState('14')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const res = await issueBook({
      schoolId,
      bookId,
      studentId,
      dueDays: parseInt(dueDays, 10) || 14
    })

    setLoading(false)
    if (res.error) {
      alert(res.error)
    } else {
      setOpen(false)
      setStudentId('')
      setBookId('')
      setDueDays('14')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Issue Book</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <DialogTitle className="text-xl">Issue Book</DialogTitle>
          <DialogDescription>
            Select a student and a book to log a new checkout.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="" disabled>Select a student...</option>
              {availableStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} ({s.admission_number})
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label>Book</Label>
            <select
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="" disabled>Select available book...</option>
              {availableBooks.map(b => (
                <option key={b.id} value={b.id}>
                  {b.title} {b.isbn ? `(ISBN: ${b.isbn})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Loan Duration (Days)</Label>
            <select
              value={dueDays}
              onChange={(e) => setDueDays(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="90">Term (90 days)</option>
            </select>
          </div>
          
          <Button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 h-11 mt-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Issue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
