import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MeterReading } from '@/types'

interface RawReadingsTableProps {
  readings:  MeterReading[]
  loading?:  boolean
  pageSize?: number
}

function BoolPill({ value }: { value: boolean }) {
  return value
    ? <span className="font-bold text-red-600">YES</span>
    : <span className="text-gray-300">—</span>
}

export function RawReadingsTable({
  readings, loading = false, pageSize = 12,
}: RawReadingsTableProps) {
  const [page, setPage] = useState(0)

  const sorted  = [...readings].sort(
    (a, b) => parseISO(b.readingTs).getTime() - parseISO(a.readingTs).getTime(),
  )
  const total   = sorted.length
  const pages   = Math.ceil(total / pageSize)
  const visible = sorted.slice(page * pageSize, (page + 1) * pageSize)

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-9 bg-gray-100 rounded mb-1" />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-800">Raw Readings</h2>
        <span className="text-xs text-gray-400">{total} readings (last 48 h)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              {['Timestamp', 'Consumption (m³)', 'Flow Rate (m³/h)', 'Battery', 'Tamper', 'Leakage', 'Rev. Flow'].map(h => (
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
            {visible.map(r => (
              <tr
                key={r.readingId}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="py-2 px-2 font-mono text-gray-600 whitespace-nowrap">
                  {format(parseISO(r.readingTs), 'dd MMM HH:mm')}
                </td>
                <td className="py-2 px-2 font-mono text-gray-800">
                  {r.totalConsumption.toFixed(3)}
                </td>
                <td className="py-2 px-2 font-mono text-gray-800">
                  {r.instantaneousFlow.toFixed(3)}
                </td>
                <td className="py-2 px-2">
                  <span
                    className={cn(
                      'font-mono font-medium',
                      r.batteryLevel < 20
                        ? 'text-red-600'
                        : r.batteryLevel < 50
                          ? 'text-yellow-600'
                          : 'text-green-600',
                    )}
                  >
                    {r.batteryLevel}%
                  </span>
                </td>
                <td className="py-2 px-2"><BoolPill value={r.tamper} /></td>
                <td className="py-2 px-2"><BoolPill value={r.leakage} /></td>
                <td className="py-2 px-2"><BoolPill value={r.reverseFlow} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            Page {page + 1} of {pages} · {total} readings
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={page >= pages - 1}
              onClick={() => setPage(p => p + 1)}
              className="p-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
