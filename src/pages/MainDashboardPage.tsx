import { useState }             from 'react'
import { AppShell }             from '@/components/layout/AppShell'
import { Breadcrumb }           from '@/components/layout/Breadcrumb'
import { useRegion }            from '@/context/RegionContext'
import { KpiCard }              from '@/components/common/KpiCard'
import { DateRangePicker }      from '@/components/common/DateRangePicker'
import { ConsumptionTrendChart } from '@/components/charts/ConsumptionTrendChart'
import { HotColdDonut }         from '@/components/charts/HotColdDonut'
import { ZoneComparisonBar }    from '@/components/charts/ZoneComparisonBar'
import { AlertFeed }            from '@/components/tables/AlertFeed'
import { TopMetersTable }       from '@/components/tables/TopMetersTable'
import { MiniMap }              from '@/components/map/MiniMap'
import { useMockData }          from '@/hooks/useMockData'
import { DATE_PRESETS }         from '@/lib/constants'
import type {
  Meter, Building, Zone, MeterEvent,
  TimeSeriesPoint, ZoneComparison, HotColdBreakdown
}                               from '@/types'

type Preset = typeof DATE_PRESETS[number]

export function MainDashboardPage() {
  const { activeRegion }            = useRegion()
  const [period, setPeriod]         = useState<Preset>('30D')

  // ── Mock data loads ────────────────────────────────────────────────────────
  const { data: kpiAll,   loading: kpiLoading   } = useMockData<Record<string, {
    period: string; totalConsumption: number; activeMeters: number; totalMeters: number
    hotConsumption: number; coldConsumption: number; activeAlerts: number; avgBatteryLevel: number
    deltas: Record<string, number>; sparklines: Record<string, number[]>
  }>>(
    () => import('@/mock/kpi-summary.json')
  )

  const { data: trend, loading: trendLoading } = useMockData<TimeSeriesPoint[]>(
    () => import('@/mock/consumption-trend.json')
  )

  const { data: zoneComp, loading: zoneLoading } = useMockData<ZoneComparison[]>(
    () => import('@/mock/zone-comparison.json')
  )

  const { data: breakdown } = useMockData<Record<string, HotColdBreakdown>>(
    () => import('@/mock/hot-cold-breakdown.json')
  )

  const { data: meters,    loading: metersLoading    } = useMockData<Meter[]>(
    () => import('@/mock/meters.json')
  )

  const { data: events,    loading: eventsLoading    } = useMockData<MeterEvent[]>(
    () => import('@/mock/meter-events.json')
  )

  const { data: buildings } = useMockData<Building[]>(
    () => import('@/mock/buildings.json')
  )

  const { data: zones } = useMockData<Zone[]>(
    () => import('@/mock/zones.json')
  )

  const { data: geoData } = useMockData<{
    type: 'FeatureCollection'
    features: { type: 'Feature'; properties: Record<string, string>; geometry: { type: 'Polygon'; coordinates: number[][][] } }[]
  }>(
    () => import('@/mock/map-geodata.json')
  )

  // ── Derived values ─────────────────────────────────────────────────────────
  const periodKey  = period === 'Today' ? 'TODAY' : period === '7D' ? '7D' : '30D'
  const kpi        = kpiAll?.[periodKey]

  const hotColdData: HotColdBreakdown = breakdown?.[activeRegion?.regionId ?? 'r-001'] ?? {
    hot: 0, cold: 0, mixed: 0, total: 0
  }

  // Filter trend data to the selected period
  const trendData: TimeSeriesPoint[] = (() => {
    if (!trend) return []
    if (period === 'Today') return trend.slice(-1)
    if (period === '7D')    return trend.slice(-7)
    return trend  // 30D default
  })()

  // Filter zone comparison to active region's zones
  const activeZoneIds   = activeRegion?.regionId === 'r-001'
    ? ['z-001','z-002']
    : ['z-003','z-004']
  const regionZones     = zoneComp?.filter((z) => activeZoneIds.includes(z.zoneId)) ?? []

  const unresolvedCount = events?.filter((e) => !e.isResolved).length ?? 0

  return (
    <AppShell>
      <div className="space-y-5 pb-6">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Breadcrumb items={[
              { label: activeRegion?.regionName ?? 'Region' },
              { label: 'Dashboard' }
            ]} />
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">{activeRegion?.regionName} — Operational Overview</p>
          </div>
          <DateRangePicker value={period} onChange={setPeriod} className="mt-1" />
        </div>

        {/* ── Section A: KPI Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            title="Total Consumption"
            value={kpi?.totalConsumption ?? 0}
            unit="m³"
            delta={kpi?.deltas.totalConsumption}
            sparkline={kpi?.sparklines.totalConsumption}
            colorVariant="default"
            loading={kpiLoading}
          />
          <KpiCard
            title="Active Meters"
            value={kpi ? `${kpi.activeMeters} / ${kpi.totalMeters}` : '—'}
            subText={kpi ? `${kpi.totalMeters - kpi.activeMeters} offline` : undefined}
            delta={kpi?.deltas.activeMeters}
            sparkline={kpi?.sparklines.activeMeters}
            colorVariant="default"
            loading={kpiLoading}
          />
          <KpiCard
            title="Hot Water Usage"
            value={kpi?.hotConsumption ?? 0}
            unit="m³"
            delta={kpi?.deltas.hotConsumption}
            sparkline={kpi?.sparklines.hotConsumption}
            colorVariant="hot"
            loading={kpiLoading}
          />
          <KpiCard
            title="Cold Water Usage"
            value={kpi?.coldConsumption ?? 0}
            unit="m³"
            delta={kpi?.deltas.coldConsumption}
            sparkline={kpi?.sparklines.coldConsumption}
            colorVariant="cold"
            loading={kpiLoading}
          />
          <KpiCard
            title="Active Alerts"
            value={unresolvedCount}
            subText={unresolvedCount > 0 ? 'Requires attention' : 'All clear'}
            delta={kpi?.deltas.activeAlerts}
            sparkline={kpi?.sparklines.activeAlerts}
            colorVariant="alert"
            loading={eventsLoading}
          />
          <KpiCard
            title="Avg Battery Level"
            value={kpi?.avgBatteryLevel ?? 0}
            unit="%"
            subText={kpi && kpi.avgBatteryLevel < 30 ? '⚠ Critical' : undefined}
            delta={kpi?.deltas.avgBatteryLevel}
            sparkline={kpi?.sparklines.avgBatteryLevel}
            colorVariant="battery"
            loading={kpiLoading}
          />
        </div>

        {/* ── Section B: Consumption Trend Chart ──────────────────────────── */}
        <ConsumptionTrendChart data={trendData} loading={trendLoading} />

        {/* ── Section C + D: Hot/Cold Donut + Zone Comparison ─────────────── */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 xl:col-span-4">
            <HotColdDonut data={hotColdData} />
          </div>
          <div className="col-span-12 xl:col-span-8">
            <ZoneComparisonBar data={regionZones} loading={zoneLoading} />
          </div>
        </div>

        {/* ── Section E + F: Alert Feed + Top Meters Table ─────────────────── */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 xl:col-span-5">
            <AlertFeed
              events={events ?? []}
              meters={meters ?? []}
              buildings={buildings ?? []}
              zones={zones ?? []}
              loading={eventsLoading}
            />
          </div>
          <div className="col-span-12 xl:col-span-7">
            <TopMetersTable
              meters={meters ?? []}
              buildings={buildings ?? []}
              zones={zones ?? []}
              limit={10}
              loading={metersLoading}
            />
          </div>
        </div>

        {/* ── Section G: Mini Map ──────────────────────────────────────────── */}
        {geoData && buildings && meters && events && (
          <MiniMap
            buildings={buildings}
            geoData={geoData}
            alertEvents={events}
            regionId={activeRegion?.regionId ?? 'r-001'}
            height={300}
          />
        )}
      </div>
    </AppShell>
  )
}

