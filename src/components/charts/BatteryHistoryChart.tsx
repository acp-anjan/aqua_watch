import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { format, parseISO } from 'date-fns'

export interface BatteryDataPoint {
  date:         string
  batteryLevel: number
}

interface BatteryHistoryChartProps {
  data:     BatteryDataPoint[]
  loading?: boolean
}

const CustomTooltip = ({
  active, payload, label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?:  string
}) => {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  const c = v < 20 ? '#D32F2F' : v < 50 ? '#F9A825' : '#2E7D32'
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-2 text-xs">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-bold font-mono" style={{ color: c }}>{v}%</p>
    </div>
  )
}

function strokeColor(level: number) {
  if (level < 20) return '#D32F2F'
  if (level < 50) return '#F9A825'
  return '#2E7D32'
}

export function BatteryHistoryChart({ data, loading = false }: BatteryHistoryChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
        <div className="h-44 bg-gray-100 rounded" />
      </div>
    )
  }

  const current = data.at(-1)?.batteryLevel ?? 0
  const color   = strokeColor(current)

  const chartData = data.map(d => ({
    ...d,
    label: (() => { try { return format(parseISO(d.date), 'd MMM') } catch { return d.date } })(),
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-800">Battery History</h2>
        <span className="text-xs font-mono font-bold tabular-nums" style={{ color }}>{current}%</span>
      </div>

      <div className="flex-1" style={{ minHeight: 144 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 52, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="bat-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} width={38} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={20}
              stroke="#D32F2F"
              strokeDasharray="4 4"
              label={{ value: 'Critical', fontSize: 9, fill: '#D32F2F', position: 'right' }}
            />
            <ReferenceLine
              y={50}
              stroke="#F9A825"
              strokeDasharray="4 4"
              label={{ value: 'Low', fontSize: 9, fill: '#F9A825', position: 'right' }}
            />
            <Area
              type="monotone"
              dataKey="batteryLevel"
              stroke={color}
              strokeWidth={2}
              fill="url(#bat-grad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
