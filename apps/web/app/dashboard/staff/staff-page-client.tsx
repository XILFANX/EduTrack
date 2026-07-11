'use client'

import { useState } from 'react'
import { UserPlus, UserCog, Search, Link as LinkIcon, Trash2, Check, Copy, X, Phone, Calendar, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InviteStaffModal } from './invite-staff-modal'
import { useRouter } from 'next/navigation'
import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteInviteAndAccount } from './actions'
import { toast } from 'sonner'

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  class_teacher:   { label: 'Class Teacher',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  subject_teacher: { label: 'Subject Teacher',   color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
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

interface Invitation {
  id: string
  token: string
  role: string
  target_name: string | null
  target_phone: string | null
  used_at: string | null
  created_at: string
}

interface StaffPageClientProps {
  staff: StaffMember[]
  invitations: Invitation[]
  schoolId: string
}

export function StaffPageClient({ staff, invitations, schoolId }: StaffPageClientProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [detailMember, setDetailMember] = useState<StaffMember | null>(null)
  
  const { dialogProps, confirm, setLoading } = useConfirmDialog()

  const filteredStaff = staff.filter((s) => {
    const matchSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone_number.includes(search)
    const matchRole = filterRole === 'all' || s.role === filterRole
    return matchSearch && matchRole
  })

  // Group by role in the defined ROLE_LABELS order
  const groupedStaff = Object.keys(ROLE_LABELS).reduce((acc, role) => {
    const members = filteredStaff.filter(s => s.role === role)
    if (members.length > 0) acc[role] = members
    return acc
  }, {} as Record<string, StaffMember[]>)

  const pendingInvitations = invitations.filter(inv => !inv.used_at)

  function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  }

  function handleCopyLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
    toast.success('Invite link copied to clipboard')
  }

  async function handleDeleteInvite(id: string, isUsed: boolean, name?: string) {
    const ok = await confirm({
      title: isUsed ? 'Permanently Remove Staff' : 'Delete Invitation',
      description: isUsed 
        ? 'This will permanently remove this staff member and revoke all their access. This cannot be undone.'
        : 'This will invalidate the invite link. Are you sure?',
      confirmLabel: isUsed ? 'Permanently Remove' : 'Delete',
      variant: 'danger'
    })
    
    if (!ok) return
    
    setLoading(true)
    const res = await deleteInviteAndAccount(id)
    setLoading(false)
    
    if (res.error) alert(res.error)
    else {
      toast.success(isUsed ? `${name ?? 'Staff member'} removed` : 'Invitation deleted')
      setDetailMember(null)
      router.refresh()
    }
  }

  const detailInvite = detailMember
    ? invitations.find(i => i.target_phone === detailMember.phone_number && i.used_at)
    : null

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
          <span className="hidden sm:inline">Invite Staff</span>
        </Button>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-amber-50/50 dark:bg-amber-900/10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-500">Pending Invitations ({pendingInvitations.length})</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {pendingInvitations.map(inv => {
              const roleInfo = ROLE_LABELS[inv.role] ?? { label: inv.role, color: 'bg-slate-100 text-slate-700' }
              return (
                <div key={inv.id} className="flex items-center gap-3 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center justify-center text-sm font-bold shrink-0">
                    {getInitials(inv.target_name || '??')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{inv.target_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">{inv.target_phone}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5 h-8 text-xs"
                      onClick={() => handleCopyLink(inv.token)}
                    >
                      {copiedToken === inv.token ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copiedToken === inv.token ? 'Copied' : 'Copy'}</span>
                    </Button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Hello ${inv.target_name}! 👋\n\nYou have been invited to join EduTrack. Click the link below to set up your account:\n${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inv.token}\n\n_This link is permanent and does not expire._`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-3 flex items-center text-xs font-medium bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-md transition-colors"
                    >
                      WhatsApp
                    </a>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDeleteInvite(inv.id, false, inv.target_name ?? undefined)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
      {filteredStaff.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <UserCog className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {staff.length === 0 ? 'No active staff members yet' : 'No results found'}
            </p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
              {staff.length === 0
                ? 'Staff appear here once they complete setup using their invite link.'
                : 'Try adjusting your search or filter.'}
            </p>
          </div>
          {staff.length === 0 && (
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setModalOpen(true)}>
              <UserPlus className="w-4 h-4" /> Invite First Staff Member
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedStaff).map(([roleKey, members]) => {
            const roleInfo = ROLE_LABELS[roleKey]
            return (
              <div key={roleKey}>
                {/* Role section header */}
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 pl-1">
                  {roleInfo.label}s · {members.length}
                </p>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/50">
                  {members.map((member) => {
                    const invite = invitations.find(i => i.target_phone === member.phone_number && i.used_at)
                    return (
                      <button
                        key={member.id}
                        onClick={() => setDetailMember(member)}
                        className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left group"
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-bold shrink-0">
                          {getInitials(member.full_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{member.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.phone_number}</p>
                        </div>
                        {invite && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0 hidden sm:inline-flex">
                            Active
                          </span>
                        )}
                        <ExternalLink className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Staff Detail Sheet */}
      {detailMember && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setDetailMember(null)}
          />
          {/* Panel */}
          <div className="relative w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 overflow-hidden">
            {/* Drag handle */}
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-4 sm:hidden" />

            {/* Header */}
            <div className="flex items-center gap-4 px-5 pb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-base font-bold shrink-0">
                {getInitials(detailMember.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate">{detailMember.full_name}</p>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block ${ROLE_LABELS[detailMember.role]?.color ?? 'bg-slate-100 text-slate-700'}`}>
                  {ROLE_LABELS[detailMember.role]?.label ?? detailMember.role}
                </span>
              </div>
              <button 
                onClick={() => setDetailMember(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Details */}
            <div className="px-5 pb-2 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{detailMember.phone_number}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">Joined {new Date(detailMember.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            {/* Actions */}
            {detailInvite && (
              <div className="px-5 pb-5 pt-4 space-y-2 border-t border-slate-100 dark:border-slate-800 mt-3">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => handleCopyLink(detailInvite.token)}
                  >
                    {copiedToken === detailInvite.token ? <Check className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4" />}
                    {copiedToken === detailInvite.token ? 'Copied!' : 'Copy Portal Link'}
                  </Button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Hello ${detailMember.full_name}! 👋\n\nYour permanent EduTrack access link:\n${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${detailInvite.token}\n\n_This link is permanent and does not expire._`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 text-sm font-medium bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-md transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
                  onClick={() => handleDeleteInvite(detailInvite.id, true, detailMember.full_name)}
                >
                  <Trash2 className="w-4 h-4" />
                  Permanently Remove {detailMember.full_name.split(' ')[0]}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <InviteStaffModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        schoolId={schoolId}
        onSuccess={() => router.refresh()}
      />
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
