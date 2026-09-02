import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const AdminLoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { adminLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await adminLogin(email, password)
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid admin credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#D44720]/10 text-[#D44720] mb-2">
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Administrator Sign In</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Access the API Sentinel Management Console
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Admin Email"
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@sentinel.local"
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
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In to Admin Portal'}
        </Button>
      </form>

      <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4 text-center">
        <button
          type="button"
          onClick={() => navigate('/login/consumer')}
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          Switch to Consumer Key Access Portal &rarr;
        </button>
      </div>
    </Card>
  )
}
