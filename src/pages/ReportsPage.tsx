import { useState, useCallback, useRef } from 'react'
import {
  BarChart2, Droplets, Activity, AlertTriangle,
  BatteryLow, GitCompare, Building2, Database,
} from 'lucide-react'

import { AppShell }              from '@/components/layout/AppShell'
import { Breadcrumb }            from '@/components/layout/Breadcrumb'
import { useRegion }             from '@/context/RegionContext'
import { useMockData }           from '@/hooks/useMockData'

import { ReportTypeCard }        from '@/components/reports/ReportTypeCard'
import type { ReportTypeDefinition } from '@/components/reports/ReportTypeCard'
import { ReportConfigPanel }     from '@/components/reports/ReportConfigPanel'
import type { ReportConfig }     from '@/components/reports/ReportConfigPanel'
import { ReportJobQueue }        from '@/components/reports/ReportJobQueue'
import { ScheduledReportList }   from '@/components/reports/ScheduledReportList'

import type { Zone, Building, Meter, MeterEvent, ReportJob, ScheduledReport, ReportFormat } from '@/types'
import { triggerDownload } from '@/lib/report-generator'

// ─── Report type catalogue ───────────────────────────────────────────────────

const REPORT_TYPES: ReportTypeDefinition[] = [
  {
    id:          'consumption-summary',
    label:       'Consumption Summary',
    description: 'Total, hot & cold volumes over a period',
    icon:        <BarChart2 size={18} />,
  },
  {
    id:          'hot-cold-report',
    label:       'Hot / Cold Report',
    description: 'Breakdown of hot vs cold water usage',
    icon:        <Droplets size={18} />,
  },
  {
    id:          'meter-status',
    label:       'Meter Status Report',
    description: 'Active, offline and alerting meters',
    icon:        <Activity size={18} />,
  },
  {
    id:          'alert-event-log',
    label:       'Alert / Event Log',
    description: 'All tamper, leakage and anomaly events',
    icon:        <AlertTriangle size={18} />,
  },
  {
    id:          'battery-report',
    label:       'Battery Report',
    description: 'Battery levels and replacement forecast',
    icon:        <BatteryLow size={18} />,
  },
  {
    id:          'zone-comparison',
    label:       'Zone Comparison',
    description: 'Side-by-side consumption across zones',
    icon:        <GitCompare size={18} />,
  },
  {
    id:          'building-comparison',
    label:       'Building Comparison',
    description: 'Per-building usage within a zone',
    icon:        <Building2 size={18} />,
  },
  {
    id:          'raw-readings-export',
    label:       'Raw Readings Export',
    description: 'Full meter reading records (CSV/JSON)',
    icon:        <Database size={18} />,
  },
]

let nextJobCounter = 6   // starts after the 5 seeded jobs

