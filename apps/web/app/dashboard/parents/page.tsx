import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ClassDirectory } from '@/components/shared/class-directory'
import { ParentsDirectoryClient } from './parents-client'
import { Users, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ParentsDirectoryPage({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || !['admin', 'principal', 'headteacher'].includes((profile as any).role)) {
    redirect('/dashboard')
  }

  const schoolId = (profile as any).school_id
  const adminClient = createAdminClient()

  // Fetch all classes with student counts for directory
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name')

  const selectedClassId = params.class || ''

  // Show ClassDirectory if no class selected
  if (!selectedClassId) {
    // Get student counts per class for informational labels
    const { data: studentCounts } = await supabase
      .from('students')
      .select('class_id')
      .eq('school_id', schoolId)
      .is('deleted_at', null)

    const countMap: Record<string, number> = {}
    ;(studentCounts || []).forEach((s: any) => {
      countMap[s.class_id] = (countMap[s.class_id] || 0) + 1
    })

    return (
      <ClassDirectory
        title="Parents Directory"
        description="Select a class to view linked parents and communicate with them directly."
        classes={(classes || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          countLabel: `${countMap[c.id] || 0} students enrolled`,
        }))}
        basePath="/dashboard/parents?class"
      />
    )
  }

  // Fetch students for this class with their linked parents
  let studentsWithParents: any[] = []

  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, admission_number, photo_url')
    .eq('class_id', selectedClassId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('first_name')

  if (students && students.length > 0) {
    const studentIds = students.map((s: any) => s.id)

    const { data: parentLinks } = await adminClient
      .from('student_parents' as any)
      .select('student_id, parent_id')
      .in('student_id', studentIds)

    const links = (parentLinks as any[]) || []
    const parentIds = [...new Set(links.map((l: any) => l.parent_id))]

    let parentsMap: Record<string, any> = {}
    if (parentIds.length > 0) {
      const { data: parentsData } = await adminClient
        .from('users')
        .select('id, full_name, salutation, phone_number, photo_url, last_seen_at')
        .in('id', parentIds)

      ;(parentsData || []).forEach((p: any) => { parentsMap[p.id] = p })
    }

    studentsWithParents = (students as any[]).map((student: any) => {
      const parentIdsForStudent = links
        .filter((l: any) => l.student_id === student.id)
        .map((l: any) => l.parent_id)
      const parents = parentIdsForStudent
        .map((pid: string) => parentsMap[pid])
        .filter(Boolean)
      return { ...student, parents }
    })
  }

  const selectedClass = (classes || []).find((c: any) => c.id === selectedClassId)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/parents" className="p-2.5 rounded-xl bg-[#121827] border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-100">
              Parents <span className="text-slate-600">/</span> <span className="text-blue-400">{selectedClass?.name}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">{studentsWithParents.length} students • {studentsWithParents.flatMap(s => s.parents).length} linked parents</p>
          </div>
        </div>
      </div>

      <ParentsDirectoryClient
        key={selectedClassId || 'default'}
        classes={(classes as any[]) || []}
        selectedClassId={selectedClassId}
        studentsWithParents={studentsWithParents}
        currentUserId={user.id}
      />
    </div>
  )
}
