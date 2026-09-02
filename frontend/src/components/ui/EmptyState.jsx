import React from 'react'
import { Inbox } from 'lucide-react'

export const EmptyState = ({
  title = 'No records found',
  description = 'There are no items matching your criteria at this time.',
  action,
  icon: Icon = Inbox,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-8 text-center my-4">
      <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 text-slate-400 mb-3">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