function makeJobId() {
  return `RPT-${String(nextJobCounter++).padStart(3, '0')}`
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const { activeRegion } = useRegion()

  // ── Remote mock data ──────────────────────────────────────────────────────
  const { data: zones }         = useMockData<Zone[]>(() => import('@/mock/zones.json'))
  const { data: allBuildings }  = useMockData<Building[]>(() => import('@/mock/buildings.json'))
  const { data: allMeters }     = useMockData<Meter[]>(() => import('@/mock/meters.json'))
  const { data: allEvents }     = useMockData<MeterEvent[]>(() => import('@/mock/meter-events.json'))
  const { data: seedJobs }      = useMockData<ReportJob[]>(() => import('@/mock/report-jobs.json'))
  const { data: seedSchedules } = useMockData<ScheduledReport[]>(() => import('@/mock/scheduled-reports.json'))

  // ── Local UI state ────────────────────────────────────────────────────────
  const [selectedType,    setSelectedType]    = useState<string>('consumption-summary')
  const [activeTab,       setActiveTab]       = useState<'queue' | 'scheduled'>('queue')
  const [generating,      setGenerating]      = useState(false)
  const [toast,           setToast]           = useState<string | null>(null)
  const [extraJobs,       setExtraJobs]       = useState<ReportJob[]>([])
  const [extraSchedules,  setExtraSchedules]  = useState<ScheduledReport[]>([])

  // Store report config keyed by jobId so Download knows what to generate
  const jobConfigRef = useRef<Map<string, ReportConfig>>(new Map())

  const regionZones      = (zones ?? []).filter(z => z.regionId === activeRegion?.regionId)
  const regionBuildings  = (allBuildings ?? []).filter(b =>
    regionZones.some(z => z.zoneId === b.zoneId)
  )

  const allJobs: ReportJob[] = [...extraJobs, ...(seedJobs ?? [])]
  const allSchedules: ScheduledReport[] = [...extraSchedules, ...(seedSchedules ?? [])]

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  // ── Generate (On-Demand) ─────────────────────────────────────────────────
  const handleGenerate = useCallback((cfg: ReportConfig) => {
    const typeDef = REPORT_TYPES.find(r => r.id === selectedType)
    if (!typeDef) return

    const jobId = makeJobId()
    const now   = new Date().toISOString()
    const newJob: ReportJob = {
      jobId,
      reportType:  typeDef.label,
      format:      cfg.format as ReportFormat,
      status:      'PROCESSING',
      requestedAt: now,
    }

    // Persist the config so handleDownload can regenerate the data
    jobConfigRef.current.set(jobId, cfg)

    setExtraJobs(prev => [newJob, ...prev])
    setActiveTab('queue')
    setGenerating(true)

    setTimeout(() => {
      setExtraJobs(prev => prev.map(j =>
        j.jobId === jobId
          ? { ...j, status: 'READY', completedAt: new Date().toISOString() }
          : j
      ))
      setGenerating(false)
      showToast(`✅ ${typeDef.label} (${cfg.format}) is ready — click Download.`)
    }, 3000)
  }, [selectedType])

  // ── Save Schedule ─────────────────────────────────────────────────────────
  const handleSchedule = useCallback((cfg: ReportConfig) => {
    const typeDef = REPORT_TYPES.find(r => r.id === selectedType)
    if (!typeDef) return
    if (!cfg.schedName.trim()) { showToast('⚠️  Please enter a schedule name.'); return }

    const nextRun = new Date(Date.now() + 86400_000).toISOString()
    const newSched: ScheduledReport = {
      scheduleId:      `SCH-${Date.now()}`,
      name:            cfg.schedName.trim(),
      reportType:      typeDef.label,
      format:          cfg.format,
      frequency:       cfg.schedFreq,
      nextRunAt:       nextRun,
      isActive:        true,
      emailRecipients: cfg.schedEmail ? cfg.schedEmail.split(',').map(e => e.trim()) : [],
    }

    setExtraSchedules(prev => [newSched, ...prev])
    setActiveTab('scheduled')
    showToast(`📅  Schedule "${cfg.schedName}" saved.`)
  }, [selectedType])

  // ── Job actions ───────────────────────────────────────────────────────────
  const handleRetry = (jobId: string) => {
    setExtraJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, status: 'PROCESSING', errorMessage: undefined } : j))
    setTimeout(() => {
      setExtraJobs(prev => prev.map(j =>
        j.jobId === jobId ? { ...j, status: 'READY', completedAt: new Date().toISOString() } : j
      ))
      showToast('✅ Report is ready.')
    }, 3000)
  }

  const handleCancel = (jobId: string) => {
    setExtraJobs(prev => prev.filter(j => j.jobId !== jobId))
    showToast('Report request cancelled.')
  }

  const handleDownload = (jobId: string) => {
    const job = allJobs.find(j => j.jobId === jobId)
    if (!job) return

    // Retrieve the saved config for this job (may be undefined for seeded/seed jobs)
    const cfg = jobConfigRef.current.get(jobId)

    const regionMeters    = (allMeters ?? []).filter(m =>
      regionZones.some(z => z.zoneId === m.zoneId)
    )
    const regionEvents    = (allEvents ?? []).filter(e =>
      regionZones.some(z => z.zoneId === e.zoneId)
    )

    const dataSources = {
      zones:      regionZones,
      buildings:  regionBuildings,
      meters:     regionMeters,
      events:     regionEvents,
      regionName: activeRegion?.regionName ?? 'Region',
      reportType: job.reportType,
      dateFrom:   cfg?.dateFrom ?? '—',
      dateTo:     cfg?.dateTo   ?? '—',
    }

    const slug     = job.reportType.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const date     = new Date().toISOString().slice(0, 10)
    const filename = `${slug}_${date}_${job.jobId}`

    triggerDownload(dataSources, job.format, filename)
    showToast(`⬇️  Downloading ${job.reportType} (${job.format})…`)
  }

  // ── Schedule actions ──────────────────────────────────────────────────────
  const handleToggleSchedule = (scheduleId: string, active: boolean) => {
    const toggle = (list: ScheduledReport[]) =>
      list.map(s => s.scheduleId === scheduleId ? { ...s, isActive: active } : s)
    setExtraSchedules(prev => toggle(prev))
    showToast(active ? '▶️  Schedule activated.' : '⏸  Schedule paused.')
  }

  const handleDeleteSchedule = (scheduleId: string) => {
    setExtraSchedules(prev => prev.filter(s => s.scheduleId !== scheduleId))
    showToast('🗑  Schedule deleted.')
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <Breadcrumb items={[
            { label: activeRegion?.regionName ?? 'Region', path: '/dashboard' },
            { label: 'Reports' },
          ]} />
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Generate, schedule, and download reports</p>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-5 items-start">

          {/* ── Left: Report Builder ─────────────────────────────────────── */}
          <div className="w-[360px] flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Section: Report Type */}
            <div className="px-5 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Select Report Type</h2>
              <div className="grid grid-cols-1 gap-2">
                {REPORT_TYPES.map(rt => (
                  <ReportTypeCard
                    key={rt.id}
                    report={rt}
                    selected={selectedType === rt.id}
                    onSelect={setSelectedType}
                  />
                ))}
              </div>
            </div>

            {/* Section: Config */}
            <div className="px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Configure</h2>
              <ReportConfigPanel
                zones={regionZones}
                buildings={regionBuildings}
                disabled={generating}
                onGenerate={handleGenerate}
                onSchedule={handleSchedule}
              />
            </div>
          </div>

          {/* ── Right: Queue + Scheduled ─────────────────────────────────── */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {(['queue', 'scheduled'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50/30'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'queue' ? (
                    <>Recent Reports {allJobs.length > 0 && <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{allJobs.length}</span>}</>
                  ) : (
                    <>Scheduled Reports {allSchedules.length > 0 && <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{allSchedules.length}</span>}</>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4">
              {activeTab === 'queue' ? (
                <ReportJobQueue
                  jobs={allJobs}
                  onRetry={handleRetry}
                  onCancel={handleCancel}
                  onDownload={handleDownload}
                />
              ) : (
                <ScheduledReportList
                  schedules={allSchedules}
                  onToggle={handleToggleSchedule}
                  onDelete={handleDeleteSchedule}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-3 max-w-sm">
          {toast}
        </div>
      )}
    </AppShell>
  )
}
