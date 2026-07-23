'use client'

import { useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/utils/formatting'

interface ChartData {
  month: string
  revenue: number
}

interface Props {
  data: ChartData[]
}

export function AdminRevenueChart({ data }: Props) {
  const [hoveredData, setHoveredData] = useState<ChartData | null>(null)

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col group">
      <div className="px-6 py-6 border-b border-border bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/20">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          Platform Revenue (6m)
        </h2>
        <p className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2 transition-all">
          {hoveredData ? formatCurrency(hoveredData.revenue) : formatCurrency(totalRevenue)}
          <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
            {hoveredData ? hoveredData.month : 'Total'}
          </span>
        </p>
      </div>

      <div className="flex-1 p-6 relative">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={data} 
              onMouseMove={(e: any) => {
                if (e.activePayload && e.activePayload.length > 0) {
                  setHoveredData(e.activePayload[0].payload)
                }
              }}
              onMouseLeave={() => setHoveredData(null)}
              margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(val: number) => `KSh ${(val / 1000).toFixed(0)}k`}
                dx={-10}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 shadow-xl shadow-slate-900/20 text-white animate-in zoom-in-95 duration-200">
                        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">{payload[0].payload.month}</p>
                        <p className="text-2xl font-bold tracking-tight text-white">{formatCurrency(payload[0].value as number)}</p>
                      </div>
                    )
                  }
                  return null
                }}
                cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
