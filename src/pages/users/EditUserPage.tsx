import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

import { AppShell }  from '@/components/layout/AppShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { useAuth }   from '@/context/AuthContext'
import { useUserManagement } from '@/context/UserManagementContext'
import { ROLE_LABELS, RoleBadge, assignableRoles, canManage } from './UserListPage'
import mockRegions from '@/mock/regions.json'
import type { UserRole, Region } from '@/types'

// ─── Shared field wrapper (duplicate here to keep pages self-contained) ────────

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
const INPUT_DISABLED = 'w-full border border-gray-100 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed'

// ─── Page ─────────────────────────────────────────────────────────────────────

export function EditUserPage() {
  const { userId }   = useParams<{ userId: string }>()
  const navigate     = useNavigate()
  const { user: me } = useAuth()
  const { getUserById, updateUser } = useUserManagement()
  const myRole       = me?.role ?? 'ADMIN'
  const allRegions   = mockRegions as Region[]

  const target = getUserById(userId ?? '')

  const [form, setForm] = useState({
    fullName:     target?.fullName   ?? '',
    email:        target?.email      ?? '',
    username:     target?.username   ?? '',
    role:         (target?.role      ?? 'ZONE_USER') as UserRole,
    regionAccess: target?.regionAccess ?? [] as string[],
    isActive:     target?.isActive   ?? false,
  })
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [toast,      setToast]      = useState<string | null>(null)

  // Sync if context updates (e.g. navigation back-forth)
  useEffect(() => {
    if (!target) return
    setForm({
      fullName:     target.fullName,
      email:        target.email,
      username:     target.username,
      role:         target.role,
      regionAccess: target.regionAccess,
      isActive:     target.isActive,
    })
  }, [target?.userId])

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

  const manageable = target ? canManage(myRole, target.role) : false
  const assignable = assignableRoles(myRole)

  // Not found
  if (!target) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-3">
          <ShieldAlert size={40} className="text-gray-300" />
          <p className="text-lg font-semibold">User not found</p>
          <button onClick={() => navigate('/users')} className="text-sm text-blue-600 hover:underline">
            Back to User Management
          </button>
        </div>
      </AppShell>
    )
  }

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
    updateUser(target.userId, {
      fullName:     form.fullName.trim(),
      email:        form.email.trim().toLowerCase(),
      username:     form.username.trim().toLowerCase(),
      role:         form.role,
      regionAccess: form.regionAccess,
      isActive:     form.isActive,
    })
    setSubmitting(false)
    showToast(`✅ ${form.fullName} updated successfully.`)
    setTimeout(() => navigate('/users'), 1000)
  }

  return (
    <AppShell>
      <div className="max-w-2xl space-y-5">
        {/* Header */}
        <div>
          <Breadcrumb items={[
            { label: 'User Management', path: '/users' },
            { label: `Edit — ${target.fullName}` },
          ]} />
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
            <RoleBadge role={target.role} />
          </div>
          <p className="text-sm text-gray-500">@{target.username} · {target.email}</p>
        </div>

        {!manageable && (
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
            <span>You do not have permission to edit this user's account. Contact a Super Admin.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {/* Personal info */}
          <div className="px-6 py-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">Personal Information</h2>

            <Field label="Full Name" required error={errors.fullName}>
              <input
                disabled={!manageable}
                className={manageable ? INPUT : INPUT_DISABLED}
                value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Email Address" required error={errors.email}>
                <input
                  type="email"
                  disabled={!manageable}
                  className={manageable ? INPUT : INPUT_DISABLED}
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
              </Field>
              <Field label="Username" required error={errors.username}>
                <input
                  disabled={!manageable}
                  className={manageable ? INPUT : INPUT_DISABLED}
                  value={form.username}
                  onChange={e => set('username', e.target.value)}
                />
              </Field>
            </div>
          </div>

          {/* Role & access */}
          <div className="px-6 py-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">Role &amp; Access</h2>

            <Field label="Role" required>
              <select
                disabled={!manageable}
                className={manageable ? INPUT : INPUT_DISABLED}
                value={form.role}
                onChange={e => set('role', e.target.value as UserRole)}
              >
                {/* Always show the current role even if not in assignable list */}
                {(assignable.includes(form.role) ? assignable : [form.role, ...assignable]).map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </Field>

            <Field label="Region Access" required error={errors.regionAccess}>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {allRegions.map(r => (
                  <label
                    key={r.regionId}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors ${
                      !manageable
                        ? 'opacity-60 cursor-not-allowed border-gray-100 bg-gray-50'
                        : form.regionAccess.includes(r.regionId)
                          ? 'border-blue-400 bg-blue-50 cursor-pointer'
                          : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={!manageable}
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

          {/* Account status toggle */}
          <div className="px-6 py-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Account Status</h2>
            <label className={`flex items-center gap-3 p-3 rounded-xl border transition-colors w-fit ${manageable ? 'cursor-pointer hover:bg-gray-50 border-gray-200' : 'opacity-60 cursor-not-allowed border-gray-100'}`}>
              <div className={`relative inline-flex w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <input
                type="checkbox"
                disabled={!manageable}
                checked={form.isActive}
                onChange={e => set('isActive', e.target.checked)}
                className="sr-only"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">{form.isActive ? 'Active' : 'Inactive'}</p>
                <p className="text-xs text-gray-400">
                  {form.isActive ? 'User can sign in.' : 'User is blocked from signing in.'}
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 flex items-center justify-between bg-gray-50 rounded-b-2xl">
            <p className="text-xs text-gray-400">User ID: {target.userId} · Created {new Date(target.createdAt).toLocaleDateString()}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {manageable && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-xl shadow-sm transition-colors"
                >
                  {submitting ? 'Saving…' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-3">
          {toast}
        </div>
      )}
    </AppShell>
  )
}
