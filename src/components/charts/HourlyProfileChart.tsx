import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { COLORS } from '@/lib/constants'
import type { HourlyProfilePoint } from '@/types'

interface HourlyProfileChartProps {
  data:     HourlyProfilePoint[]
  loading?: boolean
}

const CustomTooltip = ({
  active, payload, label,
}: {
  active?: boolean
  payload?: { color: string; name: string; value: number }[]
  label?:   string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }} className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-mono font-medium text-gray-900">{p.value.toFixed(2)} m³/h</span>
        </div>
      ))}
    </div>
  )
}

export function HourlyProfileChart({ data, loading = false }: HourlyProfileChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-52 bg-gray-100 rounded" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-800">Average Hourly Usage Profile</h2>
        <span className="text-xs text-gray-400">avg m³/h per hour of day</span>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-hrly-hot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={COLORS.hot.primary}  stopOpacity={0.25} />
                <stop offset="95%" stopColor={COLORS.hot.primary}  stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="grad-hrly-cold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={COLORS.cold.primary} stopOpacity={0.25} />
                <stop offset="95%" stopColor={COLORS.cold.primary} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}`} width={34} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="hot"
              name="Hot"
              stroke={COLORS.hot.primary}
              strokeWidth={2}
              fill="url(#grad-hrly-hot)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="cold"
              name="Cold"
              stroke={COLORS.cold.primary}
              strokeWidth={2}
              fill="url(#grad-hrly-cold)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
