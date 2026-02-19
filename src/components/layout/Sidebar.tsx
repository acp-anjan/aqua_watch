import { useState, type ElementType } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Map, FileText, Users,
  Settings, LogOut, ChevronLeft, Droplets
} from 'lucide-react'
import { useAuth }    from '@/context/AuthContext'
import { ADMIN_ROLES } from '@/lib/constants'
import { cn }         from '@/lib/utils'

interface NavItem {
  label:     string
  path:      string
  icon:      ElementType
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',       path: '/dashboard', icon: LayoutDashboard },
  { label: 'Map View',        path: '/map',        icon: Map             },
  { label: 'Reports',         path: '/reports',    icon: FileText        },
  { label: 'User Management', path: '/users',      icon: Users, adminOnly: true },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const canSeeAdmin = user && ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || canSeeAdmin)

  return (
    <aside
      className={cn(
        'fixed left-0 top-14 bottom-0 z-30 flex flex-col bg-gray-900 text-gray-100',
        'border-r border-gray-700 transition-all duration-200 ease-in-out',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {/* Dashboard section */}
        <div className="mb-1">
          {visibleItems
            .filter(item => !item.adminOnly)
            .map(item => (
              <SidebarLink key={item.path} item={item} collapsed={collapsed} />
            ))}
        </div>

        {/* Admin section */}
        {canSeeAdmin && (
          <>
            <div className={cn(
              'my-2 border-t border-gray-700',
              collapsed ? 'mx-2' : 'mx-3'
            )} />
            {visibleItems
              .filter(item => item.adminOnly)
              .map(item => (
                <SidebarLink key={item.path} item={item} collapsed={collapsed} />
              ))}
          </>
        )}

        {/* Settings (placeholder) */}
        <div className={cn('my-2 border-t border-gray-700', collapsed ? 'mx-2' : 'mx-3')} />
        <button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm',
            'text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title="Settings (Phase 3)"
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
          {!collapsed && <span className="ml-auto text-xs text-gray-600">soon</span>}
        </button>
      </nav>

      {/* Collapse toggle + Logout */}
      <div className="border-t border-gray-700 px-2 py-3 space-y-1">
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm',
            'text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title="Logout"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          onClick={() => setCollapsed(c => !c)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm',
            'text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn('h-4 w-4 shrink-0 transition-transform', collapsed && 'rotate-180')}
          />
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon: ElementType = item.icon
  return (
    <NavLink
      to={item.path}
      title={item.label}
      end={item.path === '/dashboard'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-0.5',
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100',
          collapsed && 'justify-center px-2'
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}

// Mini brand for collapsed state
export function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return !collapsed ? (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
      <Droplets className="h-5 w-5 text-blue-400" />
      <span className="font-semibold text-sm">AquaWatch</span>
    </div>
  ) : null
}
