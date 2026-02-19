import { useMemo } from 'react'
import type { Building, Meter, HourlyProfilePoint } from '@/types'

interface FlowRateHeatmapProps {
  buildings:     Building[]
  meters:        Meter[]
  hourlyProfile: HourlyProfilePoint[]
  loading?:      boolean
}

const SLOTS = [0, 3, 6, 9, 12, 15, 18, 21]

function buildSlots(profile: HourlyProfilePoint[]): { label: string; factor: number }[] {
  const maxTotal = profile.reduce((m, p) => Math.max(m, p.total), 0) || 1
  return SLOTS.map(s => {
    const chunk = profile.filter(p => p.hour >= s && p.hour < s + 3)
    const avg   = chunk.reduce((a, b) => a + b.total, 0) / Math.max(chunk.length, 1)
    return { label: `${String(s).padStart(2, '0')}:00`, factor: avg / maxTotal }
  })
}

function heatColor(norm: number): string {
  const r = Math.round(227 - norm * 197)
  const g = Math.round(242 - norm * 167)
  const b = Math.round(253 - norm * 100)
  return `rgb(${r},${g},${b})`
}

export function FlowRateHeatmap({
  buildings, meters, hourlyProfile, loading = false,
}: FlowRateHeatmapProps) {
  const slots = useMemo(() => buildSlots(hourlyProfile), [hourlyProfile])

  const matrix = useMemo(() => buildings.map(b => {
    const bMeters = meters.filter(m => m.buildingId === b.buildingId && m.isActive)
    const base    = bMeters.reduce((s, m) => s + (m.currentFlowRate ?? 0), 0)
    return {
      building: b,
      values:   slots.map(s => Math.round(base * s.factor * 100) / 100),
    }
  }), [buildings, meters, slots])

  const allVals = matrix.flatMap(r => r.values)
  const maxVal  = Math.max(...allVals, 0.01)

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-40 bg-gray-100 rounded" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-800">Flow Rate Heatmap</h2>
        <span className="text-xs text-gray-400">m³/h — buildings × time of day</span>
      </div>

      <div className="overflow-x-auto">
        <table className="text-xs min-w-max w-full border-separate border-spacing-0.5">
          <thead>
            <tr>
              <th className="w-28 text-left font-medium text-gray-500 pb-1 pr-2" />
              {slots.map(s => (
                <th key={s.label} className="font-medium text-gray-500 pb-1 px-1 text-center w-16">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map(({ building, values }) => (
              <tr key={building.buildingId}>
                <td className="font-medium text-gray-700 pr-2 py-0.5 truncate">
                  {building.buildingName}
                </td>
                {values.map((v, i) => {
                  const norm  = v / maxVal
                  const bg    = heatColor(norm)
                  const color = norm > 0.6 ? '#fff' : '#374151'
                  return (
                    <td
                      key={i}
                      className="px-1 py-1.5 text-center rounded font-mono tabular-nums"
                      style={{ background: bg, color }}
                      title={`${building.buildingName} @ ${slots[i].label}: ${v.toFixed(2)} m³/h`}
                    >
                      {v.toFixed(2)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
        <span>Low</span>
        <div className="flex h-3 w-24 rounded overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-1" style={{ background: heatColor(i / 7) }} />
          ))}
        </div>
        <span>High</span>
      </div>
    </div>
  )
}
