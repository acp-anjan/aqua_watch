import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Droplets } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button }  from '@/components/ui/button'
import { Input }   from '@/components/ui/input'
import { Label }   from '@/components/ui/label'

export function LoginPage() {
  const { login, user } = useAuth()
  const navigate        = useNavigate()

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  // If already logged in, redirect
  if (user) {
    navigate(user.mustResetPassword ? '/password-reset' : '/region-select', { replace: true })
    return null
  }

  const validate = () => {
    const errs: typeof fieldErrors = {}
    if (!email.trim())    errs.email    = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email'
    if (!password.trim()) errs.password = 'Password is required'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setLoading(true)
    const result = await login(email.trim(), password)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Login failed')
      return
    }

    // Check if fresh user needs password reset
    const storedRaw = sessionStorage.getItem('aw_user')
    const stored    = storedRaw ? JSON.parse(storedRaw) : null
    if (stored?.mustResetPassword) {
      navigate('/password-reset', { replace: true })
    } else {
      navigate('/region-select', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-4">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200 mb-4">
              <Droplets className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">AquaWatch</h1>
            <p className="mt-1 text-sm text-gray-500">Water Meter Management Dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="px-8 pb-8 space-y-4">
            {/* Global error */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: undefined })) }}
                error={fieldErrors.email}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })) }}
                  error={fieldErrors.password}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full mt-2" loading={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>

            {/* Hint */}
            <p className="text-center text-xs text-gray-400 pt-2">
              Demo: <code className="bg-gray-100 px-1 rounded">admin@system.com</code> /{' '}
              <code className="bg-gray-100 px-1 rounded">Admin1234@</code>
            </p>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          AquaWatch Dashboard · UI Prototype · v0.1
        </p>
      </div>
    </div>
  )
}
