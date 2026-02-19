import { format, parseISO } from 'date-fns'
import { CheckCircle2, Clock } from 'lucide-react'
import { cn }          from '@/lib/utils'
import { AlertBadge }  from '@/components/common/AlertBadge'
import type { MeterEvent } from '@/types'

interface EventLogTableProps {
  events:   MeterEvent[]
  loading?: boolean
}

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: 'bg-red-100    text-red-700    border border-red-200',
  WARNING:  'bg-orange-100 text-orange-700 border border-orange-200',
  INFO:     'bg-blue-100   text-blue-700   border border-blue-200',
}

export function EventLogTable({ events, loading = false }: EventLogTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 bg-gray-100 rounded mb-1" />
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center justify-center py-10">
        <p className="text-sm text-green-600 font-medium">✓ No events logged for this meter</p>
      </div>
    )
  }

  const sorted = [...events].sort(
    (a, b) => parseISO(b.eventTs).getTime() - parseISO(a.eventTs).getTime(),
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-800">Event Log</h2>
        <span className="text-xs text-gray-400">{events.length} event{events.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              {['Timestamp', 'Type', 'Severity', 'Status', 'Resolved By', 'Notes'].map(h => (
                <th
                  key={h}
                  className="py-2 px-2 text-left font-medium text-gray-500 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(e => (
              <tr
                key={e.eventId}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="py-2.5 px-2 font-mono text-gray-600 whitespace-nowrap">
                  {format(parseISO(e.eventTs), 'dd MMM yyyy HH:mm')}
                </td>
                <td className="py-2.5 px-2">
                  <AlertBadge eventType={e.eventType} />
                </td>
                <td className="py-2.5 px-2">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-semibold',
                      SEVERITY_STYLE[e.severity] ?? '',
                    )}
                  >
                    {e.severity}
                  </span>
                </td>
                <td className="py-2.5 px-2">
                  {e.isResolved
                    ? <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle2 size={12} /> Resolved</span>
                    : <span className="flex items-center gap-1 text-orange-500 font-medium"><Clock size={12} /> Open</span>
                  }
                </td>
                <td className="py-2.5 px-2 text-gray-500">{e.resolvedBy ?? '—'}</td>
                <td className="py-2.5 px-2 text-gray-500 truncate max-w-[200px]">{e.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
