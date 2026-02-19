import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth }   from '@/context/AuthContext'
import { useRegion } from '@/context/RegionContext'
import type { UserRole } from '@/types'

interface RequireAuthProps {
  children:   ReactNode
  roles?:     UserRole[]         // if provided, user must have one of these roles
}

/**
 * Protects a route.
 * 1. Not logged in → /login
 * 2. Logged in but must reset pwd → /password-reset
 * 3. Logged in but no region selected → /region-select
 * 4. Insufficient role → back to /dashboard
 */
export function RequireAuth({ children, roles }: RequireAuthProps) {
  const { user, isLoggedIn }   = useAuth()
  const { activeRegion }       = useRegion()
  const location               = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user?.mustResetPassword) {
    return <Navigate to="/password-reset" replace />
  }

  if (!activeRegion) {
    return <Navigate to="/region-select" replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
