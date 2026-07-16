'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GraduationCap, Plus, Loader2 } from 'lucide-react'
import { saveDisciplineLog } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Student { id: string; first_name: string; last_name: string; admission_number: string; photo_url?: string | null }
interface Log { id: string; student_id: string; title: string; description: string; action_taken: string; created_at: string; students: { first_name: string; last_name: string; admission_number: string; photo_url?: string | null } }

interface Props {
  schoolId: string
  teacherId: string
  cls: { id: string; name: string } | null
  students: Student[]
  logs: Log[]
}

export function DisciplineClient({ schoolId, teacherId, cls, students, logs }: Props) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ studentId: '', title: '', description: '', actionTaken: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cls || !formData.studentId || !formData.title || !formData.description) return
    
    setLoading(true)
    const res = await saveDisciplineLog({
      schoolId,
      classId: cls.id,
      teacherId,
      studentId: formData.studentId,
      title: formData.title,
      description: formData.description,
      actionTaken: formData.actionTaken,
    })
    setLoading(false)

    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Log added successfully')
      setIsAdding(false)
      setFormData({ studentId: '', title: '', description: '', actionTaken: '' })
      router.refresh()
    }
  }

  if (!cls) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 mx-auto flex items-center justify-center mb-4">
          <GraduationCap className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">No Class Assigned</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
          You must be assigned as a Class Teacher to manage discipline logs.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discipline Log</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{cls.name}</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Add Record
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-foreground mb-4">New Discipline Record</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Student</label>
              <select
                required
                value={formData.studentId}
                onChange={e => setFormData(p => ({ ...p, studentId: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              >
                <option value="">Select a student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Title (e.g. Late Arrival, Disruption)</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                placeholder="Brief title of the incident"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
              <textarea
                required
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none min-h-[100px]"
                placeholder="What happened?"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Action Taken (Optional)</label>
              <input
                type="text"
                value={formData.actionTaken}
                onChange={e => setFormData(p => ({ ...p, actionTaken: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                placeholder="e.g. Warning, Sent to principal"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Record
              </Button>
            </div>
          </form>
        </div>
      )}

      {!isAdding && logs.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 mx-auto flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No Records</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            The discipline log for this class is empty.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const initials = `${log.students?.first_name?.[0] || ''}${log.students?.last_name?.[0] || ''}`
            return (
              <div key={log.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {log.students?.photo_url ? (
                      <img src={log.students.photo_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {initials}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        {log.title}
                        <span className="text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded-full">
                          {log.students?.first_name} {log.students?.last_name}
                        </span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 mb-2">
                        {new Date(log.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                      <p className="text-sm text-foreground/80 leading-relaxed">{log.description}</p>
                      
                      {log.action_taken && (
                        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                          <span className="uppercase tracking-wider text-[10px]">Action:</span> {log.action_taken}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
