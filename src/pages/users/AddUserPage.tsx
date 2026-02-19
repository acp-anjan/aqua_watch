import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Copy, RefreshCw, Eye, EyeOff, Check } from 'lucide-react'

import { AppShell }  from '@/components/layout/AppShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { useAuth }   from '@/context/AuthContext'
import { useUserManagement } from '@/context/UserManagementContext'
import { ROLE_LABELS, assignableRoles } from './UserListPage'
import mockRegions from '@/mock/regions.json'
import type { UserRole, Region } from '@/types'

// ─── Password generator ───────────────────────────────────────────────────────

const UPPER   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER   = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS  = '0123456789'
const SPECIAL = '!@#$%^&*'
const ALL     = UPPER + LOWER + DIGITS + SPECIAL

function generatePassword(): string {
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)]
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SPECIAL)]
  for (let i = 4; i < 8; i++) chars.push(pick(ALL))
  // Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

// ─── Form field wrapper ───────────────────────────────────────────────────────

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

const INPUT = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition'

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AddUserPage() {
  const navigate  = useNavigate()
  const { user: me } = useAuth()
  const { addUser } = useUserManagement()
  const myRole    = me?.role ?? 'ADMIN'
  const allRegions = mockRegions as Region[]
  const roles     = assignableRoles(myRole)

  const [form, setForm] = useState({
    fullName:     '',
    email:        '',
    username:     '',
    role:         (roles[0] ?? 'ZONE_USER') as UserRole,
    regionAccess: [] as string[],
  })
  const [password,    setPassword]    = useState(() => generatePassword())
  const [showPwd,     setShowPwd]     = useState(false)
  const [copied,      setCopied]      = useState(false)
  const [errors,      setErrors]      = useState<Record<string, string>>({})
  const [submitting,  setSubmitting]  = useState(false)
  const [toast,       setToast]       = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const toggleRegion = (rid: string) =>
    set('regionAccess', form.regionAccess.includes(rid)
      ? form.regionAccess.filter(r => r !== rid)
      : [...form.regionAccess, rid]
    )

  const regen = useCallback(() => {
    setPassword(generatePassword())
    setCopied(false)
  }, [])

  const copyPwd = useCallback(() => {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [password])

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim())  e.fullName = 'Full name is required.'
    if (!form.email.trim())     e.email    = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address.'
    if (!form.username.trim())  e.username = 'Username is required.'
    else if (/\s/.test(form.username)) e.username = 'Username must not contain spaces.'
    if (form.regionAccess.length === 0) e.regionAccess = 'Select at least one region.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))
    addUser({
      fullName:          form.fullName.trim(),
      email:             form.email.trim().toLowerCase(),
      username:          form.username.trim().toLowerCase(),
      role:              form.role,
      isActive:          false,
      mustResetPassword: true,
      regionAccess:      form.regionAccess,
    })
    setSubmitting(false)
    showToast(`✅ User "${form.fullName}" created. They must reset their password on first login.`)
    setTimeout(() => navigate('/users'), 1200)
  }

  return (
    <AppShell>
      <div className="max-w-2xl space-y-5">
        {/* Header */}
        <div>
          <Breadcrumb items={[
            { label: 'User Management', path: '/users' },
            { label: 'Add User' },
          ]} />
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Add User</h1>
          <p className="text-sm text-gray-500">Create a new user account. The generated password must be shared securely with the user.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {/* Personal info section */}
          <div className="px-6 py-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">Personal Information</h2>

            <Field label="Full Name" required error={errors.fullName}>
              <input
                className={INPUT}
                placeholder="e.g. Jane Smith"
                value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Email Address" required error={errors.email}>
                <input
                  type="email"
                  className={INPUT}
                  placeholder="user@example.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
              </Field>

              <Field label="Username" required error={errors.username}>
                <input
                  className={INPUT}
                  placeholder="e.g. jsmith"
                  value={form.username}
                  onChange={e => set('username', e.target.value)}
                />
              </Field>
            </div>
          </div>

          {/* Role & Access section */}
          <div className="px-6 py-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">Role &amp; Access</h2>

            <Field label="Role" required>
              <select
                className={INPUT}
                value={form.role}
                onChange={e => set('role', e.target.value as UserRole)}
              >
                {roles.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </Field>

            <Field label="Region Access" required error={errors.regionAccess}>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {allRegions.map(r => (
                  <label
                    key={r.regionId}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                      form.regionAccess.includes(r.regionId)
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.regionAccess.includes(r.regionId)}
                      onChange={() => toggleRegion(r.regionId)}
                      className="accent-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.regionName}</p>
                      <p className="text-xs text-gray-400">{r.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Field>
          </div>

          {/* Generated password section */}
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound size={15} className="text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-800">Generated Password</h2>
            </div>
            <p className="text-xs text-gray-500">
              This password is auto-generated. Copy and share it securely — the user will be prompted to change it on first login.
            </p>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  readOnly
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  className="w-full font-mono text-sm border border-gray-200 rounded-xl px-3 py-2 pr-10 bg-gray-50 focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <button
                type="button"
                onClick={copyPwd}
                className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border transition-colors ${
                  copied
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>

              <button
                type="button"
                onClick={regen}
                title="Regenerate password"
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
              >
                <RefreshCw size={14} />
                Regenerate
              </button>
            </div>

            {/* strength indicator */}
            <div className="flex gap-1 mt-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full bg-green-400" />
              ))}
              <span className="text-xs text-green-600 ml-1">Strong</span>
            </div>
          </div>

          {/* Form actions */}
          <div className="px-6 py-4 flex items-center justify-end gap-3 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-xl shadow-sm transition-colors"
            >
              {submitting ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-3 max-w-sm">
          {toast}
        </div>
      )}
    </AppShell>
  )
}
