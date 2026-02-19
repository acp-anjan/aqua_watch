import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell }              from '@/components/layout/AppShell'
import { Breadcrumb }            from '@/components/layout/Breadcrumb'
import { KpiCard }               from '@/components/common/KpiCard'
import { BuildingCard }          from '@/components/common/BuildingCard'
import { ConsumptionTrendChart } from '@/components/charts/ConsumptionTrendChart'
import { HotColdDonut }          from '@/components/charts/HotColdDonut'
import { FlowRateHeatmap }       from '@/components/charts/FlowRateHeatmap'
import { AlertFeed }             from '@/components/tables/AlertFeed'
import { MiniMap }               from '@/components/map/MiniMap'
import { useMockData }           from '@/hooks/useMockData'
import { useRegion }             from '@/context/RegionContext'
import type {
  Zone, Building, Meter, MeterEvent, TimeSeriesPoint, HourlyProfilePoint,
} from '@/types'

export function ZoneDashboardPage() {
  const { zoneId }       = useParams<{ zoneId: string }>()
  const { activeRegion } = useRegion()

  // ── Data loading ─────────────────────────────────────────────────────────
  const { data: allZones,     loading: lZ } = useMockData<Zone[]>(() => import('@/mock/zones.json'))
  const { data: allBuildings, loading: lB } = useMockData<Building[]>(() => import('@/mock/buildings.json'))
  const { data: allMeters,    loading: lM } = useMockData<Meter[]>(() => import('@/mock/meters.json'))
  const { data: allEvents,    loading: lE } = useMockData<MeterEvent[]>(() => import('@/mock/meter-events.json'))
  const { data: trendRaw,     loading: lT } = useMockData<TimeSeriesPoint[]>(() => import('@/mock/consumption-trend.json'))
  const { data: profile,      loading: lP } = useMockData<HourlyProfilePoint[]>(() => import('@/mock/hourly-profile.json'))
  const { data: geoData                   } = useMockData<any>(() => import('@/mock/map-geodata.json'))

  const dataLoading = lZ || lB || lM || lE

  // ── Zone-scoped slices ───────────────────────────────────────────────────
  const zone          = useMemo(() => allZones?.find(z => z.zoneId === zoneId),             [allZones, zoneId])
  const zoneBuildings = useMemo(() => allBuildings?.filter(b => b.zoneId === zoneId) ?? [], [allBuildings, zoneId])
  const zoneMeters    = useMemo(() => allMeters?.filter(m => m.zoneId === zoneId) ?? [],    [allMeters, zoneId])
  const zoneEvents    = useMemo(() => allEvents?.filter(e => e.zoneId === zoneId) ?? [],    [allEvents, zoneId])

  // ── KPI derivations ──────────────────────────────────────────────────────
  const totalCons    = useMemo(() => zoneMeters.reduce((s, m) => s + (m.consumption ?? 0), 0), [zoneMeters])
  const hotCons      = useMemo(() => zoneMeters.filter(m => m.meterType === 'HOT').reduce((s, m)  => s + (m.consumption ?? 0), 0), [zoneMeters])
  const coldCons     = useMemo(() => zoneMeters.filter(m => m.meterType === 'COLD').reduce((s, m) => s + (m.consumption ?? 0), 0), [zoneMeters])
  const activeMCount = useMemo(() => zoneMeters.filter(m => m.isActive).length,  [zoneMeters])
  const activeAlerts = useMemo(() => zoneEvents.filter(e => !e.isResolved).length, [zoneEvents])
  const avgBattery   = useMemo(() => {
    const active = zoneMeters.filter(m => m.isActive)
    return active.length
      ? Math.round(active.reduce((s, m) => s + m.batteryLevel, 0) / active.length)
      : 0
  }, [zoneMeters])

  const hotColdData = useMemo(() => ({
    hot: hotCons, cold: coldCons, mixed: 0, total: hotCons + coldCons,
  }), [hotCons, coldCons])

  // ── Zone-level trend: scale region trend by zone's fraction ─────────────
  const zoneTrend = useMemo(() => {
    if (!trendRaw || trendRaw.length === 0 || totalCons === 0) return trendRaw ?? []
    const regionTotal = trendRaw.reduce((s, p) => s + p.total, 0)
    const scale       = regionTotal > 0 ? totalCons / regionTotal : 0.25
    return trendRaw.map(p => ({
      ts:    p.ts,
      total: Math.round(p.total * scale * 10) / 10,
      hot:   Math.round(p.hot   * scale * 10) / 10,
      cold:  Math.round(p.cold  * scale * 10) / 10,
    }))
  }, [trendRaw, totalCons])

  const regionId = zone?.regionId ?? activeRegion?.regionId ?? ''

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumb items={[
            { label: activeRegion?.regionName ?? 'Region', path: '/dashboard' },
            { label: zone?.zoneName ?? `Zone ${zoneId}` },
          ]} />
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {zone?.zoneName ?? 'Zone Dashboard'}
          </h1>
          <p className="text-sm text-gray-500">
            {zoneBuildings.length} buildings · {zoneMeters.length} meters
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard title="Total Consumption" value={totalCons.toLocaleString()} unit="m³"     loading={dataLoading} />
          <KpiCard title="Active Meters"     value={`${activeMCount} / ${zoneMeters.length}`} subText={`${zoneMeters.length - activeMCount} offline`} loading={dataLoading} />
          <KpiCard title="Hot Water"         value={hotCons.toLocaleString()}  unit="m³" colorVariant="hot"     loading={dataLoading} />
          <KpiCard title="Cold Water"        value={coldCons.toLocaleString()} unit="m³" colorVariant="cold"    loading={dataLoading} />
          <KpiCard title="Active Alerts"     value={activeAlerts}    colorVariant={activeAlerts > 0 ? 'alert' : 'default'} loading={dataLoading} />
          <KpiCard title="Avg Battery"       value={avgBattery} unit="%" colorVariant="battery" loading={dataLoading} />
        </div>

        {/* Consumption Trend */}
        <ConsumptionTrendChart data={zoneTrend} loading={lT} />

        {/* Buildings Grid */}
        <div>
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Buildings in Zone</h2>
          {lB ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-52 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {zoneBuildings.map(building => (
                <BuildingCard
                  key={building.buildingId}
                  building={building}
                  meters={zoneMeters.filter(m => m.buildingId === building.buildingId)}
                  events={zoneEvents.filter(e => e.buildingId === building.buildingId)}
                  zoneId={zoneId!}
                />
              ))}
            </div>
          )}
        </div>

        {/* Hot/Cold Donut + Flow Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            <HotColdDonut data={hotColdData} loading={dataLoading} />
          </div>
          <div className="lg:col-span-8">
            <FlowRateHeatmap
              buildings={zoneBuildings}
              meters={zoneMeters}
              hourlyProfile={profile ?? []}
              loading={lB || lM || lP}
            />
          </div>
        </div>

        {/* Alert Feed */}
        <AlertFeed
          events={zoneEvents}
          meters={zoneMeters}
          buildings={zoneBuildings}
          zones={allZones ?? []}
          loading={lE || lM}
        />

        {/* Zone Mini Map */}
        {geoData && (
          <MiniMap
            buildings={zoneBuildings}
            geoData={geoData}
            alertEvents={zoneEvents}
            regionId={regionId}
          />
        )}
      </div>
    </AppShell>
  )
}
