import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WaterTypeBadge }  from '@/components/common/WaterTypeBadge'
import { StatusDot, meterStatus } from '@/components/common/StatusDot'
import type { Meter, Building, Zone } from '@/types'

interface TopMetersTableProps {
  meters:    Meter[]
  buildings: Building[]
  zones:     Zone[]
  limit?:    number
  loading?:  boolean
}

type SortKey = 'consumption' | 'currentFlowRate' | 'batteryLevel'
type SortDir = 'asc' | 'desc'

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown size={12} className="text-gray-300" />
  return dir === 'asc'
    ? <ArrowUp size={12} className="text-gray-700" />
    : <ArrowDown size={12} className="text-gray-700" />
}

export function TopMetersTable({ meters, buildings, zones, limit = 10, loading = false }: TopMetersTableProps) {
  const navigate = useNavigate()
  const [sortKey, setSortKey] = useState<SortKey>('consumption')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const buildingMap = Object.fromEntries(buildings.map((b) => [b.buildingId, b]))
  const zoneMap     = Object.fromEntries(zones.map((z)     => [z.zoneId,     z]))

  const sorted = [...meters]
    .sort((a, b) => {
      const av = (a[sortKey] ?? 0)
      const bv = (b[sortKey] ?? 0)
      return sortDir === 'asc' ? av - bv : bv - av
    })
    .slice(0, limit)

  const handleSort = (col: SortKey) => {
    if (col === sortKey) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(col); setSortDir('desc') }
  }

  const handleRowClick = (m: Meter) => {
    navigate(`/dashboard/zone/${m.zoneId}/building/${m.buildingId}/meter/${m.meterId}`)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse mb-1" />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-800">Top Meters</h2>
        <span className="text-xs text-gray-400">by consumption, click to view detail</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              {[
                { label: 'Meter',       key: null              },
                { label: 'Building',    key: null              },
                { label: 'Type',        key: null              },
                { label: 'Consumption', key: 'consumption'     },
                { label: 'Flow Rate',   key: 'currentFlowRate' },
                { label: 'Battery',     key: 'batteryLevel'    },
                { label: 'Status',      key: null              },
                { label: 'Last Seen',   key: null              },
              ].map(({ label, key }) => (
                <th
                  key={label}
                  className={cn(
                    'py-2 px-2 text-left font-medium text-gray-500 whitespace-nowrap',
                    key ? 'cursor-pointer hover:text-gray-700 select-none' : ''
                  )}
                  onClick={() => key && handleSort(key as SortKey)}
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    {key && <SortIcon col={key as SortKey} sortKey={sortKey} dir={sortDir} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((meter) => {
              const building = buildingMap[meter.buildingId]
              const zone     = zoneMap[meter.zoneId]
              const status   = meterStatus(meter)

              return (
                <tr
                  key={meter.meterId}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(meter)}
                >
                  {/* Meter code */}
                  <td className="py-2.5 px-2 font-mono font-medium text-gray-800">
                    {meter.meterCode}
                  </td>

                  {/* Building */}
                  <td className="py-2.5 px-2 text-gray-500">
                    <div>{building?.buildingName ?? meter.buildingId}</div>
                    <div className="text-gray-400 text-[10px]">{zone?.zoneName}</div>
                  </td>

                  {/* Type */}
                  <td className="py-2.5 px-2">
                    <WaterTypeBadge type={meter.meterType} />
                  </td>

                  {/* Consumption */}
                  <td className="py-2.5 px-2 font-mono text-gray-800 text-right">
                    {meter.consumption?.toLocaleString() ?? '—'}
                    <span className="text-gray-400 ml-1">m³</span>
                  </td>

                  {/* Flow rate */}
                  <td className="py-2.5 px-2 font-mono text-gray-600 text-right">
                    {meter.currentFlowRate != null
                      ? `${meter.currentFlowRate.toFixed(2)} m³/h`
                      : '—'}
                  </td>

                  {/* Battery */}
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 w-12 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${meter.batteryLevel}%`,
                            background: meter.batteryLevel < 20 ? '#ef4444' : meter.batteryLevel < 50 ? '#f59e0b' : '#22c55e'
                          }}
                        />
                      </div>
                      <span className={cn(
                        'font-mono tabular-nums',
                        meter.batteryLevel < 20 ? 'text-red-600' : 'text-gray-600'
                      )}>
                        {meter.batteryLevel}%
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-2">
                    <StatusDot status={status} showLabel />
                  </td>

                  {/* Last seen */}
                  <td className="py-2.5 px-2 text-gray-400 whitespace-nowrap">
                    {(() => {
                      try { return formatDistanceToNow(parseISO(meter.lastSeenAt), { addSuffix: true }) }
                      catch { return '—' }
                    })()}
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
