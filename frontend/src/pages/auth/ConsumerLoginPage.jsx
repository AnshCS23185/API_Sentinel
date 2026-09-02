import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Key, Check, ShieldCheck, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export const ConsumerLoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Password Reset Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showResetPass, setShowResetPass] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(null)
  const [resetError, setResetError] = useState(null)
  const [resetSubmitting, setResetSubmitting] = useState(false)

  const { consumerLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (!email.includes('@')) {
        throw new Error('Please enter a valid consumer email address.')
      }
      if (!password || password.length < 4) {
        throw new Error('Please enter your consumer password.')
      }
      await consumerLogin(email, password)
      navigate('/consumer')
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Fill Demo Credentials
  const handleFillDemo = () => {
    setEmail('consumer@acmecorp.com')
    setPassword('TempPass9824!')
    setError(null)
  }

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = (e) => {
    e.preventDefault()
    setResetError(null)
    setResetSuccess(null)

    if (!resetEmail.includes('@')) {
      setResetError('Please enter your consumer email address.')
      return
    }
    if (newPass.length < 6) {
      setResetError('New password must be at least 6 characters long.')
      return
    }
    if (newPass !== confirmPass) {
      setResetError('New password and confirmation do not match.')
      return
    }

    setResetSubmitting(true)
    setTimeout(() => {
      setResetSubmitting(false)
      setResetSuccess('Password updated successfully! You can now sign in with your new password.')
      setEmail(resetEmail)
      setPassword(newPass)
      setTimeout(() => {
        setResetModalOpen(false)
        setResetSuccess(null)
        setResetEmail('')
        setCurrentPass('')
        setNewPass('')
        setConfirmPass('')
      }, 2000)
    }, 800)
  }

  return (
    <Card className="p-6 max-w-md mx-auto shadow-xl border border-slate-200 dark:border-slate-800">
      <div className="text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#EBA762]/20 text-[#D44720] mb-2">
          <User className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Consumer Portal Access</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Sign in with your email & password dispatched by administrator
        </p>
      </div>

      {/* Demo Credentials Quick Fill Banner */}
      <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/40 p-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
        <div>
          <p className="font-bold text-[11px]">Demo Consumer Account:</p>
          <p className="font-mono text-[10px] text-amber-700 dark:text-amber-300">consumer@acmecorp.com / TempPass9824!</p>
        </div>
        <button
          type="button"
          onClick={handleFillDemo}
          className="px-2 py-1 bg-amber-500 text-white rounded-md text-[10px] font-bold hover:bg-amber-600 transition-colors shrink-0"
        >
          Fill Demo
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/60 p-3 text-xs font-semibold text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Consumer Email"
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="consumer@acmecorp.com"
          required
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          required
          rightAction={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4 text-[#D44720]" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">Password sent to your email on creation</span>
          <button
            type="button"
            onClick={() => {
              setResetEmail(email)
              setResetModalOpen(true)
            }}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            Reset Password?
          </button>
        </div>

        <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In to Consumer Portal'}
        </Button>
      </form>

      <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4 text-center">
        <button
          type="button"
          onClick={() => navigate('/login/admin')}
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          Administrator Sign In &rarr;
        </button>
      </div>

      {/* CONSUMER RESET PASSWORD MODAL */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Consumer Password"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleResetPasswordSubmit} disabled={resetSubmitting}>
              {resetSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
          {resetError && (
            <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/60 p-2.5 text-xs font-semibold text-red-700 dark:text-red-300">
              {resetError}
            </div>
          )}

          {resetSuccess && (
            <div className="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 p-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>{resetSuccess}</span>
            </div>
          )}

          <p className="text-slate-500 dark:text-slate-400">
            Enter your initial temporary password sent via email, then choose a new password of your choice.
          </p>

          <Input
            label="Consumer Email"
            type="email"
            icon={Mail}
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="consumer@acmecorp.com"
            required
          />

          <Input
            label="Temporary / Current Password"
            type={showResetPass ? 'text' : 'password'}
            icon={Lock}
            value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
            placeholder="TempPass9824!"
            required
            rightAction={
              <button
                type="button"
                onClick={() => setShowResetPass(!showResetPass)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              >
                {showResetPass ? <EyeOff className="h-4 w-4 text-[#D44720]" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <Input
            label="New Password"
            type={showResetPass ? 'text' : 'password'}
            icon={Lock}
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="Enter new password (min 6 chars)"
            required
          />

          <Input
            label="Confirm New Password"
            type={showResetPass ? 'text' : 'password'}
            icon={Lock}
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            placeholder="Confirm new password"
            required
          />
        </form>
      </Modal>
    </Card>
  )
}
