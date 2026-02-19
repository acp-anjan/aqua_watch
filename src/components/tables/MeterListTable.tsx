import { useState, useMemo } from 'react'
import { useNavigate }       from 'react-router-dom'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn }                            from '@/lib/utils'
import { WaterTypeBadge }               from '@/components/common/WaterTypeBadge'
import { StatusDot, meterStatus }       from '@/components/common/StatusDot'
import type { Meter, MeterEvent }       from '@/types'

interface MeterListTableProps {
  meters:     Meter[]
  events:     MeterEvent[]
  zoneId:     string
  buildingId: string
  loading?:   boolean
}

type SortKey = 'meterCode' | 'consumption' | 'currentFlowRate' | 'batteryLevel'
type SortDir = 'asc' | 'desc'

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown size={11} className="text-gray-300" />
  return dir === 'asc'
    ? <ArrowUp   size={11} className="text-gray-700" />
    : <ArrowDown size={11} className="text-gray-700" />
}

function BatteryBar({ level }: { level: number }) {
  const color = level < 20 ? 'bg-red-500' : level < 50 ? 'bg-yellow-400' : 'bg-green-500'
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-14 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${level}%` }} />
      </div>
      <span className="text-xs tabular-nums text-gray-600">{level}%</span>
    </div>
  )
}

export function MeterListTable({
  meters, events, zoneId, buildingId, loading = false,
}: MeterListTableProps) {
  const navigate = useNavigate()
  const [sortKey, setSortKey] = useState<SortKey>('consumption')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const alertMap = useMemo(() => {
    const m: Record<string, number> = {}
    events.filter(e => !e.isResolved).forEach(e => {
      m[e.meterId] = (m[e.meterId] ?? 0) + 1
    })
    return m
  }, [events])

  const sorted = useMemo(() => {
    return [...meters].sort((a, b) => {
      const av = (a[sortKey] as number | string | undefined) ?? ''
      const bv = (b[sortKey] as number | string | undefined) ?? ''
      if (typeof av === 'string') {
        return sortDir === 'asc'
          ? av.localeCompare(bv as string)
          : (bv as string).localeCompare(av)
      }
      return sortDir === 'asc'
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number)
    })
  }, [meters, sortKey, sortDir])

  const handleSort = (col: SortKey) => {
    if (col === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(col); setSortDir('desc') }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-10 bg-gray-100 rounded mb-1" />
        ))}
      </div>
    )
  }

  const cols: { label: string; key: SortKey | null }[] = [
    { label: 'Meter',     key: 'meterCode'       },
    { label: 'Type',      key: null               },
    { label: 'Location',  key: null               },
    { label: 'Consump.',  key: 'consumption'      },
    { label: 'Flow Rate', key: 'currentFlowRate'  },
    { label: 'Battery',   key: 'batteryLevel'     },
    { label: 'Status',    key: null               },
    { label: 'Last Seen', key: null               },
    { label: 'Alerts',    key: null               },
    { label: '',          key: null               },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-800">Meters in Building</h2>
        <span className="text-xs text-gray-400">{meters.length} meters total</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              {cols.map(({ label, key }) => (
                <th
                  key={label}
                  className={cn(
                    'py-2 px-2 text-left font-medium text-gray-500 whitespace-nowrap',
                    key && 'cursor-pointer hover:text-gray-700 select-none',
                  )}
                  onClick={() => key && handleSort(key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    {key && <SortIcon col={key} sortKey={sortKey} dir={sortDir} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(meter => {
              const status   = meterStatus(meter)
              const alertCnt = alertMap[meter.meterId] ?? 0
              return (
                <tr
                  key={meter.meterId}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-2.5 px-2 font-mono font-medium text-gray-800 whitespace-nowrap">
                    {meter.meterCode}
                  </td>
                  <td className="py-2.5 px-2">
                    <WaterTypeBadge type={meter.meterType} />
                  </td>
                  <td className="py-2.5 px-2 text-gray-500 truncate max-w-[160px]">
                    {meter.locationLabel}
                  </td>
                  <td className="py-2.5 px-2 font-mono text-gray-700 whitespace-nowrap">
                    {(meter.consumption ?? 0).toLocaleString()} m³
                  </td>
                  <td className="py-2.5 px-2 font-mono text-gray-700 whitespace-nowrap">
                    {(meter.currentFlowRate ?? 0).toFixed(2)} m³/h
                  </td>
                  <td className="py-2.5 px-2">
                    <BatteryBar level={meter.batteryLevel} />
                  </td>
                  <td className="py-2.5 px-2">
                    <StatusDot status={status} showLabel />
                  </td>
                  <td className="py-2.5 px-2 text-gray-400 whitespace-nowrap">
                    {formatDistanceToNow(parseISO(meter.lastSeenAt), { addSuffix: true })}
                  </td>
                  <td className="py-2.5 px-2">
                    {alertCnt > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold w-5 h-5">
                        {alertCnt}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2">
                    <button
                      onClick={() =>
                        navigate(
                          `/dashboard/zone/${zoneId}/building/${buildingId}/meter/${meter.meterId}`,
                        )
                      }
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                    >
                      View <ExternalLink size={11} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
