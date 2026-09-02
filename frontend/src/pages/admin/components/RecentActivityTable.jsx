import React from 'react'
import { Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Table, TableRow, TableCell } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'

export const RecentActivityTable = ({ requests = [] }) => {
  const navigate = useNavigate()

  const list = requests.map(r => ({
    time: new Date(r.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    consumer: r.consumer_name || 'Consumer',
    endpoint: r.path || '/api',
    method: r.method || 'GET',
    status: r.status_code || 200,
    latency: r.response_time_ms ? `${r.response_time_ms} ms` : '-',
    ip: r.ip_address || '127.0.0.1',
  }))

  const getStatusBadge = (code) => {
    if (code >= 200 && code < 300) return <Badge variant="success" size="sm" className="font-mono text-[9px] px-1.5 py-0.5 font-bold">{code}</Badge>
    if (code >= 300 && code < 400) return <Badge variant="neutral" size="sm" className="font-mono text-[9px] px-1.5 py-0.5 font-bold">{code}</Badge>
    if (code === 429) return <Badge variant="danger" size="sm" className="font-mono text-[9px] px-1.5 py-0.5 font-bold">{code}</Badge>
    if (code >= 400 && code < 500) return <Badge variant="warning" size="sm" className="font-mono text-[9px] px-1.5 py-0.5 font-bold">{code}</Badge>
    return <Badge variant="danger" size="sm" className="font-mono text-[9px] px-1.5 py-0.5 font-bold">{code}</Badge>
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-3.5 shadow-xs flex flex-col justify-between h-[215px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-[#ACCAB2]" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Recent API Activity</h3>
        </div>
        <button
          onClick={() => navigate('/admin/analytics')}
          className="rounded-md border border-slate-200 dark:border-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          View All Activity
        </button>
      </div>

      {/* Hidden Scrollbar Container */}
      <div className="flex-1 overflow-y-auto max-h-[155px] no-scrollbar">
        <Table headers={['Time', 'Consumer', 'Endpoint', 'Method', 'Status', 'Response Time', 'IP Address']}>
          {list.map((r, idx) => (
            <TableRow key={idx}>
              <TableCell className="font-mono text-[10px] text-slate-600 dark:text-slate-400 font-medium py-1.5">{r.time}</TableCell>
              <TableCell className="font-bold text-slate-900 dark:text-slate-100 py-1.5 text-xs">{r.consumer}</TableCell>
              <TableCell className="font-mono text-[10px] text-slate-700 dark:text-slate-400 font-semibold py-1.5">{r.endpoint}</TableCell>
              <TableCell className="py-1.5">
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono ${
                  r.method === 'GET' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-orange-500/15 text-orange-700 dark:text-orange-400'
                }`}>
                  {r.method}
                </span>
              </TableCell>
              <TableCell className="py-1.5">{getStatusBadge(r.status)}</TableCell>
              <TableCell className="font-mono text-[10px] text-slate-800 dark:text-slate-300 font-semibold py-1.5">{r.latency}</TableCell>
              <TableCell className="font-mono text-[10px] text-slate-600 dark:text-slate-400 font-medium py-1.5">{r.ip}</TableCell>
            </TableRow>
          ))}
        </Table>
      </div>
    </div>
  )
}
