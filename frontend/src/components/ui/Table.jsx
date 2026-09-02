import React from 'react'

export const Table = ({ headers, children, className = '' }) => {
  return (
    <div className={`w-full h-full flex flex-col min-h-0 overflow-hidden ${className}`}>
      <div className="overflow-x-auto flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="sticky top-0 bg-slate-100 dark:bg-[#182234] text-slate-700 dark:text-slate-300 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800/80 z-20 shadow-xs">
              <tr>
                {headers.map((h, idx) => (
                  <th key={idx} className="px-4 py-2.5 whitespace-nowrap bg-slate-100 dark:bg-[#182234] sticky top-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200">
              {children}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export const TableRow = ({ children, className = '', onClick }) => (
  <tr
    onClick={onClick}
    className={`hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors ${
      onClick ? 'cursor-pointer' : ''
    } ${className}`}
  >
    {children}
  </tr>
)

export const TableCell = ({ children, className = '' }) => (
  <td className={`px-4 py-2.5 whitespace-nowrap text-sm ${className}`}>{children}</td>
)
