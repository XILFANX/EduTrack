'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ClipboardList, CheckCircle2, XCircle, Clock, Loader2, CheckCheck, CalendarDays } from 'lucide-react'
import { saveAttendance } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type AttendanceStatus = 'Present' | 'Absent' | 'Late'

interface Student {
  id: string
  first_name: string
  last_name: string
  admission_number: string
  photo_url?: string | null
}

interface Props {
  schoolId: string
  teacherId: string
  cls: { id: string; name: string } | null
  students: Student[]
  existingRecords: Record<string, AttendanceStatus>
  date: string
  historyByDate: Record<string, Record<string, AttendanceStatus>>
  totalStudents: number
}

export function AttendanceClient({ schoolId, teacherId, cls, students, existingRecords, date, historyByDate, totalStudents }: Props) {
  const router = useRouter()
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>(existingRecords)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'register' | 'history'>('register')

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }))
  }

  const markAllPresent = () => {
    const all: Record<string, AttendanceStatus> = {}
    students.forEach((s) => { all[s.id] = 'Present' })
    setRecords(all)
    toast.success('All students marked as Present')
  }

  const handleSave = async () => {
    if (!cls) return
    setLoading(true)

    const payload = Object.entries(records).map(([studentId, status]) => ({ studentId, status }))

    const res = await saveAttendance({ schoolId, teacherId, classId: cls.id, date, records: payload })

    setLoading(false)

    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Attendance saved successfully')
      router.refresh()
    }
  }

  const allMarked = students.every((s) => records[s.id])
  const presentCount = Object.values(records).filter(s => s === 'Present').length
  const absentCount = Object.values(records).filter(s => s === 'Absent').length

  if (!cls) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
          <ClipboardList className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">No Class Assigned</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
          You must be assigned as a Class Teacher to take morning attendance.
        </p>
      </div>
    )
  }

  // Build history calendar data: last 30 days
  const historyDays: { date: string; label: string; pct: number | null }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayRecords = historyByDate[dateStr]
    let pct: number | null = null
    if (dayRecords) {
      const vals = Object.values(dayRecords)
      const presentN = vals.filter(v => v === 'Present').length
      pct = vals.length > 0 ? Math.round((presentN / vals.length) * 100) : 0
    }
    historyDays.push({
      date: dateStr,
      label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1),
      pct,
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {cls.name} · {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading || Object.keys(records).length === 0}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Save
        </Button>
      </div>

      {/* Stats bar */}
      {Object.keys(records).length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{presentCount}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium">Present</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-red-700 dark:text-red-400">{absentCount}</p>
            <p className="text-xs text-red-600 dark:text-red-500 font-medium">Absent</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-foreground">{students.length - Object.keys(records).length}</p>
            <p className="text-xs text-muted-foreground font-medium">Pending</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('register')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'register' ? 'bg-white dark:bg-slate-900 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <ClipboardList className="w-4 h-4" /> Register
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'history' ? 'bg-white dark:bg-slate-900 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <CalendarDays className="w-4 h-4" /> History
        </button>
      </div>

      {activeTab === 'register' && (
        <>
          {!allMarked && (
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 p-3 rounded-xl text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{students.length - Object.keys(records).length} students not yet marked</span>
              </div>
              <Button variant="outline" size="sm" onClick={markAllPresent} className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100 h-7 text-xs">
                <CheckCheck className="w-3.5 h-3.5" /> All Present
              </Button>
            </div>
          )}

          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No students enrolled in this class yet.</p>
          ) : (
            <div className="space-y-2 pb-20">
              {students.map((student) => {
                const status = records[student.id]
                const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`
                return (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      {student.photo_url ? (
                        <img src={student.photo_url} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">{student.first_name} {student.last_name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">{student.admission_number}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStatusChange(student.id, 'Present')}
                        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors ${status === 'Present' ? 'bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-500 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-emerald-400 hover:text-emerald-600'}`}
                        title="Present"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'Absent')}
                        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors ${status === 'Absent' ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/40 dark:border-red-500 dark:text-red-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-red-400 hover:text-red-600'}`}
                        title="Absent"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'Late')}
                        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors ${status === 'Late' ? 'bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900/40 dark:border-orange-500 dark:text-orange-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-orange-400 hover:text-orange-600'}`}
                        title="Late"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 pb-20">
          <h2 className="text-sm font-bold text-foreground mb-4">Last 30 Days</h2>
          <div className="grid grid-cols-10 gap-1">
            {historyDays.map((day) => {
              let bg = 'bg-slate-100 dark:bg-slate-800'
              let title = `${day.date}: No data`
              if (day.pct !== null) {
                bg = day.pct >= 90 ? 'bg-emerald-400' : day.pct >= 70 ? 'bg-amber-400' : 'bg-red-400'
                title = `${day.date}: ${day.pct}% present`
              }
              return (
                <div key={day.date} className="flex flex-col items-center gap-1" title={title}>
                  <div className={`w-full aspect-square rounded-md ${bg} transition-colors cursor-default`} />
                  <span className="text-[8px] text-muted-foreground">{day.label}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-400" />≥ 90%</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-400" />70–90%</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400" />{'< 70%'}</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" />No data</div>
          </div>
        </div>
      )}
    </div>
  )
}
