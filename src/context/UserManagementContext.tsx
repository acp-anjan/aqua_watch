import {
  createContext, useContext, useState, useCallback, type ReactNode,
} from 'react'
import type { User, UserRole } from '@/types'
import seedUsers from '@/mock/users.json'

const STORAGE_KEY = 'aw_users'

function loadUsers(): User[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored) as User[]
  } catch { /* ignore */ }
  return seedUsers as User[]
}

function saveUsers(users: User[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  } catch { /* ignore */ }
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface UserManagementContextValue {
  users:          User[]
  getUserById:    (id: string) => User | undefined
  addUser:        (u: Omit<User, 'userId' | 'createdAt' | 'lastLoginAt'>) => User
  updateUser:     (userId: string, patch: Partial<Omit<User, 'userId' | 'createdAt'>>) => void
  toggleActive:   (userId: string) => void
  changeRole:     (userId: string, role: UserRole) => void
  deleteUser:     (userId: string) => void
}

const UserManagementContext = createContext<UserManagementContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

let uidCounter = 100   // ensures uniqueness for in-session new users

export function UserManagementProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => loadUsers())

  const persist = (next: User[]) => {
    saveUsers(next)
    setUsers(next)
  }

  const getUserById = useCallback(
    (id: string) => users.find(u => u.userId === id),
    [users]
  )

  const addUser = useCallback(
    (data: Omit<User, 'userId' | 'createdAt' | 'lastLoginAt'>): User => {
      const newUser: User = {
        ...data,
        userId:    `u-${String(++uidCounter)}`,
        createdAt: new Date().toISOString(),
      }
      persist([...users, newUser])
      return newUser
    },
    [users]
  )

  const updateUser = useCallback(
    (userId: string, patch: Partial<Omit<User, 'userId' | 'createdAt'>>) => {
      persist(users.map(u => u.userId === userId ? { ...u, ...patch } : u))
    },
    [users]
  )

  const toggleActive = useCallback(
    (userId: string) => {
      persist(users.map(u =>
        u.userId === userId ? { ...u, isActive: !u.isActive } : u
      ))
    },
    [users]
  )

  const changeRole = useCallback(
    (userId: string, role: UserRole) => {
      persist(users.map(u => u.userId === userId ? { ...u, role } : u))
    },
    [users]
  )

  const deleteUser = useCallback(
    (userId: string) => {
      persist(users.filter(u => u.userId !== userId))
    },
    [users]
  )

  return (
    <UserManagementContext.Provider
      value={{ users, getUserById, addUser, updateUser, toggleActive, changeRole, deleteUser }}
    >
      {children}
    </UserManagementContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUserManagement() {
  const ctx = useContext(UserManagementContext)
  if (!ctx) throw new Error('useUserManagement must be inside <UserManagementProvider>')
  return ctx
}
