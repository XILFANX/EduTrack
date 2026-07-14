'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  UserPlus, ArrowLeft, GraduationCap,
  UserCheck, X, Check, Trash2, Search,
  TrendingUp, Users, BookOpen, BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { EnrollStudentModal } from '@/app/dashboard/students/enroll-student-modal'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit } from 'lucide-react'
import { deleteStudent } from '@/app/dashboard/students/actions'
import { assignTeacher, deleteClass } from '../actions'
import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

interface Teacher { id: string; full_name: string; role: string; salutation?: string | null }

interface ClassDetailClientProps {
  cls: { id: string; name: string }
  initialStudents: any[]
  teacherName: string | null
  teacherSalutation: string | null
  teacherId: string | null
  teachers: Teacher[]
  schoolId: string
}

type Tab = 'overview' | 'students' | 'performance'

export function ClassDetailClient({
  cls, initialStudents, teacherName, teacherSalutation,
  teacherId, teachers, schoolId
}: ClassDetailClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [students, setStudents] = useState(initialStudents)
  const [search, setSearch] = useState('')
  const { dialogProps, confirm, setLoading: setConfirmLoading } = useConfirmDialog()

  const [currentTeacherId, setCurrentTeacherId] = useState(teacherId)
  const [currentTeacherName, setCurrentTeacherName] = useState(teacherName)
  const [assignMode, setAssignMode] = useState(false)
  const [selectedTeacherId, setSelectedTeacherId] = useState(teacherId ?? '')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  const displayTeacherName = currentTeacherName ?? null

  const filteredStudents = students.filter(s => {
    const q = search.toLowerCase()
    return (
      s.first_name?.toLowerCase().includes(q) ||
      s.last_name?.toLowerCase().includes(q) ||
      s.admission_number?.toLowerCase().includes(q)
    )
  })

  async function handleDeleteClass() {
    if (students.length > 0) {
      alert('This class has enrolled students. Please remove or transfer them before deleting.')
      return
    }
    const ok = await confirm({
      title: 'Delete Class',
      description: `Permanently delete "${cls.name}"? This cannot be undone.`,
      confirmLabel: 'Delete Class', variant: 'danger'
    })
    if (!ok) return
    setConfirmLoading(true)
    const res = await deleteClass(cls.id)
    setConfirmLoading(false)
    if ('error' in res && res.error) { alert(res.error) }
    else { toast.success(`"${cls.name}" deleted`); router.push('/dashboard/classes'); router.refresh() }
  }

  async function handleDeleteStudent(id: string) {
    const ok = await confirm({
      title: 'Remove Student',
      description: 'Remove this student from the class? This cannot be undone.',
      confirmLabel: 'Remove', variant: 'danger'
    })
    if (!ok) return
    setConfirmLoading(true)
    const res = await deleteStudent(id)
    setConfirmLoading(false)
    if ('success' in res) { setStudents(prev => prev.filter(s => s.id !== id)) }
    else { alert(res.error) }
  }

  async function handleAssignTeacher() {
    setAssigning(true); setAssignError(null)
    const res = await assignTeacher(cls.id, selectedTeacherId || null)
    setAssigning(false)
    if ('error' in res) { setAssignError(res.error ?? null) }
    else {
      const t = teachers.find(t => t.id === selectedTeacherId)
      setCurrentTeacherId(selectedTeacherId || null)
      setCurrentTeacherName(t?.full_name ?? null)
      setAssignMode(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'students', label: `Students (${students.length})`, icon: Users },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/classes" className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{cls.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
        </div>
        {students.length === 0 && (
          <button
            onClick={handleDeleteClass}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-sm font-medium transition-colors"
            title="Delete class"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete Class</span>
          </button>
        )}
      </div>

      {/* Tab Bar — full text, blue underline active indicator */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === t.id
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <t.icon className="w-3.5 h-3.5 shrink-0" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Class info card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Class Details</h2>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Class Teacher</p>
                  {displayTeacherName
                    ? <p className="font-semibold text-foreground text-sm">{displayTeacherName}</p>
                    : <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Not assigned</p>
                  }
                </div>
              </div>

              {!assignMode ? (
                <Button
                  variant={currentTeacherId ? 'outline' : 'default'}
                  size="sm"
                  className={currentTeacherId ? 'gap-1.5' : 'bg-blue-600 hover:bg-blue-700 gap-1.5'}
                  onClick={() => { setSelectedTeacherId(currentTeacherId ?? ''); setAssignMode(true) }}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  {currentTeacherId ? 'Change Teacher' : 'Assign Teacher'}
                </Button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <select
                    value={selectedTeacherId}
                    onChange={e => setSelectedTeacherId(e.target.value)}
                    className="flex-1 sm:w-52 bg-background border border-input text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="">— None —</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>
                  <div className="flex gap-1.5">
                    <button onClick={handleAssignTeacher} disabled={assigning}
                      className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors disabled:opacity-50">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setAssignMode(false); setAssignError(null) }}
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {assignError && <p className="w-full text-xs text-red-600 mt-1">{assignError}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Students', value: students.length, icon: Users, color: 'blue' },
              { label: 'Subjects', value: '—', icon: BookOpen, color: 'indigo' },
              { label: 'Avg. Score', value: '—', icon: TrendingUp, color: 'emerald' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <div className={`w-9 h-9 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center mb-3`}>
                  <Icon className={`w-4.5 h-4.5 text-${color}-600 dark:text-${color}-400`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Quick action to see students */}
          <button
            onClick={() => setActiveTab('students')}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground text-sm">See all students</p>
                <p className="text-xs text-muted-foreground">{students.length} enrolled in {cls.name}</p>
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180 group-hover:text-blue-500 transition-colors" />
          </button>

          <button
            onClick={() => setActiveTab('performance')}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground text-sm">See performance</p>
                <p className="text-xs text-muted-foreground">Ranked student results, term by term</p>
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180 group-hover:text-emerald-500 transition-colors" />
          </button>
        </div>
      )}

      {/* ── STUDENTS TAB ── */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search students…"
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2 shrink-0" onClick={() => setIsModalOpen(true)}>
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Enroll Student</span>
            </Button>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {search ? 'No students match your search' : 'No students enrolled'}
              </h2>
              {!search && (
                <>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
                    Enroll your first student to build the class roster.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setIsModalOpen(true)}>
                    <UserPlus className="w-4 h-4" /> Enroll First Student
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredStudents.map(student => (
                  <div key={student.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {student.first_name?.[0]}{student.last_name?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {student.first_name} {student.middle_name ? student.middle_name + ' ' : ''}{student.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">{student.admission_number}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                        Active
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-foreground">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                          <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                            <Link href={`/dashboard/students/${student.id}`}>
                              <Edit className="w-4 h-4" /> View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 gap-2 cursor-pointer"
                            onClick={() => handleDeleteStudent(student.id)}
                          >
                            <Trash2 className="w-4 h-4" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-muted-foreground">{filteredStudents.length} of {students.length} students</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PERFORMANCE TAB ── */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mx-auto flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Performance Analytics</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
              Ranked student performance, broken down term by term, will appear here once exam results are entered.
            </p>
            {students.length === 0 ? (
              <p className="mt-4 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg px-3 py-2 inline-block">
                Enroll students first to see their performance.
              </p>
            ) : (
              <div className="mt-6 space-y-2">
                {students.slice().sort(() => Math.random() - 0.5).map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 dark:bg-slate-700 text-muted-foreground'}`}>
                      {i + 1}
                    </span>
                    <p className="flex-1 text-left text-sm font-medium text-foreground">{s.first_name} {s.last_name}</p>
                    <span className="text-xs text-muted-foreground font-mono">No results yet</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <EnrollStudentModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classes={[cls]}
        onSuccess={() => { router.refresh() }}
      />
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
