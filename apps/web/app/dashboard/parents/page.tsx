import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ParentsDirectoryClient } from './parents-client'

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

  // Fetch all classes
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name')

  const selectedClassId = params.class || classes?.[0]?.id || ''

  // For the selected class, fetch students with their linked parents
  let studentsWithParents: any[] = []

  if (selectedClassId) {
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

      // Build: for each student, attach their parents
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
  }

  // Messaging: get current user id for DM linking
  const contacts = studentsWithParents.flatMap((s: any) =>
    s.parents.map((p: any) => ({
      id: p.id,
      name: p.full_name || 'Parent',
      role: 'Parent',
      studentName: `${s.first_name} ${s.last_name}`,
      last_seen_at: p.last_seen_at,
    }))
  )

  return (
    <ParentsDirectoryClient
      classes={(classes as any[]) || []}
      selectedClassId={selectedClassId}
      studentsWithParents={studentsWithParents}
      currentUserId={user.id}
    />
  )
}
