import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell }              from '@/components/layout/AppShell'
import { Breadcrumb }            from '@/components/layout/Breadcrumb'
import { MeterInfoPanel }        from '@/components/common/MeterInfoPanel'
import { ConsumptionTrendChart } from '@/components/charts/ConsumptionTrendChart'
import { BatteryHistoryChart }   from '@/components/charts/BatteryHistoryChart'
import { EventLogTable }         from '@/components/tables/EventLogTable'
import { RawReadingsTable }      from '@/components/tables/RawReadingsTable'
import { useMockData }           from '@/hooks/useMockData'
import { useRegion }             from '@/context/RegionContext'
import {
  generateMeterTrend,
  generateFlowRateTrend,
  generateBatteryHistory,
  generateRawReadings,
} from '@/lib/mock-generators'
import type { Zone, Building, Meter, MeterEvent } from '@/types'

export function MeterDetailPage() {
  const { zoneId, buildingId, meterId } = useParams<{
    zoneId: string; buildingId: string; meterId: string
  }>()
  const { activeRegion } = useRegion()

  // ── Data loading ─────────────────────────────────────────────────────────
  const { data: allZones,     loading: lZ } = useMockData<Zone[]>(() => import('@/mock/zones.json'))
  const { data: allBuildings, loading: lB } = useMockData<Building[]>(() => import('@/mock/buildings.json'))
  const { data: allMeters,    loading: lM } = useMockData<Meter[]>(() => import('@/mock/meters.json'))
  const { data: allEvents,    loading: lE } = useMockData<MeterEvent[]>(() => import('@/mock/meter-events.json'))

  const dataLoading = lZ || lB || lM || lE

  // ── Resolved entities ────────────────────────────────────────────────────
  const meter    = useMemo(() => allMeters?.find(m => m.meterId === meterId),          [allMeters, meterId])
  const building = useMemo(() => allBuildings?.find(b => b.buildingId === buildingId), [allBuildings, buildingId])
  const zone     = useMemo(() => allZones?.find(z => z.zoneId === zoneId),             [allZones, zoneId])
  const events   = useMemo(() => allEvents?.filter(e => e.meterId === meterId) ?? [],  [allEvents, meterId])

  // ── Synthetic time-series ────────────────────────────────────────────────
  const consumptionTrend = useMemo(() => meter ? generateMeterTrend(meter)          : [], [meter])
  const flowRateTrend    = useMemo(() => meter ? generateFlowRateTrend(meter)       : [], [meter])
  const batteryHistory   = useMemo(() => meter ? generateBatteryHistory(meter.batteryLevel) : [], [meter])
  const rawReadings      = useMemo(() => meter ? generateRawReadings(meter, 48)     : [], [meter])

  const breadcrumb = [
    { label: activeRegion?.regionName ?? 'Region',            path: '/dashboard' },
    { label: zone?.zoneName     ?? `Zone ${zoneId}`,          path: `/dashboard/zone/${zoneId}` },
    { label: building?.buildingName ?? `Building ${buildingId}`, path: `/dashboard/zone/${zoneId}/building/${buildingId}` },
    { label: meter?.meterCode ?? `Meter ${meterId}` },
  ]

  if (dataLoading) {
    return (
      <AppShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-40 bg-gray-100 rounded-xl" />
          <div className="h-72 bg-gray-100 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-56 bg-gray-100 rounded-xl" />
            <div className="h-56 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </AppShell>
    )
  }

  if (!meter) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-lg font-medium text-gray-500">Meter not found: {meterId}</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumb items={breadcrumb} />
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Meter Detail — {meter.meterCode}
          </h1>
          <p className="text-sm text-gray-500">{meter.locationLabel}</p>
        </div>

        {/* Meter Info Panel */}
        <MeterInfoPanel meter={meter} building={building} zone={zone} />

        {/* Consumption History */}
        <ConsumptionTrendChart
          data={consumptionTrend}
          title="Consumption History (30 days)"
        />

        {/* Flow Rate History */}
        <ConsumptionTrendChart
          data={flowRateTrend}
          title="Flow Rate History (30 days, m³/h avg)"
        />

        {/* Battery History + Event Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BatteryHistoryChart data={batteryHistory} />
          <EventLogTable events={events} />
        </div>

        {/* Raw Readings */}
        <RawReadingsTable readings={rawReadings} />
      </div>
    </AppShell>
  )
}
