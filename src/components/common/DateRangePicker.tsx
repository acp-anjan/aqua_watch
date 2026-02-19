import { cn } from '@/lib/utils'
import { DATE_PRESETS } from '@/lib/constants'

type Preset = typeof DATE_PRESETS[number]

interface DateRangePickerProps {
  value:     Preset
  onChange:  (v: Preset) => void
  className?: string
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  return (
    <div className={cn('inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 gap-0.5', className)}>
      {DATE_PRESETS.map((preset) => (
        <button
          key={preset}
          onClick={() => onChange(preset)}
          className={cn(
            'rounded-md px-3 py-1 text-xs font-medium transition-colors',
            value === preset
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
          )}
        >
          {preset}
        </button>
      ))}
    </div>
  )
}
