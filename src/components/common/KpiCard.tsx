import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title:         string
  value:         string | number
  unit?:         string
  subText?:      string
  delta?:        number        // % change vs previous period
  sparkline?:    number[]      // 7-point sparkline values
  colorVariant?: 'default' | 'hot' | 'cold' | 'alert' | 'battery'
  loading?:      boolean
}

const VARIANT_STYLES: Record<string, {
  border: string; sparkColor: string; deltaUp: string; deltaDown: string
}> = {
  default:  { border: 'border-gray-200',  sparkColor: '#546E7A', deltaUp: 'text-green-600', deltaDown: 'text-red-600'    },
  hot:      { border: 'border-red-200',   sparkColor: '#E53935', deltaUp: 'text-green-600', deltaDown: 'text-red-600'    },
  cold:     { border: 'border-blue-200',  sparkColor: '#1E88E5', deltaUp: 'text-green-600', deltaDown: 'text-red-600'    },
  alert:    { border: 'border-orange-200',sparkColor: '#F57C00', deltaUp: 'text-red-600',   deltaDown: 'text-green-600'  },
  battery:  { border: 'border-yellow-200',sparkColor: '#F9A825', deltaUp: 'text-green-600', deltaDown: 'text-red-600'    },
}

export function KpiCard({
  title, value, unit, subText, delta, sparkline, colorVariant = 'default', loading = false
}: KpiCardProps) {
  const styles = VARIANT_STYLES[colorVariant]
  const sparkData = (sparkline ?? []).map((v) => ({ v }))

  const DeltaIcon = delta === undefined
    ? null
    : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus

  const deltaColor = delta === undefined
    ? ''
    : delta > 0 ? styles.deltaUp : delta < 0 ? styles.deltaDown : 'text-gray-400'

  if (loading) {
    return (
      <div className={cn('bg-white rounded-xl border p-4 space-y-3 animate-pulse', styles.border)}>
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-8 w-20 bg-gray-200 rounded" />
        <div className="h-10 w-full bg-gray-100 rounded" />
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-xl border p-4 flex flex-col gap-1', styles.border)}>
      {/* Title row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
          {title}
        </span>
        {DeltaIcon && delta !== undefined && (
          <span className={cn('flex items-center gap-0.5 text-xs font-medium', deltaColor)}>
            <DeltaIcon size={12} />
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900 tabular-nums leading-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>

      {/* Sub text */}
      {subText && (
        <span className="text-xs text-gray-400">{subText}</span>
      )}

      {/* Sparkline */}
      {sparkData.length > 0 && (
        <div className="mt-auto pt-2 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${colorVariant}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={styles.sparkColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={styles.sparkColor} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={styles.sparkColor}
                strokeWidth={2}
                fill={`url(#spark-${colorVariant})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
