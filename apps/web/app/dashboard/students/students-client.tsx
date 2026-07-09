'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, Search, GraduationCap, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { EnrollStudentModal } from './enroll-student-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteStudent } from './actions'

export function StudentsPageClient({ initialStudents, classes }: { initialStudents: any[], classes: any[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [students, setStudents] = useState(initialStudents)

  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    const q = searchQuery.toLowerCase()
    return (
      student.first_name.toLowerCase().includes(q) ||
      (student.middle_name && student.middle_name.toLowerCase().includes(q)) ||
      student.last_name.toLowerCase().includes(q) ||
      student.admission_number.toLowerCase().includes(q) ||
      ((student.classes as any)?.name || '').toLowerCase().includes(q)
    )
  })

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Global registry of all students in the school.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4" />
          Enroll Student
        </Button>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name, admission number, or class..." 
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
        />
      </div>

      {!students || students.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
           <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto flex items-center justify-center mb-4">
             <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
           </div>
           <h2 className="text-lg font-semibold text-foreground">No students enrolled yet</h2>
           <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
             Click 'Enroll Student' to add your first student.
           </p>
         </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <p className="text-muted-foreground">No students match your search.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Admission #</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{student.admission_number}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{student.first_name} {student.middle_name ? student.middle_name + ' ' : ''}{student.last_name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{(student.classes as any)?.name || 'Unassigned'}</td>
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
                          <DropdownMenuItem asChild className="text-slate-600 dark:text-slate-300 gap-2 cursor-pointer">
                            <Link href={`/dashboard/students/${student.id}`}>
                              <Edit className="w-4 h-4" /> View Profile
                            </Link>
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
        classes={classes}
        onSuccess={() => {
          // We will rely on revalidatePath to refresh the page state,
          // but we can close the modal manually or just let Next.js refresh
          setTimeout(() => window.location.reload(), 1500)
        }}
      />
    </div>
  )
}
