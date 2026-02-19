import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, LabelList
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { COLORS } from '@/lib/constants'
import type { ZoneComparison } from '@/types'

interface ZoneComparisonBarProps {
  data:     ZoneComparison[]
  loading?: boolean
}

const CustomTooltip = ({ active, payload, label }: {
  active?:  boolean
  payload?: { color: string; name: string; value: number }[]
  label?:   string
}) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + p.value, 0)
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-mono font-medium text-gray-900">{p.value.toLocaleString()} m³</span>
        </div>
      ))}
      <div className="border-t border-gray-100 mt-1.5 pt-1.5 flex justify-between">
        <span className="text-gray-500">Total</span>
        <span className="font-mono font-semibold text-gray-900">{total.toLocaleString()} m³</span>
      </div>
      <p className="mt-1.5 text-gray-400 italic">Click to view zone dashboard →</p>
    </div>
  )
}

export function ZoneComparisonBar({ data, loading = false }: ZoneComparisonBarProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 h-full">
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const chartData = data.map((z) => ({
    name:   z.zoneName,
    zoneId: z.zoneId,
    hot:    z.hot,
    cold:   z.cold,
    total:  z.hot + z.cold,
  }))

  const handleBarClick = (d: { zoneId?: string }) => {
    if (d?.zoneId) navigate(`/dashboard/zone/${d.zoneId}`)
  }

  const barHeight = 36
  const chartHeight = Math.max(160, chartData.length * (barHeight + 12) + 24)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 h-full flex flex-col">
      <h2 className="text-sm font-semibold text-gray-800 mb-1">Zone Comparison</h2>
      <p className="text-xs text-gray-400 mb-4">Click a zone to drill down</p>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v/1000).toFixed(1)}k`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: '#374151' }}
              tickLine={false}
              axisLine={false}
              width={72}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
            <Bar
              dataKey="hot"
              name="Hot"
              stackId="a"
              fill={COLORS.hot.primary}
              radius={[0, 0, 0, 0]}
              onClick={handleBarClick}
              cursor="pointer"
            />
            <Bar
              dataKey="cold"
              name="Cold"
              stackId="a"
              fill={COLORS.cold.primary}
              radius={[0, 4, 4, 0]}
              onClick={handleBarClick}
              cursor="pointer"
            >
              <LabelList
                dataKey="total"
                position="right"
                style={{ fontSize: 11, fill: '#6b7280' }}
                formatter={(v: number) => `${v.toLocaleString()}`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: COLORS.hot.primary  }} />
          Hot water
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: COLORS.cold.primary }} />
          Cold water
        </span>
        <span className="text-xs text-gray-400 ml-auto">Values in m³</span>
      </div>
    </div>
  )
}
