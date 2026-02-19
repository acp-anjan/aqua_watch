import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, UserPlus, ChevronDown, CheckCircle2,
  XCircle, Pencil, ShieldCheck, Users,
} from 'lucide-react'

import { AppShell }  from '@/components/layout/AppShell'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { useAuth }   from '@/context/AuthContext'
import { useUserManagement } from '@/context/UserManagementContext'
import mockRegions from '@/mock/regions.json'
import type { UserRole, Region } from '@/types'

// ─── Role meta (exported so AddUserPage / EditUserPage can reuse) ─────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN:    'Super Admin',
  ADMIN:          'Admin',
  REGIONAL_ADMIN: 'Regional Admin',
  REGIONAL_USER:  'Regional User',
  ZONE_ADMIN:     'Zone Admin',
  ZONE_USER:      'Zone User',
}

const ROLE_COLOURS: Record<UserRole, string> = {
  SUPER_ADMIN:    'bg-purple-100 text-purple-700 ring-purple-200',
  ADMIN:          'bg-indigo-100 text-indigo-700 ring-indigo-200',
  REGIONAL_ADMIN: 'bg-blue-100 text-blue-700 ring-blue-200',
  REGIONAL_USER:  'bg-sky-100 text-sky-700 ring-sky-200',
  ZONE_ADMIN:     'bg-teal-100 text-teal-700 ring-teal-200',
  ZONE_USER:      'bg-slate-100 text-slate-600 ring-slate-200',
}

export function assignableRoles(myRole: UserRole): UserRole[] {
  if (myRole === 'SUPER_ADMIN') return Object.keys(ROLE_LABELS) as UserRole[]
  if (myRole === 'ADMIN')       return ['REGIONAL_ADMIN', 'REGIONAL_USER', 'ZONE_ADMIN', 'ZONE_USER']
  return []
}

