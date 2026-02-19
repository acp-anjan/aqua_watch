import { cn } from '@/lib/utils'
import { EVENT_TYPES } from '@/lib/constants'
import type { EventType } from '@/types'

interface AlertBadgeProps {
  eventType: EventType
  className?: string
}

export function AlertBadge({ eventType, className }: AlertBadgeProps) {
  const config = EVENT_TYPES[eventType]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
        className
      )}
      style={{ backgroundColor: config.color + '22', color: config.color, border: `1px solid ${config.color}44` }}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}
