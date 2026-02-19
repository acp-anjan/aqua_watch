import { useMemo } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { EVENT_TYPES } from '@/lib/constants'
import type { MeterEvent, Meter } from '@/types'

interface AnomalyTimelineProps {
  events:   MeterEvent[]
  meters:   Meter[]
  loading?: boolean
}

export function AnomalyTimeline({ events, meters, loading = false }: AnomalyTimelineProps) {
  const meterMap = useMemo(
    () => Object.fromEntries(meters.map(m => [m.meterId, m])),
    [meters],
  )

  const cutoff = subDays(new Date('2026-02-19'), 30)

  const rows = useMemo(() => {
    const recent   = events.filter(e => parseISO(e.eventTs) >= cutoff)
    const meterIds = [...new Set(recent.map(e => e.meterId))]
    return meterIds
      .map(mid => ({
        meter:  meterMap[mid],
        events: recent
          .filter(e => e.meterId === mid)
          .sort((a, b) => parseISO(a.eventTs).getTime() - parseISO(b.eventTs).getTime()),
      }))
      .filter(r => r.meter)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, meterMap])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-32 bg-gray-100 rounded" />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center justify-center py-10">
        <p className="text-sm text-green-600 font-medium">✓ No anomaly events in the last 30 days</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-800">Anomaly Timeline</h2>
        <span className="text-xs text-gray-400">last 30 days</span>
      </div>

      <div className="space-y-3">
        {rows.map(({ meter, events: mEvents }) => (
          <div key={meter.meterId} className="flex items-start gap-3">
            {/* Meter label */}
            <div className="w-28 shrink-0 pt-0.5">
              <p className="text-xs font-mono font-medium text-gray-700">{meter.meterCode}</p>
              <p className="text-xs text-gray-400 truncate">{meter.locationLabel}</p>
            </div>

            {/* Event pills */}
            <div className="flex flex-wrap gap-1.5">
              {mEvents.map(e => {
                const cfg = EVENT_TYPES[e.eventType]
                return (
                  <div
                    key={e.eventId}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border cursor-default select-none',
                      e.isResolved && 'opacity-50',
                    )}
                    style={{
                      background:   `${cfg.color}18`,
                      borderColor:  `${cfg.color}55`,
                      color:         cfg.color,
                    }}
                    title={`${cfg.label} — ${format(parseISO(e.eventTs), 'dd MMM yyyy HH:mm')}${e.isResolved ? ' — Resolved' : ''}`}
                  >
                    <span>{cfg.icon}</span>
                    <span className="font-medium">{format(parseISO(e.eventTs), 'dd MMM')}</span>
                    {e.isResolved && <span className="opacity-60 ml-0.5">✓</span>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100">
        {(Object.values(EVENT_TYPES) as { label: string; color: string; icon: string }[]).map(cfg => (
          <span key={cfg.label} className="flex items-center gap-1 text-xs" style={{ color: cfg.color }}>
            {cfg.icon} {cfg.label}
          </span>
        ))}
      </div>
    </div>
  )
}
