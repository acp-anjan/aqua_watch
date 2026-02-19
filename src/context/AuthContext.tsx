import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'
import { MOCK_CREDENTIALS } from '@/lib/constants'
import mockUsers from '@/mock/users.json'

interface AuthContextValue {
  user:     User | null
  isLoggedIn: boolean
  login:    (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout:   () => void
  canAccess: (roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem('aw_user')
      return stored ? (JSON.parse(stored) as User) : null
    } catch {
      return null
    }
  })

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      // Simulate network latency
      await new Promise(r => setTimeout(r, 600))

      const expected = MOCK_CREDENTIALS[email.toLowerCase()]
      if (!expected || expected !== password) {
        return { success: false, error: 'Invalid email or password.' }
      }

      const found = (mockUsers as User[]).find(u => u.email.toLowerCase() === email.toLowerCase())
      if (!found) {
        return { success: false, error: 'User not found in mock data.' }
      }
      if (!found.isActive) {
        return { success: false, error: 'Account is not activated. Contact your administrator.' }
      }

      sessionStorage.setItem('aw_user', JSON.stringify(found))
      setUser(found)
      return { success: true }
    },
    []
  )

  const logout = useCallback(() => {
    sessionStorage.removeItem('aw_user')
    sessionStorage.removeItem('aw_region')
    setUser(null)
  }, [])

  const canAccess = useCallback(
    (roles: UserRole[]): boolean => {
      if (!user) return false
      return roles.includes(user.role)
    },
    [user]
  )

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
