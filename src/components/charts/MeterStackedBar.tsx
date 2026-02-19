import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import { COLORS } from '@/lib/constants'
import type { Meter } from '@/types'

interface MeterStackedBarProps {
  meters:   Meter[]
  zoneId:   string
  loading?: boolean
}

const CustomTooltip = ({
  active, payload,
}: {
  active?: boolean
  payload?: { value: number; payload: Meter }[]
}) => {
  if (!active || !payload?.length) return null
  const m = payload[0].payload
  const c = m.meterType === 'HOT' ? COLORS.hot.primary : COLORS.cold.primary
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-2 text-xs">
      <p className="font-semibold text-gray-700 mb-0.5">{m.meterCode}</p>
      <p className="text-gray-400 mb-1">{m.locationLabel}</p>
      <p className="font-mono font-bold" style={{ color: c }}>
        {(m.consumption ?? 0).toLocaleString()} m³
      </p>
    </div>
  )
}

export function MeterStackedBar({ meters, zoneId, loading = false }: MeterStackedBarProps) {
  const navigate = useNavigate()
  const data     = [...meters].sort((a, b) => (b.consumption ?? 0) - (a.consumption ?? 0))

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-48 bg-gray-100 rounded" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-800">Consumption by Meter</h2>
        <span className="text-xs text-gray-400">click bar → meter detail</span>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 32)}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 64, left: 4, bottom: 4 }}
          barCategoryGap="25%"
        >
          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}`} />
          <YAxis
            type="category"
            dataKey="meterCode"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            width={88}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
          <Bar
            dataKey="consumption"
            radius={[0, 4, 4, 0]}
            cursor="pointer"
            onClick={(entry: Meter) =>
              navigate(
                `/dashboard/zone/${zoneId}/building/${entry.buildingId}/meter/${entry.meterId}`,
              )
            }
          >
            {data.map(m => (
              <Cell
                key={m.meterId}
                fill={m.meterType === 'HOT' ? COLORS.hot.primary : COLORS.cold.primary}
                fillOpacity={m.isActive ? 1 : 0.4}
              />
            ))}
            <LabelList
              dataKey="consumption"
              position="right"
              formatter={(v: number) => `${v} m³`}
              style={{ fontSize: 10, fill: '#6b7280' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
