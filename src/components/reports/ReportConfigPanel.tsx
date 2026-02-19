import { useState } from 'react'
import {
  FileText, FileSpreadsheet, FileJson, File,
  Calendar, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReportFormat } from '@/types'

export type WaterTypeFilter    = 'ALL' | 'HOT' | 'COLD'
export type GranularityFilter  = 'DAILY' | 'WEEKLY' | 'MONTHLY'
export type ReportMode         = 'ON_DEMAND' | 'SCHEDULE'
export type ScheduleFrequency  = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface ReportConfig {
  dateFrom:    string
  dateTo:      string
  zoneId:      string    // '' = all zones
  buildingId:  string    // '' = all buildings
  waterType:   WaterTypeFilter
  granularity: GranularityFilter
  format:      ReportFormat
  mode:        ReportMode
  schedName:   string
  schedFreq:   ScheduleFrequency
  schedEmail:  string
}

interface Zone     { zoneId: string; zoneName: string }
interface Building { buildingId: string; buildingName: string; zoneId: string }

interface ReportConfigPanelProps {
  zones:        Zone[]
  buildings:    Building[]
  disabled:     boolean
  onGenerate:   (cfg: ReportConfig) => void
  onSchedule:   (cfg: ReportConfig) => void
}

const FORMAT_OPTS: { value: ReportFormat; label: string; icon: React.ReactNode }[] = [
  { value: 'PDF',  label: 'PDF',   icon: <File            size={15} /> },
  { value: 'XLSX', label: 'Excel', icon: <FileSpreadsheet size={15} /> },
  { value: 'CSV',  label: 'CSV',   icon: <FileText        size={15} /> },
  { value: 'JSON', label: 'JSON',  icon: <FileJson        size={15} /> },
]

const TODAY = new Date().toISOString().slice(0, 10)
const THIRTY_AGO = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)

export function ReportConfigPanel({
  zones,
  buildings,
  disabled,
  onGenerate,
  onSchedule,
}: ReportConfigPanelProps) {
  const [cfg, setCfg] = useState<ReportConfig>({
    dateFrom:    THIRTY_AGO,
    dateTo:      TODAY,
    zoneId:      '',
    buildingId:  '',
    waterType:   'ALL',
    granularity: 'DAILY',
    format:      'PDF',
    mode:        'ON_DEMAND',
    schedName:   '',
    schedFreq:   'WEEKLY',
    schedEmail:  '',
  })

  const set = <K extends keyof ReportConfig>(k: K, v: ReportConfig[K]) =>
    setCfg(prev => ({ ...prev, [k]: v }))

  const filteredBuildings = cfg.zoneId
    ? buildings.filter(b => b.zoneId === cfg.zoneId)
    : buildings

  const handleDatePreset = (days: number | null) => {
    if (days === null) return
    const to   = new Date()
    const from = new Date(Date.now() - days * 86400_000)
    set('dateFrom', from.toISOString().slice(0, 10))
    set('dateTo',   to.toISOString().slice(0, 10))
  }

  return (
    <div className="space-y-5">

      {/* ── Date Range ───────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Date Range
        </h3>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {([['7D', 7], ['30D', 30], ['This Month', null], ['Last 90D', 90]] as [string, number | null][]).map(([label, days]) => (
            <button
              key={label}
              type="button"
              onClick={() => handleDatePreset(days)}
              className="text-xs px-2.5 py-1 rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-600 hover:text-blue-700 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <div className="relative">
              <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={cfg.dateFrom}
                onChange={e => set('dateFrom', e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <div className="relative">
              <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={cfg.dateTo}
                onChange={e => set('dateTo', e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Scope ────────────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Scope
        </h3>
        <div className="space-y-1.5">
          <SelectField
            label="Zone"
            value={cfg.zoneId}
            onChange={v => { set('zoneId', v); set('buildingId', '') }}
            options={[{ value: '', label: 'All Zones' }, ...zones.map(z => ({ value: z.zoneId, label: z.zoneName }))]}
          />
          <SelectField
            label="Building"
            value={cfg.buildingId}
            onChange={v => set('buildingId', v)}
            options={[{ value: '', label: 'All Buildings' }, ...filteredBuildings.map(b => ({ value: b.buildingId, label: b.buildingName }))]}
          />
        </div>
      </section>

      {/* ── Water Type ───────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Water Type
        </h3>
        <div className="flex gap-2">
          {(['ALL', 'HOT', 'COLD'] as WaterTypeFilter[]).map(wt => (
            <RadioButton
              key={wt}
              label={wt === 'ALL' ? 'All' : wt === 'HOT' ? '🔴 Hot' : '🔵 Cold'}
              checked={cfg.waterType === wt}
              onClick={() => set('waterType', wt)}
            />
          ))}
        </div>
      </section>

      {/* ── Granularity ──────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Granularity
        </h3>
        <div className="flex gap-2">
          {(['DAILY', 'WEEKLY', 'MONTHLY'] as GranularityFilter[]).map(g => (
            <RadioButton
              key={g}
              label={g.charAt(0) + g.slice(1).toLowerCase()}
              checked={cfg.granularity === g}
              onClick={() => set('granularity', g)}
            />
          ))}
        </div>
      </section>

      {/* ── Format ───────────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Output Format
        </h3>
        <div className="flex gap-2 flex-wrap">
          {FORMAT_OPTS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => set('format', f.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                cfg.format === f.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Mode ─────────────────────────────────────────────── */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Mode
        </h3>
        <div className="flex gap-2 mb-3">
          {(['ON_DEMAND', 'SCHEDULE'] as ReportMode[]).map(m => (
            <RadioButton
              key={m}
              label={m === 'ON_DEMAND' ? 'On-Demand' : 'Schedule'}
              checked={cfg.mode === m}
              onClick={() => set('mode', m)}
            />
          ))}
        </div>

        {cfg.mode === 'SCHEDULE' && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 space-y-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Schedule Name</label>
              <input
                type="text"
                placeholder="e.g. Monthly Zone Report"
                value={cfg.schedName}
                onChange={e => set('schedName', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Frequency</label>
              <div className="flex gap-2">
                {(['DAILY', 'WEEKLY', 'MONTHLY'] as ScheduleFrequency[]).map(f => (
                  <RadioButton
                    key={f}
                    label={f.charAt(0) + f.slice(1).toLowerCase()}
                    checked={cfg.schedFreq === f}
                    onClick={() => set('schedFreq', f)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email Recipients</label>
              <input
                type="email"
                placeholder="email@example.com"
                value={cfg.schedEmail}
                onChange={e => set('schedEmail', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-0.5">Separate multiple with commas</p>
            </div>
          </div>
        )}
      </section>

      {/* ── Action Button ─────────────────────────────────────── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => cfg.mode === 'ON_DEMAND' ? onGenerate(cfg) : onSchedule(cfg)}
        className={cn(
          'w-full py-2.5 rounded-xl text-sm font-semibold transition-colors',
          disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
        )}
      >
        {cfg.mode === 'ON_DEMAND' ? '⚡ Generate Report' : '📅 Save Schedule'}
      </button>
    </div>
  )
}

// ─── Small helper sub-components ─────────────────────────────────────────────

function RadioButton({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
        checked
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
      )}
    >
      <span className={cn(
        'w-3 h-3 rounded-full border-2 flex-shrink-0',
        checked ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'
      )} />
      {label}
    </button>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label:    string
  value:    string
  onChange: (v: string) => void
  options:  { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none pl-2.5 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  )
}
