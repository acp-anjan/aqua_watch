import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }             from '@/context/AuthContext'
import { RegionProvider }           from '@/context/RegionContext'
import { UserManagementProvider }   from '@/context/UserManagementContext'
import { ToastProvider }            from '@/components/ui/toast'
import { RequireAuth }    from '@/components/layout/RequireAuth'

// Auth pages
import { LoginPage }          from '@/pages/LoginPage'
import { PasswordResetPage }  from '@/pages/PasswordResetPage'
import { RegionSelectPage }   from '@/pages/RegionSelectPage'

// App pages
import { MainDashboardPage }    from '@/pages/MainDashboardPage'
import { ZoneDashboardPage }    from '@/pages/ZoneDashboardPage'
import { BuildingDashboardPage } from '@/pages/BuildingDashboardPage'
import { MeterDetailPage }      from '@/pages/MeterDetailPage'
import { MapViewPage }          from '@/pages/MapViewPage'
import { ReportsPage }          from '@/pages/ReportsPage'

// User management pages
import { UserListPage } from '@/pages/users/UserListPage'
import { AddUserPage }  from '@/pages/users/AddUserPage'
import { EditUserPage } from '@/pages/users/EditUserPage'

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN'] as const

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RegionProvider>
          <UserManagementProvider>
            <ToastProvider>
              <Routes>
              {/* ── Public ─────────────────────────────────────── */}
              <Route path="/login"           element={<LoginPage />} />
              <Route path="/password-reset"  element={<PasswordResetPage />} />
              <Route path="/region-select"   element={<RegionSelectPage />} />

              {/* ── Protected ─────────────────────────────────── */}
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <MainDashboardPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/zone/:zoneId"
                element={
                  <RequireAuth>
                    <ZoneDashboardPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/zone/:zoneId/building/:buildingId"
                element={
                  <RequireAuth>
                    <BuildingDashboardPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/zone/:zoneId/building/:buildingId/meter/:meterId"
                element={
                  <RequireAuth>
                    <MeterDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/map"
                element={
                  <RequireAuth>
                    <MapViewPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/reports"
                element={
                  <RequireAuth>
                    <ReportsPage />
                  </RequireAuth>
                }
              />

              {/* ── Admin only ────────────────────────────────── */}
              <Route
                path="/users"
                element={
                  <RequireAuth roles={[...ADMIN_ROLES]}>
                    <UserListPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/users/new"
                element={
                  <RequireAuth roles={[...ADMIN_ROLES]}>
                    <AddUserPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/users/:userId/edit"
                element={
                  <RequireAuth roles={[...ADMIN_ROLES]}>
                    <EditUserPage />
                  </RequireAuth>
                }
              />

              {/* ── Fallback ──────────────────────────────────── */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            </ToastProvider>
          </UserManagementProvider>
        </RegionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
