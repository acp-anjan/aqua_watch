import { useNavigate } from 'react-router-dom'
import { Thermometer, Droplets, BarChart2, AlertTriangle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Building, Meter, MeterEvent } from '@/types'

interface BuildingCardProps {
  building: Building
  meters:   Meter[]
  events:   MeterEvent[]
  zoneId:   string
}

export function BuildingCard({ building, meters, events, zoneId }: BuildingCardProps) {
  const navigate = useNavigate()

  const activeCnt    = meters.filter(m => m.isActive).length
  const offlineCnt   = meters.length - activeCnt
  const hot          = meters
    .filter(m => m.meterType === 'HOT')
    .reduce((s, m) => s + (m.consumption ?? 0), 0)
  const cold         = meters
    .filter(m => m.meterType === 'COLD')
    .reduce((s, m) => s + (m.consumption ?? 0), 0)
  const total        = hot + cold
  const alertCnt     = events.filter(e => !e.isResolved).length

  const borderColor = alertCnt > 0
    ? 'border-orange-300 shadow-orange-50'
    : offlineCnt > 0
      ? 'border-yellow-200'
      : 'border-gray-200'

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-4 flex flex-col gap-3',
        'hover:shadow-md transition-all cursor-pointer',
        borderColor,
      )}
      onClick={() => navigate(`/dashboard/zone/${zoneId}/building/${building.buildingId}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 leading-tight">
            {building.buildingName}
          </h3>
          <span className="text-xs text-gray-400">
            {building.buildingCode} · {building.floorCount} floor{building.floorCount !== 1 ? 's' : ''}
          </span>
        </div>
        {alertCnt > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 shrink-0">
            <AlertTriangle size={10} />
            {alertCnt}
          </span>
        )}
      </div>

      {/* Consumption grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-red-50 p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-red-600 mb-0.5">
            <Thermometer size={11} />
            <span className="text-xs font-medium">Hot</span>
          </div>
          <p className="text-sm font-bold text-red-700 tabular-nums">{hot.toLocaleString()}</p>
          <p className="text-xs text-red-400">m³</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-blue-600 mb-0.5">
            <Droplets size={11} />
            <span className="text-xs font-medium">Cold</span>
          </div>
          <p className="text-sm font-bold text-blue-700 tabular-nums">{cold.toLocaleString()}</p>
          <p className="text-xs text-blue-400">m³</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-600 mb-0.5">
            <BarChart2 size={11} />
            <span className="text-xs font-medium">Total</span>
          </div>
          <p className="text-sm font-bold text-gray-800 tabular-nums">{total.toLocaleString()}</p>
          <p className="text-xs text-gray-400">m³</p>
        </div>
      </div>

      {/* Meter counts */}
      <div className="flex items-center justify-between text-xs">
        <span className="flex gap-2">
          <span className="text-green-600 font-medium">{activeCnt} active</span>
          {offlineCnt > 0 && (
            <span className="text-red-500 font-medium">{offlineCnt} offline</span>
          )}
        </span>
        <span className="text-gray-400">{meters.length} meters</span>
      </div>

      {/* CTA */}
      <div className="flex items-center justify-end pt-1 border-t border-gray-50">
        <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
          View Building <ChevronRight size={12} />
        </span>
      </div>
    </div>
  )
}