export function canManage(myRole: UserRole, targetRole: UserRole): boolean {
  if (myRole === 'SUPER_ADMIN') return true
  if (myRole === 'ADMIN')       return targetRole !== 'SUPER_ADMIN' && targetRole !== 'ADMIN'
  return false
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusPill({ active, pending }: { active: boolean; pending: boolean }) {
  if (pending && !active)
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200">Pending</span>
  if (active)
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 ring-1 ring-inset ring-green-200"><CheckCircle2 size={11} />Active</span>
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 ring-1 ring-inset ring-red-200"><XCircle size={11} />Inactive</span>
}

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${ROLE_COLOURS[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  )
}

function ChangeRoleDropdown({
  userId, current, myRole, onChange,
}: { userId: string; current: UserRole; myRole: UserRole; onChange: (r: UserRole) => void }) {
  const [open, setOpen] = useState(false)
  const roles = assignableRoles(myRole)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors"
      >
        <ShieldCheck size={12} />
        Role <ChevronDown size={10} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 overflow-hidden">
            {roles.map(r => (
              <button
                key={r}
                onClick={() => { onChange(r); setOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center justify-between ${r === current ? 'font-semibold text-blue-700' : 'text-gray-700'}`}
              >
                {ROLE_LABELS[r]}
                {r === current && <CheckCircle2 size={11} className="text-blue-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['All', 'Active', 'Inactive', 'Pending'] as const
const ROLE_FILTER_OPTIONS: Array<UserRole | 'All'> = [
  'All', 'SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN', 'REGIONAL_USER', 'ZONE_ADMIN', 'ZONE_USER',
]

export function UserListPage() {
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const { users, toggleActive, changeRole } = useUserManagement()
  const allRegions = mockRegions as Region[]

  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_OPTIONS[number]>('All')
  const [roleFilter,   setRoleFilter]   = useState<UserRole | 'All'>('All')
  const [toast,        setToast]        = useState<string | null>(null)
  const [confirmDeact, setConfirmDeact] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter(u => {
      const matchQ = !q
        || u.fullName.toLowerCase().includes(q)
        || u.email.toLowerCase().includes(q)
        || u.username.toLowerCase().includes(q)

      const matchStatus =
        statusFilter === 'All'      ? true
        : statusFilter === 'Active'   ? (u.isActive && !u.mustResetPassword)
        : statusFilter === 'Inactive' ? (!u.isActive && !u.mustResetPassword)
        : /* Pending */                  (u.mustResetPassword && !u.isActive)

      const matchRole = roleFilter === 'All' || u.role === roleFilter

      return matchQ && matchStatus && matchRole
    })
  }, [users, search, statusFilter, roleFilter])

  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const regionName = (id: string) =>
    allRegions.find(r => r.regionId === id)?.regionName ?? id

  const myRole = me?.role ?? 'ZONE_USER'

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Breadcrumb items={[{ label: 'User Management' }]} />
            <h1 className="mt-2 text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500">Manage accounts, roles, and region access</p>
          </div>
          {canManage(myRole, 'ZONE_USER') && (
            <button
              onClick={() => navigate('/users/new')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition-colors"
            >
              <UserPlus size={16} />
              Add User
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Users',   value: users.length,                                                         colour: 'text-gray-900'  },
            { label: 'Active',        value: users.filter(u => u.isActive).length,                                 colour: 'text-green-700' },
            { label: 'Inactive',      value: users.filter(u => !u.isActive && !u.mustResetPassword).length,        colour: 'text-red-600'   },
            { label: 'Pending Setup', value: users.filter(u => u.mustResetPassword && !u.isActive).length,         colour: 'text-amber-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.colour}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters + Table card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search name, email, username…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Status filter buttons */}
            <div className="flex items-center gap-1">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as UserRole | 'All')}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            >
              {ROLE_FILTER_OPTIONS.map(r => (
                <option key={r} value={r}>{r === 'All' ? 'All Roles' : ROLE_LABELS[r as UserRole]}</option>
              ))}
            </select>

            <span className="ml-auto text-xs text-gray-400">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Regions</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Created</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Last Login</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                      <Users size={28} className="mx-auto mb-2 text-gray-300" />
                      No users match your filters
                    </td>
                  </tr>
                ) : filtered.map(u => {
                  const manageable = canManage(myRole, u.role) && u.userId !== me?.userId
                  return (
                    <tr key={u.userId} className="hover:bg-gray-50/50 transition-colors">
                      {/* User info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 select-none">
                            {u.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 leading-tight">{u.fullName}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                            <p className="text-xs text-gray-400 font-mono">@{u.username}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <RoleBadge role={u.role} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusPill active={u.isActive} pending={u.mustResetPassword} />
                      </td>

                      {/* Regions */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {u.regionAccess.map(rid => (
                            <span key={rid} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">
                              {regionName(rid)}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3.5 text-xs text-gray-500">{fmt(u.createdAt)}</td>

                      {/* Last Login */}
                      <td className="px-4 py-3.5 text-xs text-gray-500">{fmt(u.lastLoginAt)}</td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {manageable ? (
                            <>
                              {/* Activate / Deactivate with confirm */}
                              {u.isActive ? (
                                confirmDeact === u.userId ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-red-600 mr-1">Deactivate?</span>
                                    <button
                                      onClick={() => {
                                        toggleActive(u.userId)
                                        setConfirmDeact(null)
                                        showToast(`${u.fullName} deactivated.`)
                                      }}
                                      className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-0.5 border border-red-300 rounded-lg"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeact(null)}
                                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-0.5 border border-gray-200 rounded-lg"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeact(u.userId)}
                                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors"
                                  >
                                    <XCircle size={12} /> Deactivate
                                  </button>
                                )
                              ) : (
                                <button
                                  onClick={() => {
                                    toggleActive(u.userId)
                                    showToast(`${u.fullName} activated.`)
                                  }}
                                  className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg transition-colors"
                                >
                                  <CheckCircle2 size={12} /> Activate
                                </button>
                              )}

                              {/* Change Role dropdown */}
                              <ChangeRoleDropdown
                                userId={u.userId}
                                current={u.role}
                                myRole={myRole}
                                onChange={r => {
                                  changeRole(u.userId, r)
                                  showToast(`${u.fullName}'s role changed to ${ROLE_LABELS[r]}.`)
                                }}
                              />

                              {/* Edit */}
                              <button
                                onClick={() => navigate(`/users/${u.userId}/edit`)}
                                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors"
                              >
                                <Pencil size={12} /> Edit
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-300 italic">
                              {u.userId === me?.userId ? 'You' : 'No access'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
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
