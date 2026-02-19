import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ReportTypeDefinition {
  id:          string
  label:       string
  description: string
  icon:        ReactNode
}

interface ReportTypeCardProps {
  report:     ReportTypeDefinition
  selected:   boolean
  onSelect:   (id: string) => void
}

export function ReportTypeCard({ report, selected, onSelect }: ReportTypeCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(report.id)}
      className={cn(
        'w-full text-left rounded-xl border-2 px-4 py-3 transition-all duration-150',
        'hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
        selected
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : 'border-gray-200 bg-white'
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn(
          'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg',
          selected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
        )}>
          {report.icon}
        </span>
        <div className="min-w-0">
          <p className={cn(
            'text-sm font-semibold truncate',
            selected ? 'text-blue-700' : 'text-gray-800'
          )}>
            {report.label}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{report.description}</p>
        </div>
      </div>
    </button>
  )
}
