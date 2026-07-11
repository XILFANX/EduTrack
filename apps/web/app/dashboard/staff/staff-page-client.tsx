'use client'

import { useState } from 'react'
import { UserPlus, UserCog, Search, Link as LinkIcon, Trash2, Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InviteStaffModal } from './invite-staff-modal'
import { useRouter } from 'next/navigation'
import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteInviteAndAccount } from './actions'

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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  const { dialogProps, confirm, setLoading } = useConfirmDialog()

  const filteredStaff = staff.filter((s) => {
    const matchSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone_number.includes(search)
    const matchRole = filterRole === 'all' || s.role === filterRole
    return matchSearch && matchRole
  })

  const groupedStaff = filteredStaff.reduce((acc, member) => {
    if (!acc[member.role]) acc[member.role] = []
    acc[member.role].push(member)
    return acc
  }, {} as Record<string, StaffMember[]>)

  // We only show pending invitations in the UI
  const pendingInvitations = invitations.filter(inv => !inv.used_at)

  function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  }

  function handleCopyLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  async function handleDeleteInvite(id: string, isUsed: boolean) {
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
    else router.refresh()
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
          <span className="hidden sm:inline">Invite Staff</span>
        </Button>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mb-8">
          <div className="px-4 py-3 bg-amber-50/50 dark:bg-amber-900/10 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-500">Pending Invitations</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {pendingInvitations.map(inv => {
              const roleInfo = ROLE_LABELS[inv.role] ?? { label: inv.role, color: 'bg-slate-100 text-slate-700' }
              return (
                <div key={inv.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{inv.target_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{inv.target_phone}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5 h-8 text-xs"
                      onClick={() => handleCopyLink(inv.token)}
                    >
                      {copiedToken === inv.token ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copiedToken === inv.token ? 'Copied' : 'Copy Link'}</span>
                    </Button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Hello ${inv.target_name}! 👋\n\nYou have been invited to join EduTrack. Click the link below to set up your account:\n${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inv.token}\n\n_This link is permanent and does not expire._`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-medium bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-md transition-colors"
                    >
                      WhatsApp
                    </a>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDeleteInvite(inv.id, false)}
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
        <div className="text-center py-20 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <UserCog className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">
            {staff.length === 0 ? 'No active staff members' : 'No results found'}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {staff.length === 0
              ? 'Active staff will appear here once they complete their account setup using the invite link.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(ROLE_LABELS).map(([roleKey, roleInfo]) => {
            const membersInRole = groupedStaff[roleKey]
            if (!membersInRole || membersInRole.length === 0) return null
            
            return (
              <div key={roleKey} className="space-y-3 mb-8">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                  {roleInfo.label}s ({membersInRole.length})
                </h3>
                <div className="space-y-3">
                  {membersInRole.map((member) => {
                    const invite = invitations.find(i => i.target_phone === member.phone_number && i.used_at)
                    const isExpanded = expandedId === member.id
                    
                    return (
                      <div
                        key={member.id}
                        className={`bg-white dark:bg-slate-900 border transition-all overflow-hidden ${isExpanded ? 'border-blue-500 ring-1 ring-blue-500 shadow-md rounded-2xl' : 'border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-300 dark:hover:border-blue-700'}`}
                      >
                        {/* Header (Always visible) */}
                        <div 
                          className="flex items-center gap-4 p-4 cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : member.id)}
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-bold shrink-0">
                            {getInitials(member.full_name)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{member.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.phone_number}</p>
                          </div>
                          
                          <div className="shrink-0 flex items-center gap-2">
                            {invite && !isExpanded && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={(e) => { e.stopPropagation(); handleDeleteInvite(invite.id, true); }}
                                title="Revoke Access"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1">Date Joined</p>
                                <p className="text-sm text-foreground font-medium">{new Date(member.created_at).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1">Account Status</p>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  Active Portal
                                </span>
                              </div>
                            </div>

                            {invite && (
                              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-1.5 flex-1"
                                  onClick={() => handleCopyLink(invite.token)}
                                >
                                  {copiedToken === invite.token ? <Check className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4" />}
                                  <span>{copiedToken === invite.token ? 'Copied' : 'Copy Permanent Link'}</span>
                                </Button>
                                <a
                                  href={`https://wa.me/?text=${encodeURIComponent(`Hello ${member.full_name}! 👋\n\nYour permanent EduTrack access link is:\n${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${invite.token}\n\n_This link is permanent and does not expire._`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 text-sm font-medium bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-md transition-colors"
                                >
                                  Send WhatsApp
                                </a>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  className="gap-1.5 flex-1"
                                  onClick={() => handleDeleteInvite(invite.id, true)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Permanently Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
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
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
