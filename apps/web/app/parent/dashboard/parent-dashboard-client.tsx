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

export function ParentDashboardClient({ childrenList }: { childrenList: any[] }) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parent Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor academic progress and fee balances.</p>
        </div>
        
        {childrenList.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-2 h-11 px-4 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  {selectedChild.first_name[0]}
                </div>
                <span>{selectedChild.first_name} {selectedChild.last_name}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fees Widget */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-emerald-50 font-medium mb-1 relative z-10">Current Fee Balance</p>
          <h3 className="text-3xl font-bold text-white relative z-10">KES 12,500</h3>
          
          <Button className="w-full mt-6 bg-white hover:bg-slate-50 text-emerald-700 font-bold rounded-xl shadow-sm relative z-10">
            Pay via M-Pesa STK
          </Button>
        </div>

        {/* Academics Widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-1">Recent Exam: Mid Term 2</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-foreground">A-</h3>
            <span className="text-sm font-semibold text-emerald-600">Top 15%</span>
          </div>
          
          <Button variant="outline" className="w-full mt-6 font-semibold rounded-xl border-slate-200 dark:border-slate-800">
            View Full Report Card
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-amber-500" />
          Recent Notifications
        </h2>
        <div className="space-y-4">
          <div className="border-l-2 border-emerald-500 pl-4 py-1">
            <p className="text-sm font-medium text-foreground">Payment Received</p>
            <p className="text-xs text-muted-foreground mt-0.5">We received KES 5,000 for {selectedChild.first_name}'s fees. Thank you.</p>
          </div>
          <div className="border-l-2 border-blue-500 pl-4 py-1">
            <p className="text-sm font-medium text-foreground">End of Term Notice</p>
            <p className="text-xs text-muted-foreground mt-0.5">School will close on Friday 28th for the August holidays.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
