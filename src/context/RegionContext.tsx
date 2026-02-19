import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Region } from '@/types'
import mockRegions from '@/mock/regions.json'

interface RegionContextValue {
  activeRegion:   Region | null
  allRegions:     Region[]
  selectRegion:   (regionId: string) => void
  clearRegion:    () => void
}

const RegionContext = createContext<RegionContextValue | null>(null)

export function RegionProvider({ children }: { children: ReactNode }) {
  const [activeRegion, setActiveRegion] = useState<Region | null>(() => {
    try {
      const stored = sessionStorage.getItem('aw_region')
      return stored ? (JSON.parse(stored) as Region) : null
    } catch {
      return null
    }
  })

  const allRegions = mockRegions as Region[]

  const selectRegion = useCallback((regionId: string) => {
    const found = allRegions.find(r => r.regionId === regionId) ?? null
    if (found) {
      sessionStorage.setItem('aw_region', JSON.stringify(found))
      setActiveRegion(found)
    }
  }, [allRegions])

  const clearRegion = useCallback(() => {
    sessionStorage.removeItem('aw_region')
    setActiveRegion(null)
  }, [])

  return (
    <RegionContext.Provider value={{ activeRegion, allRegions, selectRegion, clearRegion }}>
      {children}
    </RegionContext.Provider>
  )
}

export function useRegion() {
  const ctx = useContext(RegionContext)
  if (!ctx) throw new Error('useRegion must be used inside <RegionProvider>')
  return ctx
}
