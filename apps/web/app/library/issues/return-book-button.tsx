'use client'

import { useState } from 'react'
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { returnBook } from '../actions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ReturnBookButton({ 
  issueId, 
  bookId, 
  schoolId,
  studentId
}: { 
  issueId: string
  bookId: string
  schoolId: string
  studentId: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleReturn(isLost: boolean, fineToBursar: boolean) {
    if (isLost && !confirm('Are you sure you want to mark this book as LOST?')) return
    
    setLoading(true)
    const res = await returnBook({
      issueId,
      bookId,
      schoolId,
      studentId,
      isLost,
      fineToBursar
    })
    setLoading(false)

    if (res.error) alert(res.error)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Process Return'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl">
        <DropdownMenuItem 
          onClick={() => handleReturn(false, false)}
          className="gap-2 cursor-pointer py-2 text-emerald-600 focus:text-emerald-700"
        >
          <CheckCircle className="w-4 h-4" />
          Mark as Returned
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleReturn(true, false)}
          className="gap-2 cursor-pointer py-2 text-red-600 focus:text-red-700"
        >
          <AlertTriangle className="w-4 h-4" />
          Mark as Lost
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
