import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PanelLeftOpen, PanelLeftClose,
  Locate, Layers, Search, X, ChevronDown,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { cn } from '@/lib/utils'
import { buildingPopupHtml } from '@/components/map/BuildingPopup'
import { meterPopupHtml }    from '@/components/map/MeterPopup'
import type { Zone, Building, Meter, MeterEvent } from '@/types'

// ─── Types ─────────────────────────────────────────────────────────────────

interface GeoFeature {
  type: 'Feature'
  properties: { zoneId: string; zoneName: string; regionId: string; status: string }
  geometry:   { type: 'Polygon'; coordinates: number[][][] }
}
interface GeoData {
  type: 'FeatureCollection'
  features: GeoFeature[]
}

export interface FullMapViewProps {
  zones:     Zone[]
  buildings: Building[]
  meters:    Meter[]
  events:    MeterEvent[]
  geoData:   GeoData
  regionId:  string
}

export type WaterTypeFilter = 'ALL' | 'HOT' | 'COLD'

interface LayerState {
  zoneBoundaries:    boolean
  buildings:         boolean
  alertHeatmap:      boolean
  meterPins:         boolean
  consumptionShade:  boolean
}

interface FilterState {
  waterType:   WaterTypeFilter
  showActive:  boolean
  showAlerting: boolean
  showOffline: boolean
}

// ─── Constants ─────────────────────────────────────────────────────────────

const ZONE_STATUS_COLOR: Record<string, string> = {
  alert:    '#F57C00',
  critical: '#D32F2F',
  normal:   '#1E88E5',
  offline:  '#9E9E9E',
}

function toLatLngs(coords: number[][]): [number, number][] {
  return coords.map(([lng, lat]) => [lat, lng])
}

// ─── Component ─────────────────────────────────────────────────────────────

