import { useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { COLORS } from '@/lib/constants'
import type { TimeSeriesPoint } from '@/types'

interface ConsumptionTrendChartProps {
  data:     TimeSeriesPoint[]
  loading?: boolean
  title?:   string
}

type Granularity = 'Daily' | 'Weekly'

function downsample(data: TimeSeriesPoint[], gran: Granularity): TimeSeriesPoint[] {
  if (gran === 'Daily' || data.length === 0) return data
  // Weekly: group by week (every 7 points)
  const weeks: TimeSeriesPoint[] = []
  for (let i = 0; i < data.length; i += 7) {
    const chunk = data.slice(i, i + 7)
    weeks.push({
      ts:    chunk[0].ts,
      total: Math.round(chunk.reduce((s, p) => s + p.total, 0)),
      hot:   Math.round(chunk.reduce((s, p) => s + p.hot,   0)),
      cold:  Math.round(chunk.reduce((s, p) => s + p.cold,  0)),
    })
  }
  return weeks
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: { color: string; name: string; value: number }[]
  label?:   string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }} className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-mono font-medium text-gray-900">{p.value.toLocaleString()} m³</span>
        </div>
      ))}
    </div>
  )
}

export function ConsumptionTrendChart({ data, loading = false, title = 'Consumption Trend' }: ConsumptionTrendChartProps) {
  const [granularity, setGranularity] = useState<Granularity>('Daily')
  const [showTotal, setShowTotal] = useState(true)
  const [showHot,   setShowHot]   = useState(true)
  const [showCold,  setShowCold]  = useState(true)

  const chartData = downsample(data, granularity).map((p) => ({
    ...p,
    label: (() => {
      try { return format(parseISO(p.ts), granularity === 'Daily' ? 'd MMM' : "'Wk' d MMM") }
      catch { return p.ts }
    })()
  }))

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Series toggles */}
          <div className="flex items-center gap-2">
            {[
              { key: 'total', label: 'Total',  color: COLORS.total.primary, on: showTotal, set: setShowTotal },
              { key: 'hot',   label: 'Hot',    color: COLORS.hot.primary,   on: showHot,   set: setShowHot   },
              { key: 'cold',  label: 'Cold',   color: COLORS.cold.primary,  on: showCold,  set: setShowCold  },
            ].map(({ key, label, color, on, set }) => (
              <button
                key={key}
                onClick={() => set(!on)}
                className={cn(
                  'flex items-center gap-1.5 text-xs rounded-full px-2 py-0.5 border transition-colors',
                  on ? 'bg-white shadow-sm' : 'bg-gray-50 opacity-50'
                )}
                style={{ borderColor: on ? color : '#e5e7eb', color }}
              >
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                {label}
              </button>
            ))}
          </div>

          {/* Granularity */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            {(['Daily', 'Weekly'] as Granularity[]).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={cn(
                  'px-3 py-1.5 font-medium transition-colors',
                  granularity === g ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLORS.total.primary} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS.total.primary} stopOpacity={0}   />
            </linearGradient>
            <linearGradient id="gradHot" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLORS.hot.primary} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS.hot.primary} stopOpacity={0}   />
            </linearGradient>
            <linearGradient id="gradCold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLORS.cold.primary} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS.cold.primary} stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span style={{ fontSize: 11, color: '#6b7280' }}>{value}</span>}
            wrapperStyle={{ paddingTop: 8 }}
          />
          {showTotal && (
            <Area type="monotone" dataKey="total" name="Total"
              stroke={COLORS.total.primary} strokeWidth={2}
              fill="url(#gradTotal)" dot={false} />
          )}
          {showHot && (
            <Area type="monotone" dataKey="hot" name="Hot"
              stroke={COLORS.hot.primary} strokeWidth={2}
              fill="url(#gradHot)" dot={false} />
          )}
          {showCold && (
            <Area type="monotone" dataKey="cold" name="Cold"
              stroke={COLORS.cold.primary} strokeWidth={2}
              fill="url(#gradCold)" dot={false} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
