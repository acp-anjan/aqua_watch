import { AppShell }     from '@/components/layout/AppShell'
import { useRegion }    from '@/context/RegionContext'
import { useMockData }  from '@/hooks/useMockData'
import { FullMapView }  from '@/components/map/FullMapView'
import type { Zone, Building, Meter, MeterEvent } from '@/types'

interface GeoData {
  type:     'FeatureCollection'
  features: {
    type: 'Feature'
    properties: { zoneId: string; zoneName: string; regionId: string; status: string }
    geometry:   { type: 'Polygon'; coordinates: number[][][] }
  }[]
}

export function MapViewPage() {
  const { activeRegion } = useRegion()

  const { data: zones     } = useMockData<Zone[]>(     () => import('@/mock/zones.json'))
  const { data: buildings } = useMockData<Building[]>( () => import('@/mock/buildings.json'))
  const { data: meters    } = useMockData<Meter[]>(    () => import('@/mock/meters.json'))
  const { data: events    } = useMockData<MeterEvent[]>(() => import('@/mock/meter-events.json'))
  const { data: geoData   } = useMockData<GeoData>(    () => import('@/mock/map-geodata.json'))

  const ready = zones && buildings && meters && events && geoData && activeRegion

  return (
    <AppShell>
      {/* -m-6 cancels the AppShell p-6 padding so the map fills edge-to-edge */}
      <div className="-m-6" style={{ height: 'calc(100vh - 56px)' }}>
        {ready ? (
          <FullMapView
            zones={zones}
            buildings={buildings}
            meters={meters}
            events={events}
            geoData={geoData}
            regionId={activeRegion.regionId}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading map data…</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
