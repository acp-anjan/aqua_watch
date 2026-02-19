import type { ReactNode } from 'react'
import { formatDistanceToNow, format, parseISO } from 'date-fns'
import { WaterTypeBadge }         from '@/components/common/WaterTypeBadge'
import { StatusDot, meterStatus } from '@/components/common/StatusDot'
import { cn }                     from '@/lib/utils'
import type { Meter, Building, Zone } from '@/types'

interface MeterInfoPanelProps {
  meter:    Meter
  building: Building | undefined
  zone:     Zone     | undefined
}

function BatteryBar({ level }: { level: number }) {
  const color = level < 20 ? 'bg-red-500' : level < 50 ? 'bg-yellow-400' : 'bg-green-500'
  const text  = level < 20 ? 'text-red-600' : level < 50 ? 'text-yellow-600' : 'text-green-600'
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${level}%` }} />
      </div>
      <span className={cn('text-sm font-bold tabular-nums', text)}>{level}%</span>
    </div>
  )
}

function safeFormat(iso: string, fmt: string) {
  try { return format(parseISO(iso), fmt) } catch { return iso }
}
function safeRelative(iso: string) {
  try { return formatDistanceToNow(parseISO(iso), { addSuffix: true }) } catch { return iso }
}

export function MeterInfoPanel({ meter, building, zone }: MeterInfoPanelProps) {
  const status = meterStatus(meter)

  const fields: { label: string; value: ReactNode }[] = [
    { label: 'Meter Code',   value: <span className="font-mono font-semibold">{meter.meterCode}</span> },
    { label: 'Location',     value: meter.locationLabel },
    { label: 'Building',     value: building?.buildingName ?? meter.buildingId },
    { label: 'Zone',         value: zone?.zoneName ?? meter.zoneId },
    { label: 'Installed',    value: safeFormat(meter.installedAt, 'dd MMM yyyy') },
    { label: 'Concentrator', value: <span className="font-mono text-gray-600">{meter.concentratorId}</span> },
    { label: 'Status',       value: <StatusDot status={status} showLabel /> },
    { label: 'Last Reading', value: safeRelative(meter.lastSeenAt) },
    { label: 'Battery',      value: <BatteryBar level={meter.batteryLevel} /> },
    { label: 'Flow Rate',    value: <span className="font-mono">{(meter.currentFlowRate ?? 0).toFixed(2)} m³/h</span> },
    { label: 'Total Consump.', value: <span className="font-mono font-semibold">{(meter.consumption ?? 0).toLocaleString()} m³</span> },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <WaterTypeBadge type={meter.meterType} className="text-sm px-3 py-1" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-mono">{meter.meterCode}</h2>
            <p className="text-sm text-gray-500">{meter.locationLabel}</p>
          </div>
        </div>
        <StatusDot status={status} showLabel />
      </div>

      {/* Info grid */}
      <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex flex-col">
            <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">
              {label}
            </dt>
            <dd className="text-sm text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
