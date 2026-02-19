import { useState } from 'react'
import { Pencil, Trash2, ToggleLeft, ToggleRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDatetime } from '@/lib/formatters'
import type { ScheduledReport, ReportFormat, ReportFrequency } from '@/types'

interface ScheduledReportListProps {
  schedules:  ScheduledReport[]
  onToggle:   (scheduleId: string, active: boolean) => void
  onDelete:   (scheduleId: string) => void
}

const FORMAT_COLOR: Record<ReportFormat, string> = {
  PDF:  'bg-red-50    text-red-700    border-red-200',
  XLSX: 'bg-green-50  text-green-700  border-green-200',
  CSV:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  JSON: 'bg-purple-50 text-purple-700 border-purple-200',
}

const FREQ_COLOR: Record<ReportFrequency, string> = {
  DAILY:   'bg-blue-50  text-blue-700',
  WEEKLY:  'bg-teal-50  text-teal-700',
  MONTHLY: 'bg-indigo-50 text-indigo-700',
}

export function ScheduledReportList({ schedules, onToggle, onDelete }: ScheduledReportListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = (scheduleId: string) => {
    if (deletingId === scheduleId) {
      onDelete(scheduleId)
      setDeletingId(null)
    } else {
      setDeletingId(scheduleId)
      // auto-cancel confirm after 3s
      setTimeout(() => setDeletingId(id => id === scheduleId ? null : id), 3000)
    }
  }

  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Calendar size={32} className="mb-3 opacity-40" />
        <p className="text-sm font-medium">No scheduled reports</p>
        <p className="text-xs mt-1">Switch to "Schedule" mode and save a report schedule</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left border-b border-gray-100">
            <th className="pb-2 pr-3 font-semibold text-gray-500">Name</th>
            <th className="pb-2 pr-3 font-semibold text-gray-500">Report Type</th>
            <th className="pb-2 pr-3 font-semibold text-gray-500">Freq.</th>
            <th className="pb-2 pr-3 font-semibold text-gray-500">Format</th>
            <th className="pb-2 pr-3 font-semibold text-gray-500">Next Run</th>
            <th className="pb-2 pr-3 font-semibold text-gray-500">Status</th>
            <th className="pb-2     font-semibold text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {schedules.map(sch => (
            <tr key={sch.scheduleId} className={cn('hover:bg-gray-50/50 transition-colors', !sch.isActive && 'opacity-60')}>
              <td className="py-2.5 pr-3">
                <p className="font-medium text-gray-800 max-w-[140px] truncate" title={sch.name}>{sch.name}</p>
                <p className="text-[10px] text-gray-400 truncate max-w-[140px]" title={sch.emailRecipients.join(', ')}>
                  → {sch.emailRecipients.join(', ')}
                </p>
              </td>
              <td className="py-2.5 pr-3 text-gray-600 max-w-[120px] truncate" title={sch.reportType}>
                {sch.reportType}
              </td>
              <td className="py-2.5 pr-3">
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', FREQ_COLOR[sch.frequency])}>
                  {sch.frequency.charAt(0) + sch.frequency.slice(1).toLowerCase()}
                </span>
              </td>
              <td className="py-2.5 pr-3">
                <span className={cn('px-1.5 py-0.5 rounded border text-[10px] font-semibold', FORMAT_COLOR[sch.format])}>
                  {sch.format}
                </span>
              </td>
              <td className="py-2.5 pr-3 text-gray-500 whitespace-nowrap">
                <span title={formatDatetime(sch.nextRunAt)}>
                  {new Date(sch.nextRunAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </td>
              <td className="py-2.5 pr-3">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                  sch.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                )}>
                  {sch.isActive ? 'Active' : 'Paused'}
                </span>
              </td>
              <td className="py-2.5">
                <div className="flex items-center gap-1.5">
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggle(sch.scheduleId, !sch.isActive)}
                    title={sch.isActive ? 'Pause schedule' : 'Activate schedule'}
                    className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    {sch.isActive
                      ? <ToggleRight size={16} className="text-green-600" />
                      : <ToggleLeft  size={16} className="text-gray-400"  />
                    }
                  </button>
                  {/* Edit (placeholder) */}
                  <button
                    type="button"
                    title="Edit (UI placeholder)"
                    className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  {/* Delete with confirm */}
                  <button
                    type="button"
                    onClick={() => handleDelete(sch.scheduleId)}
                    title={deletingId === sch.scheduleId ? 'Click again to confirm delete' : 'Delete schedule'}
                    className={cn(
                      'p-1 rounded-md transition-colors text-xs font-medium',
                      deletingId === sch.scheduleId
                        ? 'bg-red-100 text-red-700 hover:bg-red-200 px-2'
                        : 'hover:bg-red-50 text-gray-400 hover:text-red-600'
                    )}
                  >
                    {deletingId === sch.scheduleId ? 'Confirm?' : <Trash2 size={13} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
