import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell }              from '@/components/layout/AppShell'
import { Breadcrumb }            from '@/components/layout/Breadcrumb'
import { KpiCard }               from '@/components/common/KpiCard'
import { HotColdDonut }          from '@/components/charts/HotColdDonut'
import { MeterStackedBar }       from '@/components/charts/MeterStackedBar'
import { HourlyProfileChart }    from '@/components/charts/HourlyProfileChart'
import { AnomalyTimeline }       from '@/components/charts/AnomalyTimeline'
import { MeterListTable }        from '@/components/tables/MeterListTable'
import { AlertFeed }             from '@/components/tables/AlertFeed'
import { MiniMap }               from '@/components/map/MiniMap'
import { useMockData }           from '@/hooks/useMockData'
import { useRegion }             from '@/context/RegionContext'
import type {
  Zone, Building, Meter, MeterEvent, HourlyProfilePoint,
} from '@/types'

export function BuildingDashboardPage() {
  const { zoneId, buildingId } = useParams<{ zoneId: string; buildingId: string }>()
  const { activeRegion }       = useRegion()

  // ── Data loading ─────────────────────────────────────────────────────────
  const { data: allZones,     loading: lZ } = useMockData<Zone[]>(() => import('@/mock/zones.json'))
  const { data: allBuildings, loading: lB } = useMockData<Building[]>(() => import('@/mock/buildings.json'))
  const { data: allMeters,    loading: lM } = useMockData<Meter[]>(() => import('@/mock/meters.json'))
  const { data: allEvents,    loading: lE } = useMockData<MeterEvent[]>(() => import('@/mock/meter-events.json'))
  const { data: profile,      loading: lP } = useMockData<HourlyProfilePoint[]>(() => import('@/mock/hourly-profile.json'))
  const { data: geoData                   } = useMockData<any>(() => import('@/mock/map-geodata.json'))

  const dataLoading = lZ || lB || lM || lE

  // ── Scoped slices ─────────────────────────────────────────────────────────
  const zone           = useMemo(() => allZones?.find(z => z.zoneId === zoneId),                       [allZones, zoneId])
  const building       = useMemo(() => allBuildings?.find(b => b.buildingId === buildingId),           [allBuildings, buildingId])
  const buildingMeters = useMemo(() => allMeters?.filter(m => m.buildingId === buildingId)   ?? [],   [allMeters, buildingId])
  const buildingEvents = useMemo(() => allEvents?.filter(e => e.buildingId === buildingId)   ?? [],   [allEvents, buildingId])
  const zoneBuildings  = useMemo(() => allBuildings?.filter(b => b.zoneId === zoneId)        ?? [],   [allBuildings, zoneId])

  // ── KPI derivations ──────────────────────────────────────────────────────
  const totalCons    = useMemo(() => buildingMeters.reduce((s, m) => s + (m.consumption ?? 0), 0),  [buildingMeters])
  const hotCons      = useMemo(() => buildingMeters.filter(m => m.meterType === 'HOT').reduce((s, m)  => s + (m.consumption ?? 0), 0),  [buildingMeters])
  const coldCons     = useMemo(() => buildingMeters.filter(m => m.meterType === 'COLD').reduce((s, m) => s + (m.consumption ?? 0), 0),  [buildingMeters])
  const activeMCount = useMemo(() => buildingMeters.filter(m => m.isActive).length,               [buildingMeters])
  const activeAlerts = useMemo(() => buildingEvents.filter(e => !e.isResolved).length,            [buildingEvents])
  const avgBattery   = useMemo(() => {
    const active = buildingMeters.filter(m => m.isActive)
    return active.length
      ? Math.round(active.reduce((s, m) => s + m.batteryLevel, 0) / active.length)
      : 0
  }, [buildingMeters])

  const hotColdData = useMemo(() => ({
    hot: hotCons, cold: coldCons, mixed: 0, total: hotCons + coldCons,
  }), [hotCons, coldCons])

  const regionId = zone?.regionId ?? activeRegion?.regionId ?? ''

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumb items={[
            { label: activeRegion?.regionName ?? 'Region', path: '/dashboard' },
            { label: zone?.zoneName ?? `Zone ${zoneId}`,   path: `/dashboard/zone/${zoneId}` },
            { label: building?.buildingName ?? `Building ${buildingId}` },
          ]} />
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {building?.buildingName ?? 'Building Dashboard'}
          </h1>
          <p className="text-sm text-gray-500">
            {building?.buildingCode} · {buildingMeters.length} meters
            {building ? ` · ${building.floorCount} floor${building.floorCount !== 1 ? 's' : ''}` : ''}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard title="Total Consumption" value={totalCons.toLocaleString()} unit="m³"     loading={dataLoading} />
          <KpiCard title="Active Meters"     value={`${activeMCount} / ${buildingMeters.length}`} subText={`${buildingMeters.length - activeMCount} offline`} loading={dataLoading} />
          <KpiCard title="Hot Water"         value={hotCons.toLocaleString()}  unit="m³" colorVariant="hot"     loading={dataLoading} />
          <KpiCard title="Cold Water"        value={coldCons.toLocaleString()} unit="m³" colorVariant="cold"    loading={dataLoading} />
          <KpiCard title="Active Alerts"     value={activeAlerts} colorVariant={activeAlerts > 0 ? 'alert' : 'default'} loading={dataLoading} />
          <KpiCard title="Avg Battery"       value={avgBattery} unit="%" colorVariant="battery" loading={dataLoading} />
        </div>

        {/* Meter List */}
        <MeterListTable
          meters={buildingMeters}
          events={buildingEvents}
          zoneId={zoneId!}
          buildingId={buildingId!}
          loading={lM || lE}
        />

        {/* Stacked Bar + Hourly Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7">
            <MeterStackedBar
              meters={buildingMeters}
              zoneId={zoneId!}
              loading={lM}
            />
          </div>
          <div className="lg:col-span-5">
            <HourlyProfileChart
              data={profile ?? []}
              loading={lP}
            />
          </div>
        </div>

        {/* Hot/Cold Donut + Anomaly Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            <HotColdDonut data={hotColdData} loading={dataLoading} />
          </div>
          <div className="lg:col-span-8">
            <AnomalyTimeline
              events={buildingEvents}
              meters={buildingMeters}
              loading={lE || lM}
            />
          </div>
        </div>

        {/* Alert Feed */}
        <AlertFeed
          events={buildingEvents}
          meters={buildingMeters}
          buildings={zoneBuildings}
          zones={allZones ?? []}
          loading={lE || lM}
        />

        {/* Building Mini Map */}
        {geoData && (
          <MiniMap
            buildings={zoneBuildings}
            geoData={geoData}
            alertEvents={buildingEvents}
            regionId={regionId}
          />
        )}
      </div>
    </AppShell>
  )
}
