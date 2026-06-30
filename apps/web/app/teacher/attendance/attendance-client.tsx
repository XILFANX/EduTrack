'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardList, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { saveAttendance } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type AttendanceStatus = 'Present' | 'Absent' | 'Late'

interface Student {
  id: string
  first_name: string
  last_name: string
  admission_number: string
}

interface Props {
  schoolId: string
  teacherId: string
  cls: { id: string; name: string } | null
  students: Student[]
  existingRecords: Record<string, AttendanceStatus>
  date: string
}

export function AttendanceClient({ schoolId, teacherId, cls, students, existingRecords, date }: Props) {
  const router = useRouter()
  // Local state for attendance records
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>(existingRecords)
  const [loading, setLoading] = useState(false)

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }))
  }

  const handleSave = async () => {
    if (!cls) return
    setLoading(true)

    const payload = Object.entries(records).map(([studentId, status]) => ({
      studentId,
      status,
    }))

    const res = await saveAttendance({
      schoolId,
      teacherId,
      classId: cls.id,
      date,
      records: payload,
    })

    setLoading(false)

    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Attendance saved successfully')
      router.refresh()
    }
  }

  const allMarked = students.every((s) => records[s.id])

  if (!cls) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 mx-auto flex items-center justify-center mb-4">
          <ClipboardList className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">No Class Assigned</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
          You must be assigned as a Class Teacher to take morning attendance.
        </p>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-muted-foreground">No students enrolled in this class yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {cls.name} · {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading || Object.keys(records).length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Register
        </Button>
      </div>

      {!allMarked && (
        <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 p-3 rounded-lg text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          <p>Please mark attendance for all students before saving.</p>
        </div>
      )}

      <div className="space-y-3 pb-20">
        {students.map((student) => {
          const status = records[student.id]

          return (
            <Card key={student.id} className="border-slate-200 dark:border-slate-800 flex items-center justify-between p-4 bg-white dark:bg-slate-900 transition-colors">
              <div>
                <h3 className="font-semibold text-foreground">{student.first_name} {student.last_name}</h3>
                <p className="text-xs text-muted-foreground font-mono">{student.admission_number}</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Present Button */}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleStatusChange(student.id, 'Present')}
                  className={`w-10 h-10 rounded-full transition-colors ${
                    status === 'Present' 
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-500 dark:text-emerald-400' 
                      : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </Button>
                
                {/* Absent Button */}
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleStatusChange(student.id, 'Absent')}
                  className={`w-10 h-10 rounded-full transition-colors ${
                    status === 'Absent' 
                      ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/40 dark:border-red-500 dark:text-red-400' 
                      : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-200'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                </Button>

                {/* Late Button */}
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleStatusChange(student.id, 'Late')}
                  className={`w-10 h-10 rounded-full transition-colors ${
                    status === 'Late' 
                      ? 'bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900/40 dark:border-orange-500 dark:text-orange-400' 
                      : 'text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 hover:border-orange-200'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
