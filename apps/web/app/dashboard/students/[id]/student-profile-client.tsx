'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, Calendar, User, FileText, Check, ChevronDown } from 'lucide-react'
import { updateStudentClass } from '../actions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function StudentProfileClient({ student, classes }: { student: any, classes: any[] }) {
  const [loading, setLoading] = useState(false)
  const [currentClassId, setCurrentClassId] = useState<string | null>(student.class_id)
  
  const currentClass = classes.find(c => c.id === currentClassId)

  async function handleAssignClass(classId: string | null) {
    if (classId === currentClassId) return
    setLoading(true)
    const res = await updateStudentClass(student.id, classId)
    setLoading(false)
    if ('success' in res) {
      setCurrentClassId(classId)
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* ── Left Column: Main Profile Card ── */}
      <div className="md:col-span-1">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="h-24 bg-gradient-to-r from-blue-600 to-cyan-500" />
          <CardContent className="px-6 pb-6 pt-0 relative">
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-950 shadow-sm mx-auto -mt-10 flex items-center justify-center relative z-10">
              <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                {student.first_name[0]}{(student.middle_name || student.last_name)[0]}
              </span>
            </div>
            
            <div className="text-center mt-3 mb-6">
              <h2 className="text-xl font-bold text-foreground">{student.first_name} {student.middle_name ? student.middle_name + ' ' : ''}{student.last_name}</h2>
              <p className="text-sm font-mono text-muted-foreground mt-1 bg-slate-100 dark:bg-slate-800/50 inline-block px-2 py-0.5 rounded-md">
                {student.admission_number}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Status</p>
                    <p className="text-sm font-semibold text-foreground">Active</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Class Assignment</p>
                    <p className="text-sm font-semibold text-foreground">{currentClass?.name || 'Unassigned'}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2" disabled={loading}>
                      Change <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl">
                    <DropdownMenuItem 
                      className={`gap-2 ${currentClassId === null ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                      onClick={() => handleAssignClass(null)}
                    >
                      {currentClassId === null && <Check className="w-4 h-4 text-blue-600" />} 
                      <span className={currentClassId === null ? 'ml-0' : 'ml-6'}>Unassigned</span>
                    </DropdownMenuItem>
                    {classes.map(c => (
                      <DropdownMenuItem 
                        key={c.id} 
                        className={`gap-2 ${currentClassId === c.id ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                        onClick={() => handleAssignClass(c.id)}
                      >
                        {currentClassId === c.id && <Check className="w-4 h-4 text-blue-600" />} 
                        <span className={currentClassId === c.id ? 'ml-0' : 'ml-6'}>{c.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Right Column: Details & Tabs ── */}
      <div className="md:col-span-2 space-y-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4">Personal Details</h3>
            <div className="grid grid-cols-2 gap-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Admission #</p>
                <p className="font-semibold">{student.admission_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Date of Birth</p>
                <p className="font-semibold">{student.dob ? new Date(student.dob).toLocaleDateString() : 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Enrollment Date</p>
                <p className="font-semibold">{new Date(student.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6 text-center py-12">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center mb-3">
              <User className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="font-semibold text-lg">No Parents Linked</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Parent/Guardian profiles have not been linked to this student yet. 
              The Parent Portal invite system will handle this in a future update.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
