'use client'

import { useState } from 'react'
import { UserPlus, UserCog, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InviteStaffModal } from './invite-staff-modal'
import { useRouter } from 'next/navigation'

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  class_teacher:   { label: 'Class Teacher',    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  subject_teacher: { label: 'Subject Teacher',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  bursar:          { label: 'Bursar',            color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  librarian:       { label: 'Librarian',         color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  storekeeper:     { label: 'Storekeeper',       color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  transport_matron:{ label: 'Transport Matron',  color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
}

interface StaffMember {
  id: string
  full_name: string
  role: string
  phone_number: string
  created_at: string
}

interface StaffPageClientProps {
  staff: StaffMember[]
  schoolId: string
}

export function StaffPageClient({ staff, schoolId }: StaffPageClientProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')

  const filtered = staff.filter((s) => {
    const matchSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone_number.includes(search)
    const matchRole = filterRole === 'all' || s.role === filterRole
    return matchSearch && matchRole
  })

  function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{staff.length} member{staff.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 gap-2"
          onClick={() => setModalOpen(true)}
        >
          <UserPlus className="w-4 h-4" />
          Invite Staff
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Staff List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <UserCog className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">
            {staff.length === 0 ? 'No staff invited yet' : 'No results found'}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {staff.length === 0
              ? 'Click "Invite Staff" to generate a secure link for your teachers, bursar, librarian, and more.'
              : 'Try adjusting your search or filter.'}
          </p>
          {staff.length === 0 && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 gap-2 mt-2"
              onClick={() => setModalOpen(true)}
            >
              <UserPlus className="w-4 h-4" />
              Invite your first staff member
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((member) => {
            const roleInfo = ROLE_LABELS[member.role] ?? { label: member.role, color: 'bg-slate-100 text-slate-700' }
            return (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-bold shrink-0">
                  {getInitials(member.full_name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{member.full_name}</p>
                  <p className="text-xs text-muted-foreground">{member.phone_number}</p>
                </div>

                {/* Role Badge */}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Invite Modal */}
      <InviteStaffModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        schoolId={schoolId}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
