import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, MapPin, Layers, Activity, ChevronRight } from 'lucide-react'
import { useAuth }    from '@/context/AuthContext'
import { useRegion }  from '@/context/RegionContext'
import { Button }     from '@/components/ui/button'
import type { Region } from '@/types'
import { cn } from '@/lib/utils'

export function RegionSelectPage() {
  const { user }                              = useAuth()
  const { allRegions, selectRegion }          = useRegion()
  const navigate                              = useNavigate()

  const [selected, setSelected] = useState<Region | null>(null)
  const [loading,  setLoading]  = useState(false)

  if (!user) {
    navigate('/login', { replace: true })
    return null
  }

  // Filter regions the user has access to (SuperAdmin / Admin see all)
  const accessible = ['SUPER_ADMIN', 'ADMIN'].includes(user.role)
    ? allRegions
    : allRegions.filter(r => user.regionAccess.includes(r.regionId))

  const handleContinue = async () => {
    if (!selected) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 400)) // mock
    selectRegion(selected.regionId)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Select a Region</h1>
                <p className="text-sm text-gray-500">Choose the region you want to work in</p>
              </div>
            </div>
          </div>

          {/* Region cards */}
          <div className="px-8 pb-6 space-y-3">
            {accessible.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Globe className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No regions are assigned to your account.</p>
                <p className="text-xs text-gray-400 mt-1">Contact your administrator.</p>
              </div>
            ) : (
              accessible.map(region => (
                <button
                  key={region.regionId}
                  onClick={() => setSelected(region)}
                  className={cn(
                    'w-full text-left rounded-xl border-2 p-4 transition-all',
                    selected?.regionId === region.regionId
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                        selected?.regionId === region.regionId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-500'
                      )}>
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{region.regionName}</p>
                        {region.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{region.description}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      'h-4 w-4 shrink-0 mt-1 transition-transform',
                      selected?.regionId === region.regionId ? 'text-blue-600 translate-x-0.5' : 'text-gray-300'
                    )} />
                  </div>

                  {/* Stats row */}
                  <div className="mt-3 flex gap-4">
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Layers className="h-3.5 w-3.5 text-gray-400" />
                      {region.zoneCount} zone{region.zoneCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Activity className="h-3.5 w-3.5 text-gray-400" />
                      {region.meterCount} meter{region.meterCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-8 pb-8">
            <Button
              className="w-full"
              disabled={!selected}
              loading={loading}
              onClick={handleContinue}
            >
              {loading ? 'Loading…' : `Continue to ${selected?.regionName ?? 'Dashboard'}`}
            </Button>
            <p className="mt-3 text-center text-xs text-gray-400">
              You can switch regions at any time from the top navigation bar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
