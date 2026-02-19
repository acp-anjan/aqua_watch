import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronDown, Globe, User, LogOut, Settings, RefreshCw
} from 'lucide-react'
import { useAuth }   from '@/context/AuthContext'
import { useRegion } from '@/context/RegionContext'
import { ROLES }     from '@/lib/constants'
import { cn }        from '@/lib/utils'

export function Navbar() {
  const { user, logout }              = useAuth()
  const { activeRegion, allRegions, selectRegion } = useRegion()
  const navigate                      = useNavigate()

  const [userMenuOpen,   setUserMenuOpen]   = useState(false)
  const [regionMenuOpen, setRegionMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
      {/* Logo / Title */}
      <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
        <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
          </svg>
        </div>
        <span className="font-semibold text-gray-900 text-sm">
          AquaWatch{' '}
        </span>
      </Link>

      <div className="flex-1" />

      {/* Region selector */}
      {activeRegion && (
        <div className="relative">
          <button
            onClick={() => { setRegionMenuOpen(o => !o); setUserMenuOpen(false) }}
            className={cn(
              'flex items-center gap-1.5 text-sm font-medium text-gray-700 px-3 py-1.5',
              'rounded-md border border-gray-200 hover:bg-gray-50 transition-colors'
            )}
          >
            <Globe className="h-4 w-4 text-blue-500" />
            {activeRegion.regionName}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', regionMenuOpen && 'rotate-180')} />
          </button>

          {regionMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-50 animate-fade-in py-1">
              <p className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Switch Region
              </p>
              {allRegions.map(r => (
                <button
                  key={r.regionId}
                  onClick={() => { selectRegion(r.regionId); setRegionMenuOpen(false) }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between',
                    r.regionId === activeRegion.regionId && 'text-blue-600 font-medium'
                  )}
                >
                  <span>{r.regionName}</span>
                  {r.regionId === activeRegion.regionId && (
                    <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User menu */}
      {user && (
        <div className="relative">
          <button
            onClick={() => { setUserMenuOpen(o => !o); setRegionMenuOpen(false) }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs uppercase">
              {user.fullName.charAt(0)}
            </div>
            <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 transition-transform', userMenuOpen && 'rotate-180')} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-60 bg-white rounded-lg border border-gray-200 shadow-lg z-50 animate-fade-in">
              {/* User info block */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <span className="mt-1 inline-block text-xs font-medium text-blue-700 bg-blue-50 rounded px-1.5 py-0.5">
                  {ROLES[user.role]}
                </span>
              </div>
              {/* Menu items */}
              <div className="py-1">
                <button
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => { setUserMenuOpen(false) }}
                >
                  <User className="h-4 w-4 text-gray-400" />
                  Profile
                  <span className="ml-auto text-xs text-gray-400">(coming soon)</span>
                </button>
                <button
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => { setUserMenuOpen(false) }}
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  Settings
                  <span className="ml-auto text-xs text-gray-400">(coming soon)</span>
                </button>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
