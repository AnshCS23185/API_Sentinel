import React from 'react'

export const PageHeader = ({ title, subtitle, action, breadcrumbs = [] }) => {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {breadcrumbs.length > 0 && (
          <nav className="mb-1 text-xs text-slate-500 dark:text-slate-400">
            <ol className="flex items-center gap-1.5">
              {breadcrumbs.map((b, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  {idx > 0 && <span>/</span>}
                  <span className={idx === breadcrumbs.length - 1 ? 'font-medium text-slate-800 dark:text-slate-200' : ''}>
                    {b}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-normal">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
