import React from 'react'

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }

  const variants = {
    primary: 'bg-[#D44720] hover:bg-[#B83A19] text-white focus:ring-[#D44720]',
    secondary: 'bg-[#786150] hover:bg-[#634F41] text-white focus:ring-[#786150]',
    mint: 'bg-[#ACCAB2] hover:bg-[#9BB8A1] text-slate-900 font-semibold focus:ring-[#ACCAB2]',
    amber: 'bg-[#EBA762] hover:bg-[#D99550] text-slate-900 font-semibold focus:ring-[#EBA762]',
    outline: 'border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
    ghost: 'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
