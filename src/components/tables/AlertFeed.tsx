import { useState } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AlertBadge } from '@/components/common/AlertBadge'
import { useToast } from '@/components/ui/toast'
import type { MeterEvent, Meter, Building, Zone } from '@/types'

interface AlertFeedProps {
  events:    MeterEvent[]
  meters:    Meter[]
  buildings: Building[]
  zones:     Zone[]
  loading?:  boolean
}

type FilterMode = 'ALL' | 'UNRESOLVED'

export function AlertFeed({ events, meters, buildings, zones, loading = false }: AlertFeedProps) {
  const { toast } = useToast()
  const [filter, setFilter]     = useState<FilterMode>('UNRESOLVED')
  const [resolved, setResolved] = useState<Set<string>>(new Set())

  const meterMap    = Object.fromEntries(meters.map((m)    => [m.meterId,    m]))
  const buildingMap = Object.fromEntries(buildings.map((b) => [b.buildingId, b]))
  const zoneMap     = Object.fromEntries(zones.map((z)     => [z.zoneId,     z]))

  const displayed = events.filter((e) => {
    const isResolved = e.isResolved || resolved.has(e.eventId)
    return filter === 'ALL' ? true : !isResolved
  })

  const handleResolve = (eventId: string) => {
    setResolved((prev) => new Set([...prev, eventId]))
    toast('Alert marked as resolved.', 'success')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        {[1,2,3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse mb-2" />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Alerts & Events
          {displayed.filter((e) => !e.isResolved && !resolved.has(e.eventId)).length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold w-5 h-5">
              {displayed.filter((e) => !e.isResolved && !resolved.has(e.eventId)).length}
            </span>
          )}
        </h2>

        {/* Filter */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
          {(['ALL', 'UNRESOLVED'] as FilterMode[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 font-medium transition-colors',
                filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
              )}
            >
              {f === 'ALL' ? 'All' : 'Unresolved'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col divide-y divide-gray-50 overflow-y-auto max-h-80">
        {displayed.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">
            <CheckCircle2 className="mx-auto mb-2 text-green-400" size={24} />
            No {filter === 'UNRESOLVED' ? 'unresolved ' : ''}alerts
          </div>
        )}
        {displayed.map((event) => {
          const meter    = meterMap[event.meterId]
          const building = buildingMap[event.buildingId]
          const zone     = zoneMap[event.zoneId]
          const isRes    = event.isResolved || resolved.has(event.eventId)

          return (
            <div
              key={event.eventId}
              className={cn('py-2.5 flex items-start gap-3', isRes && 'opacity-50')}
            >
              <AlertBadge eventType={event.eventType} className="mt-0.5 shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-gray-700">
                  <span className="font-medium truncate">{zone?.zoneName ?? event.zoneId}</span>
                  <ChevronRight size={10} className="text-gray-400 shrink-0" />
                  <span className="truncate text-gray-500">{building?.buildingName ?? event.buildingId}</span>
                  <ChevronRight size={10} className="text-gray-400 shrink-0" />
                  <span className="truncate text-gray-500 font-mono">{meter?.meterCode ?? event.meterId}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {(() => {
                    try { return formatDistanceToNow(parseISO(event.eventTs), { addSuffix: true }) }
                    catch { return event.eventTs }
                  })()}
                  {isRes && <span className="ml-2 text-green-500">✓ Resolved</span>}
                </div>
              </div>

              {!isRes && (
                <button
                  onClick={() => handleResolve(event.eventId)}
                  className="shrink-0 text-xs text-gray-400 hover:text-green-600 transition-colors px-2 py-1 rounded hover:bg-green-50"
                >
                  Resolve
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