export function FullMapView({ zones, buildings, meters, events, geoData, regionId }: FullMapViewProps) {
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstance    = useRef<{ remove(): void; fitBounds: Function; setView: Function; getZoom: () => number } | null>(null)
  const navigate       = useNavigate()

  // Layer group refs
  const zoneLayerRef   = useRef<{ clearLayers(): void; addLayer(l: unknown): void } | null>(null)
  const bldgLayerRef   = useRef<{ clearLayers(): void; addLayer(l: unknown): void } | null>(null)
  const meterLayerRef  = useRef<{ clearLayers(): void; addLayer(l: unknown): void } | null>(null)
  const heatLayerRef   = useRef<{ clearLayers(): void; addLayer(l: unknown): void } | null>(null)
  const shadeLayerRef  = useRef<{ clearLayers(): void; addLayer(l: unknown): void } | null>(null)

  // Panel / UI state
  const [panelOpen,     setPanelOpen]     = useState(true)
  const [search,        setSearch]        = useState('')
  const [currentZoom,   setCurrentZoom]   = useState(18)
  const [selectedZone,  setSelectedZone]  = useState<Zone | null>(null)
  const [leafletReady,  setLeafletReady]  = useState(false)

  const [layers, setLayers] = useState<LayerState>({
    zoneBoundaries:   true,
    buildings:        true,
    alertHeatmap:     true,
    meterPins:        false,
    consumptionShade: false,
  })

  const [filters, setFilters] = useState<FilterState>({
    waterType:    'ALL',
    showActive:   true,
    showAlerting: true,
    showOffline:  true,
  })

  // Alert building set
  const alertBuildingIds = new Set(events.filter(e => !e.isResolved).map(e => e.buildingId))

  // ── Map initialization (once) ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    import('leaflet').then((mod) => {
      const L = mod.default ?? mod

      const map = L.map(mapRef.current!, {
        zoomControl:        false,
        attributionControl: false,
        scrollWheelZoom:    true,
      })

      // ESRI satellite + labels overlay
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles © Esri', maxZoom: 21 }
      ).addTo(map)
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { opacity: 0.7, maxZoom: 21 }
      ).addTo(map)

      // Attribution (bottom-right)
      L.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('© Esri')
        .addTo(map)

      // Zoom control (top-right)
      L.control.zoom({ position: 'topright' }).addTo(map)

      // Create layer groups
      const zoneGroup  = L.layerGroup().addTo(map)
      const bldgGroup  = L.layerGroup().addTo(map)
      const meterGroup = L.layerGroup().addTo(map)
      const heatGroup  = L.layerGroup().addTo(map)
      const shadeGroup = L.layerGroup().addTo(map)

      zoneLayerRef.current  = zoneGroup  as unknown as typeof zoneLayerRef.current
      bldgLayerRef.current  = bldgGroup  as unknown as typeof bldgLayerRef.current
      meterLayerRef.current = meterGroup as unknown as typeof meterLayerRef.current
      heatLayerRef.current  = heatGroup  as unknown as typeof heatLayerRef.current
      shadeLayerRef.current = shadeGroup as unknown as typeof shadeLayerRef.current

      mapInstance.current = map as unknown as typeof mapInstance.current

      // Zoom listener
      map.on('zoomend', () => setCurrentZoom(map.getZoom()))

      // Listen for map-navigate custom events (from popup links)
      const handleMapNavigate = (e: Event) => navigate((e as CustomEvent).detail)
      window.addEventListener('map-navigate', handleMapNavigate)

      // Default fit
      const regionFeatures = geoData.features.filter(f => f.properties.regionId === regionId)
      if (regionFeatures.length > 0) {
        const allCoords: [number, number][] = regionFeatures.flatMap(f => toLatLngs(f.geometry.coordinates[0]))
        map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40], maxZoom: 19 })
      } else {
        map.setView([28.1633, 84.0572], 18)
      }

      setLeafletReady(true)

      return () => {
        window.removeEventListener('map-navigate', handleMapNavigate)
      }
    })

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Zone polygon layer ────────────────────────────────────────────────────
  useEffect(() => {
    if (!leafletReady || !zoneLayerRef.current) return
    import('leaflet').then((mod) => {
      const L = mod.default ?? mod
      const group = zoneLayerRef.current!
      group.clearLayers()
      if (!layers.zoneBoundaries) return

      const regionFeatures = geoData.features.filter(f => f.properties.regionId === regionId)
      regionFeatures.forEach((feature) => {
        const latlngs = toLatLngs(feature.geometry.coordinates[0])
        const color   = ZONE_STATUS_COLOR[feature.properties.status] ?? ZONE_STATUS_COLOR.normal
        const poly    = L.polygon(latlngs, {
          color,
          fillColor:   color,
          fillOpacity: 0.12,
          weight:      2.5,
          dashArray:   '5 5',
        })
        poly.bindTooltip(feature.properties.zoneName, { permanent: false, direction: 'center', className: 'map-zone-tooltip' })
        poly.on('click', () => {
          const zone = zones.find(z => z.zoneId === feature.properties.zoneId) ?? null
          setSelectedZone(zone)
        })
        group.addLayer(poly)
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady, layers.zoneBoundaries, regionId])

  // ── Consumption shade layer ───────────────────────────────────────────────
  useEffect(() => {
    if (!leafletReady || !shadeLayerRef.current) return
    import('leaflet').then((mod) => {
      const L = mod.default ?? mod
      const group = shadeLayerRef.current!
      group.clearLayers()
      if (!layers.consumptionShade) return

      const regionFeatures = geoData.features.filter(f => f.properties.regionId === regionId)
      const zoneConsumptions = regionFeatures.map(f => {
        const total = meters
          .filter(m => m.zoneId === f.properties.zoneId)
          .reduce((s, m) => s + (m.consumption ?? 0), 0)
        return { feature: f, total }
      })
      const maxCons = Math.max(...zoneConsumptions.map(z => z.total), 1)

      zoneConsumptions.forEach(({ feature, total }) => {
        const opacity = 0.1 + 0.45 * (total / maxCons)
        const latlngs = toLatLngs(feature.geometry.coordinates[0])
        group.addLayer(L.polygon(latlngs, {
          color:       '#546E7A',
          fillColor:   '#546E7A',
          fillOpacity: opacity,
          weight:      0,
          interactive: false,
        }))
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady, layers.consumptionShade, regionId])

  // ── Building marker layer ─────────────────────────────────────────────────
  useEffect(() => {
    if (!leafletReady || !bldgLayerRef.current) return
    import('leaflet').then((mod) => {
      const L = mod.default ?? mod
      const group = bldgLayerRef.current!
      group.clearLayers()
      if (!layers.buildings) return

      const regionZoneIds = new Set(geoData.features.filter(f => f.properties.regionId === regionId).map(f => f.properties.zoneId))
      let visible = buildings.filter(b => regionZoneIds.has(b.zoneId))

      // Apply search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        visible = visible.filter(b =>
          b.buildingName.toLowerCase().includes(q) || b.buildingCode.toLowerCase().includes(q)
        )
      }

      visible.forEach((b) => {
        const hasAlert  = alertBuildingIds.has(b.buildingId)
        const bMeters   = meters.filter(m => m.buildingId === b.buildingId)
        const hasOffline = bMeters.some(m => !m.isActive)

        // Status-based filter
        if (!filters.showAlerting && hasAlert) return
        if (!filters.showOffline && hasOffline && !hasAlert) return
        if (!filters.showActive && !hasAlert && !hasOffline) return

        const color  = hasAlert ? '#F57C00' : '#2E7D32'
        const radius = hasAlert ? 9 : 7

        const marker = L.circleMarker([b.lat, b.lng], {
          radius,
          color:       '#fff',
          weight:      2.5,
          fillColor:   color,
          fillOpacity: 0.92,
        })

        const bEvents = events.filter(e => e.buildingId === b.buildingId)
        const bMetersFiltered = filters.waterType === 'ALL'
          ? bMeters
          : bMeters.filter(m => m.meterType === filters.waterType)

        marker.bindPopup(
          buildingPopupHtml(b, bMetersFiltered, bEvents, b.zoneId),
          { maxWidth: 260, className: 'map-building-popup' }
        )
        group.addLayer(marker)
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady, layers.buildings, filters, search, regionId])

  // ── Alert heatmap layer ───────────────────────────────────────────────────
  useEffect(() => {
    if (!leafletReady || !heatLayerRef.current) return
    import('leaflet').then((mod) => {
      const L = mod.default ?? mod
      const group = heatLayerRef.current!
      group.clearLayers()
      if (!layers.alertHeatmap) return

      const regionZoneIds = new Set(geoData.features.filter(f => f.properties.regionId === regionId).map(f => f.properties.zoneId))
      buildings
        .filter(b => regionZoneIds.has(b.zoneId) && alertBuildingIds.has(b.buildingId))
        .forEach((b) => {
          // Pulsing-effect: concentric circles at decreasing opacity
          ;[28, 18, 10].forEach((r, i) => {
            group.addLayer(L.circleMarker([b.lat, b.lng], {
              radius:      r,
              color:       '#D32F2F',
              fillColor:   '#D32F2F',
              fillOpacity: 0.06 + i * 0.04,
              weight:      0,
              interactive: false,
            }))
          })
        })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady, layers.alertHeatmap, regionId])

  // ── Meter pin layer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!leafletReady || !meterLayerRef.current) return
    import('leaflet').then((mod) => {
      const L = mod.default ?? mod
      const group = meterLayerRef.current!
      group.clearLayers()
      if (!layers.meterPins || currentZoom < 18) return

      const regionZoneIds = new Set(geoData.features.filter(f => f.properties.regionId === regionId).map(f => f.properties.zoneId))
      let visibleMeters = meters.filter(m => regionZoneIds.has(m.zoneId))

      if (filters.waterType !== 'ALL') visibleMeters = visibleMeters.filter(m => m.meterType === filters.waterType)
      if (!filters.showActive)   visibleMeters = visibleMeters.filter(m => !m.isActive)
      if (!filters.showOffline)  visibleMeters = visibleMeters.filter(m => m.isActive)

      // Place meters near their building with small offset
      visibleMeters.forEach((m, idx) => {
        const bldg = buildings.find(b => b.buildingId === m.buildingId)
        if (!bldg) return
        const angle  = (idx * 47) % 360
        const rad    = (angle * Math.PI) / 180
        const offset = 0.00005
        const lat    = bldg.lat + offset * Math.sin(rad)
        const lng    = bldg.lng + offset * Math.cos(rad)

        const isHot  = m.meterType === 'HOT'
        const color  = !m.isActive ? '#9E9E9E' : isHot ? '#E53935' : '#1E88E5'

        const marker = L.circleMarker([lat, lng], {
          radius:      5,
          color:       '#fff',
          weight:      1.5,
          fillColor:   color,
          fillOpacity: 0.9,
        })
        const mEvents = events.filter(e => e.meterId === m.meterId)
        marker.bindPopup(meterPopupHtml(m, mEvents, m.zoneId), { maxWidth: 240 })
        group.addLayer(marker)
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady, layers.meterPins, currentZoom, filters, regionId])

  // ── Zoom to region ────────────────────────────────────────────────────────
  const zoomToRegion = useCallback(() => {
    import('leaflet').then((mod) => {
      const L = mod.default ?? mod
      const regionFeatures = geoData.features.filter(f => f.properties.regionId === regionId)
      if (regionFeatures.length > 0 && mapInstance.current) {
        const allCoords: [number, number][] = regionFeatures.flatMap(f => toLatLngs(f.geometry.coordinates[0]))
        ;(mapInstance.current as any).fitBounds(L.latLngBounds(allCoords), { padding: [40, 40], maxZoom: 19 })
      }
    })
  }, [geoData, regionId])

  // ── Derived zone stats for info panel ────────────────────────────────────
  const zoneStats = selectedZone ? (() => {
    const zMeters   = meters.filter(m => m.zoneId === selectedZone.zoneId)
    const zEvents   = events.filter(e => e.zoneId === selectedZone.zoneId && !e.isResolved)
    const total     = zMeters.reduce((s, m) => s + (m.consumption ?? 0), 0)
    const hot       = zMeters.filter(m => m.meterType === 'HOT').reduce((s, m) => s + (m.consumption ?? 0), 0)
    const cold      = zMeters.filter(m => m.meterType === 'COLD').reduce((s, m) => s + (m.consumption ?? 0), 0)
    const active    = zMeters.filter(m => m.isActive).length
    const offline   = zMeters.filter(m => !m.isActive).length
    const avgBat    = zMeters.length ? Math.round(zMeters.reduce((s, m) => s + m.batteryLevel, 0) / zMeters.length) : 0
    return { total, hot, cold, active, offline, avgBat, alerts: zEvents.length, meterCount: zMeters.length }
  })() : null

  // ─────────────────────────────────────────────────────────────────────────

  const toggleLayer = (key: keyof LayerState) =>
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))

  const setWaterType = (wt: WaterTypeFilter) =>
    setFilters(prev => ({ ...prev, waterType: wt }))

  const toggleFilter = (key: keyof Omit<FilterState, 'waterType'>) =>
    setFilters(prev => ({ ...prev, [key]: !prev[key] }))

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Leaflet map canvas */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* ── Left control panel ─────────────────────────────────────────── */}
      <div className={cn(
        'absolute top-0 left-0 bottom-0 z-10 flex transition-all duration-200',
        panelOpen ? 'w-[280px]' : 'w-0'
      )}>
        {panelOpen && (
          <div className="w-[280px] h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 overflow-y-auto flex-shrink-0 shadow-lg">
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search buildings…"
                  className="w-full pl-7 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Layers */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-1.5 mb-2">
                <Layers size={12} className="text-gray-400" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Layers</h3>
              </div>
              <div className="space-y-1.5">
                {(Object.entries({
                  zoneBoundaries:   'Zone Boundaries',
                  buildings:        'Buildings',
                  alertHeatmap:     'Alert Heatmap',
                  meterPins:        `Meter Pins ${currentZoom < 18 ? '(zoom in ≥18)' : ''}`,
                  consumptionShade: 'Consumption Shade',
                }) as [keyof LayerState, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={layers[key]}
                      onChange={() => toggleLayer(key)}
                      className="w-3.5 h-3.5 accent-blue-600 rounded"
                    />
                    <span className={cn('text-gray-700', key === 'meterPins' && currentZoom < 18 && 'text-gray-400')}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Water Type</h3>
              <div className="flex gap-1.5 mb-3">
                {(['ALL', 'HOT', 'COLD'] as WaterTypeFilter[]).map(wt => (
                  <button
                    key={wt}
                    type="button"
                    onClick={() => setWaterType(wt)}
                    className={cn(
                      'flex-1 text-[11px] py-1 rounded-lg border font-medium transition-colors',
                      filters.waterType === wt
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    )}
                  >
                    {wt === 'ALL' ? 'All' : wt === 'HOT' ? '🔴 Hot' : '🔵 Cold'}
                  </button>
                ))}
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Status</h3>
              <div className="space-y-1.5">
                {([
                  ['showActive',   '✅ Active'],
                  ['showAlerting', '⚠️ Alerting'],
                  ['showOffline',  '🔴 Offline'],
                ] as [keyof Omit<FilterState, 'waterType'>, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filters[key]}
                      onChange={() => toggleFilter(key)}
                      className="w-3.5 h-3.5 accent-blue-600 rounded"
                    />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="p-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Legend</h3>
              <div className="space-y-1.5">
                {[
                  { color: '#1E88E5', label: 'Normal zone' },
                  { color: '#F57C00', label: 'Zone with alerts' },
                  { color: '#D32F2F', label: 'Critical zone' },
                  { color: '#9E9E9E', label: 'Offline zone' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    {label}
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                  {[
                    { color: '#F57C00', label: 'Building with alerts' },
                    { color: '#2E7D32', label: 'Healthy building' },
                    { color: '#E53935', label: 'HOT meter pin' },
                    { color: '#1E88E5', label: 'COLD meter pin' },
                    { color: '#9E9E9E', label: 'Offline meter pin' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel toggle button */}
      <button
        type="button"
        onClick={() => setPanelOpen(v => !v)}
        className={cn(
          'absolute top-3 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-md hover:bg-white transition-all',
          panelOpen ? 'left-[288px]' : 'left-3'
        )}
      >
        {panelOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
        {panelOpen ? 'Hide' : 'Controls'}
      </button>

      {/* ── Toolbar top-right ──────────────────────────────────────────── */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={zoomToRegion}
          title="Zoom to region"
          className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-md hover:bg-white"
        >
          <Locate size={13} />
          Fit Region
        </button>
        <button
          type="button"
          title="Layer info"
          className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-md hover:bg-white"
          onClick={() => setPanelOpen(true)}
        >
          <ChevronDown size={13} />
          Layers
        </button>
      </div>

      {/* Zoom level badge */}
      <div className="absolute bottom-8 right-3 z-20 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-2.5 py-1 text-[11px] font-mono text-gray-500 shadow">
        Zoom {currentZoom}
      </div>

      {/* ── Zone info panel (right, slides in on zone click) ───────────── */}
      {selectedZone && zoneStats && (
        <div className="absolute top-0 right-0 bottom-0 z-30 w-[280px] bg-white/97 backdrop-blur-sm border-l border-gray-200 shadow-xl overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
            <div>
              <h2 className="text-sm font-bold text-gray-900">{selectedZone.zoneName}</h2>
              <p className="text-[11px] text-gray-500">{selectedZone.buildingCount} buildings · Zone Overview</p>
            </div>
            <button onClick={() => setSelectedZone(null)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
              <X size={16} />
            </button>
          </div>

          {/* KPI grid */}
          <div className="p-3 grid grid-cols-2 gap-2">
            {[
              { label: 'Total',    value: `${zoneStats.total} m³`, bg: '#ECEFF1', fg: '#37474F' },
              { label: 'Hot',      value: `${zoneStats.hot} m³`,   bg: '#FFEBEE', fg: '#C62828' },
              { label: 'Cold',     value: `${zoneStats.cold} m³`,  bg: '#E3F2FD', fg: '#1565C0' },
              { label: 'Alerts',   value: String(zoneStats.alerts), bg: zoneStats.alerts > 0 ? '#FFF3E0' : '#E8F5E9', fg: zoneStats.alerts > 0 ? '#E65100' : '#2E7D32' },
              { label: 'Active',   value: String(zoneStats.active),  bg: '#E8F5E9', fg: '#2E7D32' },
              { label: 'Offline',  value: String(zoneStats.offline), bg: zoneStats.offline > 0 ? '#FFEBEE' : '#F5F5F5', fg: zoneStats.offline > 0 ? '#C62828' : '#9E9E9E' },
            ].map(({ label, value, bg, fg }) => (
              <div key={label} className="rounded-xl p-2.5" style={{ backgroundColor: bg }}>
                <p className="text-[10px] font-semibold" style={{ color: fg }}>{label}</p>
                <p className="text-base font-bold mt-0.5" style={{ color: fg }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Battery */}
          <div className="px-3 pb-3">
            <div className="rounded-xl bg-gray-50 p-2.5">
              <p className="text-[10px] text-gray-500 mb-1">Avg Battery</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded h-2 overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${zoneStats.avgBat}%`,
                      backgroundColor: zoneStats.avgBat < 20 ? '#D32F2F' : zoneStats.avgBat < 50 ? '#F57C00' : '#2E7D32'
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700">{zoneStats.avgBat}%</span>
              </div>
            </div>
          </div>

          {/* Navigate button */}
          <div className="px-3 pb-4">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/zone/${selectedZone.zoneId}`)}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              Open Zone Dashboard →
            </button>
          </div>

          {/* Building list */}
          <div className="px-3 pb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Buildings</h3>
            <div className="space-y-1.5">
              {buildings
                .filter(b => b.zoneId === selectedZone.zoneId)
                .map(b => {
                  const hasAlert = alertBuildingIds.has(b.buildingId)
                  return (
                    <button
                      key={b.buildingId}
                      type="button"
                      onClick={() => navigate(`/dashboard/zone/${selectedZone.zoneId}/building/${b.buildingId}`)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-gray-100 bg-white hover:bg-blue-50 hover:border-blue-200 text-left transition-colors"
                    >
                      <span className="text-xs text-gray-700 font-medium">{b.buildingName}</span>
                      {hasAlert && <span className="text-[10px] text-orange-600 font-semibold">⚠ Alert</span>}
                    </button>
                  )
                })
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
