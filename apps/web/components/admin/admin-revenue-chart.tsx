'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function AdminRevenueChart({ data }: { data: { month: string, revenue: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-[#060d1a]/80 border border-border rounded-3xl p-6 h-80 flex flex-col items-center justify-center text-center shadow-sm">
        <p className="text-muted-foreground font-semibold">No revenue data available.</p>
      </div>
    )
  }

  const formatKES = (value: number) => {
    if (value >= 1000000) return `KSh ${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `KSh ${(value / 1000).toFixed(1)}K`
    return `KSh ${value}`
  }

  return (
    <div className="bg-white dark:bg-[#060d1a]/80 border border-border rounded-3xl p-6 h-96 flex flex-col shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-24 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.1)_0%,_transparent_70%)] pointer-events-none opacity-50" />
      <h2 className="text-base font-extrabold text-foreground mb-6 relative z-10">Platform Revenue (Last 6 Months)</h2>
      <div className="flex-1 min-h-0 relative z-10 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--foreground)' }} dy={10} />
            <YAxis tickFormatter={formatKES} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--foreground)' }} />
            <Tooltip
              cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
              contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
              labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold', marginBottom: '4px' }}
              formatter={(val: any) => [`KSh ${Number(val || 0).toLocaleString()}`, 'Revenue']}
            />
            <Bar dataKey="revenue" fill="url(#colorRev)" radius={[6, 6, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
