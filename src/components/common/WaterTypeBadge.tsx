import { cn } from '@/lib/utils'
import type { MeterType } from '@/types'

interface WaterTypeBadgeProps {
  type: MeterType
  className?: string
}

const CONFIG: Record<MeterType, { label: string; className: string }> = {
  HOT:   { label: 'HOT',   className: 'bg-red-100 text-red-700 border border-red-200' },
  COLD:  { label: 'COLD',  className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  MIXED: { label: 'MIXED', className: 'bg-gray-100 text-gray-600 border border-gray-200' },
}

export function WaterTypeBadge({ type, className }: WaterTypeBadgeProps) {
  const { label, className: preset } = CONFIG[type]
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
      preset, className
    )}>
      {type === 'HOT'  && <span className="text-red-500">🌡</span>}
      {type === 'COLD' && <span className="text-blue-500">❄</span>}
      {label}
    </span>
  )
}
