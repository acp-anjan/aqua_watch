import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Maximize2 } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import type { Building, MeterEvent } from '@/types'

interface GeoFeature {
  type: 'Feature'
  properties: {
    zoneId:   string
    zoneName: string
    regionId: string
    status:   string
  }
  geometry: {
    type:        'Polygon'
    coordinates: number[][][]
  }
}

interface GeoData {
  type:     'FeatureCollection'
  features: GeoFeature[]
}

interface MiniMapProps {
  buildings:     Building[]
  geoData:       GeoData
  alertEvents:   MeterEvent[]
  regionId:      string
  height?:       number
}

/** GeoJSON is [lng, lat], Leaflet wants [lat, lng] */
function toLatLngs(coords: number[][]): [number, number][] {
  return coords.map(([lng, lat]) => [lat, lng])
}

const ZONE_STATUS_COLOR: Record<string, string> = {
  alert:    '#F57C00',
  critical: '#D32F2F',
  normal:   '#1E88E5',
  offline:  '#9E9E9E',
}

export function MiniMap({ buildings, geoData, alertEvents, regionId, height = 280 }: MiniMapProps) {
  const mapRef     = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<{ remove(): void } | null>(null)
  const navigate   = useNavigate()

  // Set of building IDs that have unresolved alerts
  const alertBuildings = new Set(
    alertEvents.filter((e) => !e.isResolved).map((e) => e.buildingId)
  )

  useEffect(() => {
    if (!mapRef.current) return
    if (leafletRef.current) return  // already initialised

    import('leaflet').then((mod) => {
      const L = mod.default ?? mod

      const map = L.map(mapRef.current!, {
        zoomControl:        false,
        scrollWheelZoom:    false,
        dragging:           false,
        touchZoom:          false,
        doubleClickZoom:    false,
        boxZoom:            false,
        keyboard:           false,
        attributionControl: false,
      })

      // ESRI World Imagery — satellite tiles, good building detail at zoom 17+
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles © Esri — Source: Esri, USGS, NOAA',
          maxZoom: 19,
        }
      ).addTo(map)

      // Labels overlay so street/building names are still readable
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { opacity: 0.7, maxZoom: 19 }
      ).addTo(map)

      // Zone polygons for this region only
      const regionFeatures = geoData.features.filter((f) => f.properties.regionId === regionId)

      regionFeatures.forEach((feature) => {
        const latlngs = toLatLngs(feature.geometry.coordinates[0])
        const color   = ZONE_STATUS_COLOR[feature.properties.status] ?? ZONE_STATUS_COLOR.normal
        L.polygon(latlngs, {
          color,
          fillColor:   color,
          fillOpacity: 0.15,
          weight:      2,
          dashArray:   '4 4',
        }).bindTooltip(feature.properties.zoneName, { permanent: false, direction: 'center' })
          .addTo(map)
      })

      // Building markers — only those whose zone belongs to this region
      const regionZoneIds = new Set(regionFeatures.map((f) => f.properties.zoneId))
      const regionBuildings = buildings.filter((b) => regionZoneIds.has(b.zoneId))

      regionBuildings.forEach((b) => {
        const hasAlert = alertBuildings.has(b.buildingId)
        const color    = hasAlert ? '#F57C00' : '#2E7D32'

        L.circleMarker([b.lat, b.lng], {
          radius:      hasAlert ? 8 : 6,
          color:       '#fff',
          weight:      2,
          fillColor:   color,
          fillOpacity: 0.9,
        })
          .bindTooltip(`${b.buildingName}${hasAlert ? ' ⚠ Alert' : ''}`, { direction: 'top', offset: [0, -8] })
          .on('click', () => navigate(`/dashboard/zone/${b.zoneId}/building/${b.buildingId}`))
          .addTo(map)
      })

      // Fit map to region zones
      if (regionFeatures.length > 0) {
        const allCoords: [number, number][] = regionFeatures.flatMap((f) =>
          toLatLngs(f.geometry.coordinates[0])
        )
        // maxZoom 19 ensures full satellite building detail is visible
        map.fitBounds(L.latLngBounds(allCoords), { padding: [20, 20], maxZoom: 19 })
      } else {
        // Default centre — Pokhara district site area
        map.setView([28.1633, 84.0572], 18)
      }

      leafletRef.current = map
    })

    return () => {
      leafletRef.current?.remove()
      leafletRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between px-4 py-2 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-700">Region Map</span>
        <button
          onClick={() => navigate('/map')}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium"
        >
          <Maximize2 size={12} />
          Expand to Full Map
        </button>
      </div>

      {/* Map container */}
      <div ref={mapRef} style={{ height }} className="w-full pt-9" />

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 px-3 py-2 text-xs flex flex-col gap-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-green-700" />  Healthy building
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-orange-500" /> Building with alerts
        </span>
      </div>
    </div>
  )
}
