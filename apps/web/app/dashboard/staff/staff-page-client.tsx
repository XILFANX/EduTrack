'use client'

import { useState } from 'react'
import { UserPlus, UserCog, Search, Share2, Copy, Check, Trash2, Phone, Calendar, X, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InviteStaffModal } from './invite-staff-modal'
import { useRouter } from 'next/navigation'
import { useConfirmDialog, ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteInviteAndAccount } from './actions'
import { toast } from 'sonner'

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  class_teacher:    { label: 'Class Teacher',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  subject_teacher:  { label: 'Subject Teacher',  color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
  bursar:           { label: 'Bursar',           color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  librarian:        { label: 'Librarian',        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  storekeeper:      { label: 'Storekeeper',      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  transport_matron: { label: 'Transport Matron', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
}

const WA_ICON = (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.38 1.25 4.79L2.05 22l5.5-1.44c1.37.73 2.92 1.15 4.49 1.15h.01C17.5 21.71 22 17.26 22 11.8c0-2.66-1.04-5.17-2.92-7.05A9.93 9.93 0 0012.04 2zm0 1.67c2.24 0 4.35.87 5.94 2.46a8.33 8.33 0 012.45 5.68c0 4.59-3.74 8.32-8.34 8.32a8.33 8.33 0 01-4.23-1.15l-.3-.18-3.14.82.84-3.07-.2-.32a8.28 8.28 0 01-1.27-4.42c0-4.6 3.74-8.34 8.25-8.34zm-2.78 4.4c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09s.9 2.43 1.02 2.6c.13.17 1.77 2.7 4.28 3.68.6.26 1.07.41 1.43.52.6.19 1.15.16 1.58.1.48-.07 1.48-.61 1.69-1.19.21-.58.21-1.08.15-1.19-.06-.1-.23-.16-.48-.28-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.13-.17.25-.64.81-.79.98-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25a7.58 7.58 0 01-1.4-1.74c-.15-.25-.02-.39.11-.51.12-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.36-.77-1.86-.2-.49-.4-.42-.56-.43h-.48z"/>
  </svg>
)

interface StaffMember { id: string; full_name: string; role: string; phone_number: string; created_at: string }
interface Invitation { id: string; token: string; role: string; target_name: string | null; target_phone: string | null; used_at: string | null; created_at: string }
interface StaffPageClientProps { staff: StaffMember[]; invitations: Invitation[]; schoolId: string }

function getInitials(name: string) { return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() }
function getPortalLink(token: string) { return `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${token}` }
function buildWA(name: string, token: string) {
  return `https://wa.me/?text=${encodeURIComponent(`Hello ${name}! 👋\n\nHere is your permanent EduTrack access link:\n${getPortalLink(token)}\n\n_This link is permanent and does not expire._`)}`
}

export function StaffPageClient({ staff, invitations, schoolId }: StaffPageClientProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState<string | null>(null)
  const [detailMember, setDetailMember] = useState<StaffMember | null>(null)
  const { dialogProps, confirm, setLoading } = useConfirmDialog()

  const filteredStaff = staff.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) || s.phone_number.includes(search)
  )
  const pendingInvitations = invitations.filter(inv => !inv.used_at)

  function handleCopyLink(token: string) {
    navigator.clipboard.writeText(getPortalLink(token))
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
    setShareOpen(null)
    toast.success('Invite link copied!')
  }

  async function handleDelete(invId: string, isActive: boolean, name?: string) {
    const ok = await confirm({
      title: isActive ? 'Permanently Remove Staff' : 'Delete Invitation',
      description: isActive
        ? 'This will permanently remove this staff member and revoke all their access. This cannot be undone.'
        : 'This will permanently delete this invitation link.',
      confirmLabel: isActive ? 'Permanently Remove' : 'Delete',
      variant: 'danger'
    })
    if (!ok) return
    setLoading(true)
    const res = await deleteInviteAndAccount(invId)
    setLoading(false)
    if (res.error) alert(res.error)
    else {
      toast.success(isActive ? `${name ?? 'Staff member'} removed` : 'Invitation deleted')
      setDetailMember(null)
      router.refresh()
    }
  }

  const detailInvite = detailMember
    ? invitations.find(i => i.target_phone === detailMember.phone_number && i.used_at)
    : null

  return (
    <div className="space-y-6" onClick={() => setShareOpen(null)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {staff.length} active · {pendingInvitations.length} pending invite{pendingInvitations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setModalOpen(true)}>
          <UserPlus className="w-4 h-4" /><span className="hidden sm:inline">Invite Staff</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search by name or phone…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Active Members */}
      {filteredStaff.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-visible">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Members</h2>
            <span className="text-xs text-muted-foreground">{filteredStaff.length} total</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {filteredStaff.map(member => {
              const inv = invitations.find(i => i.target_phone === member.phone_number && i.used_at)
              const roleInfo = ROLE_LABELS[member.role] ?? { label: member.role, color: 'bg-slate-100 text-slate-600' }
              const joinedDate = new Date(member.created_at).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })
              return (
                <div
                  key={member.id}
                  className="flex items-start gap-3.5 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer relative"
                  onClick={() => setDetailMember(member)}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                    {getInitials(member.full_name)}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{member.phone_number} · Joined {joinedDate}</p>
                    {/* Share Portal — stops row click */}
                    {inv && (
                      <div className="relative mt-1.5 inline-block" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setShareOpen(shareOpen === member.id ? null : member.id)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium transition-colors"
                        >
                          <Share2 className="w-3 h-3" /> Share Portal
                        </button>
                        {/* Dropdown — z-50, fixed width, no overflow clip */}
                        {shareOpen === member.id && (
                          <div className="absolute left-0 top-7 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-52 py-1 overflow-hidden">
                            <button
                              onClick={() => handleCopyLink(inv.token)}
                              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              {copiedToken === inv.token ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                              Copy Link
                            </button>
                            <a
                              href={buildWA(member.full_name, inv.token)}
                              target="_blank" rel="noopener noreferrer"
                              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#25D366] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              onClick={() => setShareOpen(null)}
                            >
                              {WA_ICON} Share via WhatsApp
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Role pill */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-1 ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredStaff.length === 0 && pendingInvitations.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <UserCog className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No staff yet</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">Invite your first staff member using the button above.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setModalOpen(true)}>
            <UserPlus className="w-4 h-4" /> Invite First Staff Member
          </Button>
        </div>
      )}

      {/* Pending Invite Links */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pending Invite Links</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {pendingInvitations.map(inv => {
              const roleInfo = ROLE_LABELS[inv.role] ?? { label: inv.role, color: 'bg-slate-100 text-slate-600' }
              const portalLink = getPortalLink(inv.token)
              return (
                <div key={inv.id} className="px-4 py-3.5 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center justify-center text-sm font-bold shrink-0">
                      {getInitials(inv.target_name || '??')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{inv.target_name}</p>
                      <p className="text-xs text-muted-foreground">{inv.target_phone}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleInfo.color}`}>{roleInfo.label}</span>
                      <button onClick={() => handleDelete(inv.id, false, inv.target_name ?? undefined)}
                        className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors">Revoke</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-12">
                    <p className="flex-1 text-xs font-mono text-muted-foreground truncate">{portalLink}</p>
                    <a href={buildWA(inv.target_name ?? 'there', inv.token)} target="_blank" rel="noopener noreferrer"
                      className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:bg-[#20bd5a] transition-colors shrink-0"
                      title="Share via WhatsApp">{WA_ICON}</a>
                    <a href={portalLink} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium shrink-0">Open ↗</a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Staff Detail Modal — full-page style */}
      {detailMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailMember(null)} />
          <div className="relative w-full max-w-md bg-slate-50 dark:bg-slate-950 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Close button */}
            <button onClick={() => setDetailMember(null)} className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-md transition-colors">
              <X className="w-4 h-4" />
            </button>

            {/* Hero Header */}
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 shrink-0 relative">
              {/* Overlapping Avatar */}
              <div className="absolute -bottom-10 left-6">
                {(detailMember as any).photo_url ? (
                  <img src={(detailMember as any).photo_url} alt="" className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-50 dark:border-slate-950 shadow-sm" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-slate-900 border-4 border-slate-50 dark:border-slate-950 shadow-sm text-white flex items-center justify-center text-2xl font-bold">
                    {getInitials(detailMember.full_name)}
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pt-14 pb-6 space-y-6">
              {/* Header Info */}
              <div>
                <h2 className="text-2xl font-bold text-foreground">{detailMember.full_name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ROLE_LABELS[detailMember.role]?.color ?? 'bg-slate-200 text-slate-700'}`}>
                    {ROLE_LABELS[detailMember.role]?.label ?? detailMember.role}
                  </span>
                  <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    Active
                  </span>
                </div>
              </div>

              {/* Details Cards */}
              <div className="space-y-3">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Contact Details</p>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-foreground">{detailMember.phone_number}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Date of Admission</p>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-foreground">Joined {new Date(detailMember.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {detailInvite && (
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <button onClick={() => handleCopyLink(detailInvite.token)}
                      className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-foreground hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm bg-slate-50 dark:bg-slate-900">
                      {copiedToken === detailInvite.token ? <Check className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4" />}
                      {copiedToken === detailInvite.token ? 'Copied!' : 'Copy Link'}
                    </button>
                    <a href={buildWA(detailMember.full_name, detailInvite.token)} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-semibold transition-colors shadow-sm">
                      {WA_ICON} WhatsApp
                    </a>
                  </div>
                  <button onClick={() => handleDelete(detailInvite.id, true, detailMember.full_name)}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold transition-colors bg-white dark:bg-slate-900 shadow-sm">
                    <Trash2 className="w-4 h-4" />
                    Permanently Remove Staff
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <InviteStaffModal open={modalOpen} onClose={() => setModalOpen(false)} schoolId={schoolId} onSuccess={() => router.refresh()} />
      <ConfirmDialog {...dialogProps} />
    </div>
  )
}
