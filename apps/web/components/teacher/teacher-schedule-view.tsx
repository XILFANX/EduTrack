'use client'

import { CalendarDays, Coffee, Clock, BookOpen } from 'lucide-react'

const DAYS = [
  { num: 1, label: 'Monday',    short: 'Mon' },
  { num: 2, label: 'Tuesday',   short: 'Tue' },
  { num: 3, label: 'Wednesday', short: 'Wed' },
  { num: 4, label: 'Thursday',  short: 'Thu' },
  { num: 5, label: 'Friday',    short: 'Fri' },
]

const DAY_COLORS: Record<number, string> = {
  1: 'from-blue-500 to-blue-600',
  2: 'from-indigo-500 to-indigo-600',
  3: 'from-violet-500 to-violet-600',
  4: 'from-purple-500 to-purple-600',
  5: 'from-fuchsia-500 to-fuchsia-600',
}

function fmt12(time24: string) {
  if (!time24) return ''
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

function isToday(dayNum: number) {
  const today = new Date().getDay() // 0=Sun,1=Mon...
  return today === dayNum
}

interface Period { id: string; name: string; start_time: string; end_time: string; is_break: boolean; sort_order: number }
interface Slot {
  period_id: string
  day_of_week: number
  subject_id: string | null
  class_id: string
  timetable_periods: Period | null
  subjects: { name: string } | null
  classes: { name: string } | null
}

interface Props {
  periods: Period[]
  slots: Slot[]
  roleName: string
}

export function TeacherScheduleView({ periods, slots, roleName }: Props) {
  // Build slot map: period_id-day -> slot
  const slotMap: Record<string, Slot[]> = {}
  for (const slot of slots) {
    const key = `${slot.period_id}-${slot.day_of_week}`
    if (!slotMap[key]) slotMap[key] = []
    slotMap[key].push(slot)
  }

  // Today's schedule
  const todayNum = new Date().getDay() // 1=Mon...5=Fri
  const todaySlots = slots
    .filter(s => s.day_of_week === todayNum && !s.timetable_periods?.is_break)
    .sort((a, b) => (a.timetable_periods?.start_time || '').localeCompare(b.timetable_periods?.start_time || ''))

  if (periods.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-3xl">
        <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <h3 className="font-semibold text-foreground">No Timetable Set Up</h3>
        <p className="text-sm text-muted-foreground mt-1">Your administrator hasn't set up the timetable yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Today's Schedule Card */}
      {todayNum >= 1 && todayNum <= 5 && (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 opacity-80" />
            <p className="text-sm font-semibold opacity-90">Today's Schedule · {DAYS.find(d => d.num === todayNum)?.label}</p>
          </div>
          {todaySlots.length === 0 ? (
            <p className="text-sm text-white/70">No classes scheduled for today.</p>
          ) : (
            <div className="space-y-2">
              {todaySlots.map((slot, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
                  <BookOpen className="w-4 h-4 opacity-80 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{slot.subjects?.name || 'Free Period'}</p>
                    <p className="text-xs text-white/70">{slot.classes?.name} · {fmt12(slot.timetable_periods?.start_time || '')}–{fmt12(slot.timetable_periods?.end_time || '')}</p>
                  </div>
                  <span className="text-xs bg-white/20 rounded-lg px-2 py-0.5 font-medium">{slot.timetable_periods?.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full weekly grid */}
      <div>
        <p className="text-sm font-semibold text-muted-foreground mb-3">Full Week View</p>
        <div className="overflow-x-auto rounded-3xl border border-border shadow-sm bg-card">
          <table className="w-full min-w-[600px] text-sm border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-r border-border px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider min-w-[140px]">
                  Period
                </th>
                {DAYS.map(day => (
                  <th key={day.num} className="border-b border-r border-border px-3 py-3 text-center last:border-r-0">
                    <div className={`inline-flex flex-col items-center px-3 py-1 rounded-xl bg-gradient-to-b ${DAY_COLORS[day.num]} ${isToday(day.num) ? 'ring-2 ring-white ring-offset-1' : ''} text-white text-xs font-semibold min-w-[70px]`}>
                      <span className="hidden sm:block">{day.label}</span>
                      <span className="sm:hidden">{day.short}</span>
                      {isToday(day.num) && <span className="text-[9px] opacity-80">Today</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period, idx) => (
                <tr key={period.id} className={idx % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-900/20'}>
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-950 border-b border-r border-border px-4 py-3">
                    <div className="flex items-center gap-2">
                      {period.is_break ? <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" /> : <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      <div>
                        <p className="font-semibold text-xs text-foreground">{period.name}</p>
                        <p className="text-[10px] text-muted-foreground">{fmt12(period.start_time)}–{fmt12(period.end_time)}</p>
                      </div>
                    </div>
                  </td>
                  {DAYS.map(day => {
                    const daySlots = slotMap[`${period.id}-${day.num}`] || []

                    return (
                      <td key={day.num} className="border-b border-r border-border last:border-r-0 p-1.5">
                        {period.is_break ? (
                          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 px-2 py-3 text-center">
                            <Coffee className="w-3.5 h-3.5 text-amber-400 mx-auto" />
                          </div>
                        ) : daySlots.length > 0 ? (
                          <div className="space-y-1">
                            {daySlots.map((slot, si) => (
                              <div key={si} className={`rounded-xl px-2 py-2 text-center text-xs font-semibold border ${isToday(day.num) ? 'ring-1 ring-indigo-400' : ''} bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-800/50 dark:text-indigo-300`}>
                                <p>{slot.subjects?.name || '—'}</p>
                                {slot.classes?.name && <p className="text-[10px] opacity-70 mt-0.5">{slot.classes.name}</p>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 px-2 py-3 text-center">
                            <span className="text-[10px] text-muted-foreground">—</span>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
