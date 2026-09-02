import React, { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Activity } from 'lucide-react'

export const RequestVolumeChart = ({ timeSeriesData, interval = 'day', onIntervalChange }) => {
  const chartData = useMemo(() => {
    const rawPoints = timeSeriesData?.points

    if (Array.isArray(rawPoints) && rawPoints.length > 0) {
      return rawPoints.map(p => {
        const d = new Date(p.timestamp)
        const label = interval === 'hour'
          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
        return {
          label,
          requests: p.request_count,
        }
      })
    }

    return []
  }, [timeSeriesData, interval])

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-3 shadow-xs flex flex-col justify-between h-[215px]">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-[#D44720]" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Request Volume Trend</h3>
        </div>
        <select
          value={interval}
          onChange={(e) => onIntervalChange && onIntervalChange(e.target.value)}
          className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="day">By Day</option>
          <option value="hour">By Hour</option>
        </select>
      </div>

      <div className="h-[155px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EBA762" stopOpacity={0.55} />
                <stop offset="95%" stopColor="#D44720" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F2937" opacity={0.3} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              dy={4}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#1E293B',
                borderRadius: '0.5rem',
                color: '#F8FAFC',
                fontSize: '11px',
                padding: '6px 10px',
              }}
              formatter={(value) => [value.toLocaleString(), 'Requests']}
            />
            <Area
              type="monotone"
              dataKey="requests"
              stroke="#EBA762"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#volumeGradient)"
              dot={{ r: 3, fill: '#EBA762', strokeWidth: 1.5, stroke: '#111827' }}
              activeDot={{ r: 5, fill: '#D44720' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
