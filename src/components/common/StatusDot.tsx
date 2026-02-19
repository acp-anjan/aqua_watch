import { cn } from '@/lib/utils'

type StatusVariant = 'active' | 'offline' | 'alerting'

interface StatusDotProps {
  status: StatusVariant
  showLabel?: boolean
  className?: string
}

const CONFIG: Record<StatusVariant, { dot: string; label: string }> = {
  active:   { dot: 'bg-green-500',  label: 'Active'    },
  offline:  { dot: 'bg-red-500',    label: 'Offline'   },
  alerting: { dot: 'bg-orange-500', label: 'Alerting'  },
}

export function StatusDot({ status, showLabel = false, className }: StatusDotProps) {
  const { dot, label } = CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('inline-block h-2 w-2 rounded-full', dot)} />
      {showLabel && (
        <span className="text-xs text-gray-600">{label}</span>
      )}
    </span>
  )
}

export function meterStatus(meter: { isActive: boolean; batteryLevel: number }): StatusVariant {
  if (!meter.isActive) return 'offline'
  if (meter.batteryLevel < 20) return 'alerting'
  return 'active'
}
