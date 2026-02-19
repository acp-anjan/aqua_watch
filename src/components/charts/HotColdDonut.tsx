import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { COLORS } from '@/lib/constants'
import type { HotColdBreakdown } from '@/types'

interface HotColdDonutProps {
  data:     HotColdBreakdown
  loading?: boolean
}

const RADIAN = Math.PI / 180
const renderCustomLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent
}: {
  cx: number; cy: number; midAngle: number
  innerRadius: number; outerRadius: number; percent: number
}) => {
  if (percent < 0.05) return null
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5
  const x  = cx + r * Math.cos(-midAngle * RADIAN)
  const y  = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const CustomTooltip = ({ active, payload }: {
  active?: boolean
  payload?: { name: string; value: number; payload: { color: string } }[]
}) => {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-2 text-xs">
      <span style={{ color: p.payload.color }} className="font-semibold">{p.name}</span>
      <span className="ml-2 font-mono text-gray-700">{p.value.toLocaleString()} m³</span>
    </div>
  )
}

export function HotColdDonut({ data, loading = false }: HotColdDonutProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 h-full">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-48 bg-gray-100 rounded-full mx-auto w-48 animate-pulse" />
      </div>
    )
  }

  const segments = [
    { name: 'Hot',   value: data.hot,   color: COLORS.hot.primary   },
    { name: 'Cold',  value: data.cold,  color: COLORS.cold.primary  },
    { name: 'Mixed', value: data.mixed, color: COLORS.total.primary  },
  ].filter((s) => s.value > 0)

  const summaryRows = [
    { label: 'Hot',   value: data.hot,   pct: data.hot   / data.total, color: COLORS.hot.primary,   icon: '🌡' },
    { label: 'Cold',  value: data.cold,  pct: data.cold  / data.total, color: COLORS.cold.primary,  icon: '❄' },
    { label: 'Mixed', value: data.mixed, pct: data.mixed / data.total, color: COLORS.total.primary, icon: '💧' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 h-full flex flex-col">
      <h2 className="text-sm font-semibold text-gray-800 mb-2">Hot vs Cold Breakdown</h2>

      <div className="flex-1 min-h-0 flex flex-col">
        {/* Donut */}
        <div className="h-52 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={88}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
                isAnimationActive={false}
              >
                {segments.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 tabular-nums">
                {data.total.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">m³ total</div>
            </div>
          </div>
        </div>

        {/* Summary table */}
        <div className="mt-3 divide-y divide-gray-100">
          {summaryRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1.5 text-xs">
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: row.color }} />
                {row.icon} {row.label}
              </span>
              <span className="font-mono font-medium text-gray-900">
                {row.value.toLocaleString()} m³
              </span>
              <span className="text-gray-400 w-12 text-right">
                {(row.pct * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
