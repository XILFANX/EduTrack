'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, ArrowLeft, MoreVertical, GraduationCap, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { EnrollStudentModal } from '@/app/dashboard/students/enroll-student-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteStudent } from '@/app/dashboard/students/actions'

interface ClassDetailClientProps {
  cls: { id: string; name: string }
  initialStudents: any[]
  teacherName: string | null
}

export function ClassDetailClient({ cls, initialStudents, teacherName }: ClassDetailClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [students, setStudents] = useState(initialStudents)

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this student?')) return
    const res = await deleteStudent(id)
    if ('success' in res) {
      setStudents(students.filter(s => s.id !== id))
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/classes" className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{cls.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Class Teacher: <span className="font-medium text-foreground">{teacherName || 'Unassigned'}</span></p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="text-lg font-semibold text-foreground">Student Roster ({students.length})</h2>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4" />
          Enroll Student
        </Button>
      </div>

      {!students || students.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
           <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
             <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
           </div>
           <h2 className="text-lg font-semibold text-foreground">No students enrolled</h2>
           <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
             Start enrolling students into this class to build the roster.
           </p>
         </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Admission #</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{student.admission_number}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{student.first_name} {student.last_name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">Active</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                          <DropdownMenuItem className="text-slate-600 dark:text-slate-300 gap-2 cursor-pointer">
                            <Edit className="w-4 h-4" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 gap-2 cursor-pointer"
                            onClick={() => handleDelete(student.id)}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EnrollStudentModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        classes={[cls]}
        onSuccess={() => {
          setTimeout(() => window.location.reload(), 1500)
        }}
      />
    </div>
  )
}
