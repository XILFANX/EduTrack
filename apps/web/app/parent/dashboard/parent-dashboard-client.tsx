'use client'

import { useState } from 'react'
import { User, Wallet, Bell, GraduationCap, ChevronDown, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ParentDashboardClient({ childrenList, recentPayments }: { childrenList: any[], recentPayments: any[] }) {
  const [selectedChild, setSelectedChild] = useState(childrenList[0])

  if (!selectedChild) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground">No Children Linked</h2>
        <p className="text-sm text-muted-foreground mt-2">Please contact the school administrator to link your account.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black">Parent Dashboard</h1>
              <p className="text-sm text-blue-100">Monitor academic progress and fee balances</p>
            </div>
          </div>
          
          {childrenList.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20 text-white gap-2 h-11 px-4 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">
                    {selectedChild.first_name[0]}
                  </div>
                  <span>{selectedChild.first_name} {selectedChild.last_name}</span>
                  <ChevronDown className="w-4 h-4 text-white/70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                {childrenList.map((child) => (
                  <DropdownMenuItem 
                    key={child.id}
                    onClick={() => setSelectedChild(child)}
                    className="gap-3 cursor-pointer py-2.5"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-xs font-bold">
                      {child.first_name[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{child.first_name} {child.last_name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{child.class_name}</span>
                    </div>
                    {selectedChild.id === child.id && <CheckCircle2 className="w-4 h-4 text-blue-600 ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 mt-2">QUICK ACTIONS</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/parent/payments', label: 'Pay Fees', sublabel: 'Clear balances', icon: Wallet },
            { href: '/parent/academics', label: 'Academics', sublabel: 'View reports', icon: GraduationCap },
            { href: '/parent/messages', label: 'Messages', sublabel: 'School comms', icon: Bell },
            { href: '/parent/attendance', label: 'Attendance', sublabel: 'Daily logs', icon: CheckCircle2 },
          ].map(({ href, label, sublabel, icon: Icon }) => (
            <div
              key={href}
              onClick={() => window.location.href = href}
              className="flex flex-col items-center gap-2 p-4 bg-card hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-border hover:border-blue-500/50 rounded-2xl hover:scale-[1.02] transition-all text-center shadow-sm cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-800/40 transition-colors">
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-center min-w-0 w-full mt-1">
                <p className="font-bold text-xs text-foreground truncate">{label}</p>
                <p className="text-[10px] text-muted-foreground truncate hidden sm:block mt-0.5">{sublabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fees Widget */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-1">Current Fee Balance</p>
          <h3 className="text-3xl font-bold text-foreground">KES 12,500</h3>
        </div>

        {/* Academics Widget */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-1">Recent Exam: Mid Term 2</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-foreground">A-</h3>
            <span className="text-sm font-semibold text-blue-600">Top 15%</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-orange-500" />
          Recent Payments
        </h2>
        {recentPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No payment history found.</p>
        ) : (
          <div className="space-y-4">
            {recentPayments.slice(0, 3).map((p, i) => (
              <div key={i} className="border-l-2 border-blue-500 pl-4 py-1">
                <p className="text-sm font-medium text-foreground">KES {Number(p.amount).toLocaleString()} Received</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(p.payment_date).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
                  {p.mpesa_receipt && <span className="font-mono ml-2 text-blue-600">#{p.mpesa_receipt}</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
