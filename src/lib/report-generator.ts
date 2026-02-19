/**
 * report-generator.ts
 * Generates downloadable report content (CSV, JSON, XLSX, PDF HTML) from mock data.
 */

import type { Zone, Building, Meter, MeterEvent, ReportFormat } from '@/types'

export interface ReportDataSources {
  zones:      Zone[]
  buildings:  Building[]
  meters:     Meter[]
  events:     MeterEvent[]
  regionName: string
  reportType: string
  dateFrom:   string
  dateTo:     string
}

// ─── CSV helpers ─────────────────────────────────────────────────────────────

function esc(val: unknown): string {
  const s = String(val ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

function row(...cells: unknown[]): string {
  return cells.map(esc).join(',')
}

// ─── Per-type CSV generators ─────────────────────────────────────────────────

function consumptionSummaryCsv(d: ReportDataSources): string {
  const lines = [row('Zone', 'Building', 'Meter Code', 'Type', 'Consumption (m³)', 'Flow Rate (m³/h)', 'Status', 'Last Seen')]
  d.meters.forEach(m => {
    const bldg = d.buildings.find(b => b.buildingId === m.buildingId)
    const zone = d.zones.find(z => z.zoneId === m.zoneId)
    lines.push(row(
      zone?.zoneName ?? m.zoneId,
      bldg?.buildingName ?? m.buildingId,
      m.meterCode,
      m.meterType,
      m.consumption ?? 0,
      (m.currentFlowRate ?? 0).toFixed(3),
      m.isActive ? 'Active' : 'Offline',
      m.lastSeenAt,
    ))
  })
  return lines.join('\n')
}

function hotColdReportCsv(d: ReportDataSources): string {
  const lines = [row('Zone', 'Building', 'Hot Meters', 'Cold Meters', 'Hot m³', 'Cold m³', 'Total m³')]
  d.buildings.forEach(b => {
    const zone  = d.zones.find(z => z.zoneId === b.zoneId)
    const bMeters = d.meters.filter(m => m.buildingId === b.buildingId)
    const hotM  = bMeters.filter(m => m.meterType === 'HOT')
    const coldM = bMeters.filter(m => m.meterType === 'COLD')
    const hotV  = hotM.reduce((s, m) => s + (m.consumption ?? 0), 0)
    const coldV = coldM.reduce((s, m) => s + (m.consumption ?? 0), 0)
    lines.push(row(zone?.zoneName ?? b.zoneId, b.buildingName, hotM.length, coldM.length, hotV, coldV, hotV + coldV))
  })
  return lines.join('\n')
}

function meterStatusCsv(d: ReportDataSources): string {
  const lines = [row('Meter Code', 'Type', 'Zone', 'Building', 'Location', 'Status', 'Battery %', 'Last Seen', 'Installed', 'Open Alerts')]
  d.meters.forEach(m => {
    const bldg   = d.buildings.find(b => b.buildingId === m.buildingId)
    const zone   = d.zones.find(z => z.zoneId === m.zoneId)
    const alerts = d.events.filter(e => e.meterId === m.meterId && !e.isResolved).length
    lines.push(row(
      m.meterCode, m.meterType,
      zone?.zoneName ?? m.zoneId,
      bldg?.buildingName ?? m.buildingId,
      m.locationLabel,
      m.isActive ? 'Active' : 'Offline',
      m.batteryLevel,
      m.lastSeenAt,
      m.installedAt ?? '',
      alerts,
    ))
  })
  return lines.join('\n')
}

function alertEventLogCsv(d: ReportDataSources): string {
  const lines = [row('Event ID', 'Zone', 'Building', 'Meter', 'Event Type', 'Severity', 'Timestamp', 'Resolved', 'Resolved By', 'Notes')]
  d.events.forEach(e => {
    const bldg = d.buildings.find(b => b.buildingId === e.buildingId)
    const zone = d.zones.find(z => z.zoneId === e.zoneId)
    lines.push(row(
      e.eventId,
      zone?.zoneName ?? e.zoneId,
      bldg?.buildingName ?? e.buildingId,
      e.meterId,
      e.eventType,
      e.severity,
      e.eventTs,
      e.isResolved ? 'Yes' : 'No',
      e.resolvedBy ?? '',
      e.notes ?? '',
    ))
  })
  return lines.join('\n')
}

function batteryReportCsv(d: ReportDataSources): string {
  const lines = [row('Meter Code', 'Type', 'Zone', 'Building', 'Location', 'Battery %', 'Risk Level', 'Status')]
  const sorted = [...d.meters].sort((a, b) => a.batteryLevel - b.batteryLevel)
  sorted.forEach(m => {
    const bldg = d.buildings.find(b => b.buildingId === m.buildingId)
    const zone = d.zones.find(z => z.zoneId === m.zoneId)
    const risk = m.batteryLevel < 20 ? 'CRITICAL — Replace immediately'
               : m.batteryLevel < 50 ? 'LOW — Schedule replacement'
               : 'OK'
    lines.push(row(
      m.meterCode, m.meterType,
      zone?.zoneName ?? m.zoneId,
      bldg?.buildingName ?? m.buildingId,
      m.locationLabel,
      m.batteryLevel,
      risk,
      m.isActive ? 'Active' : 'Offline',
    ))
  })
  return lines.join('\n')
}

function zoneComparisonCsv(d: ReportDataSources): string {
  const lines = [row('Zone', 'Buildings', 'Active Meters', 'Offline Meters', 'Hot m³', 'Cold m³', 'Total m³', 'Active Alerts')]
  d.zones.forEach(z => {
    const zMeters   = d.meters.filter(m => m.zoneId === z.zoneId)
    const hotV      = zMeters.filter(m => m.meterType === 'HOT').reduce((s, m) => s + (m.consumption ?? 0), 0)
    const coldV     = zMeters.filter(m => m.meterType === 'COLD').reduce((s, m) => s + (m.consumption ?? 0), 0)
    const alerts    = d.events.filter(e => e.zoneId === z.zoneId && !e.isResolved).length
    lines.push(row(
      z.zoneName, z.buildingCount,
      zMeters.filter(m => m.isActive).length,
      zMeters.filter(m => !m.isActive).length,
      hotV, coldV, hotV + coldV, alerts,
    ))
  })
  return lines.join('\n')
}

function buildingComparisonCsv(d: ReportDataSources): string {
  const lines = [row('Zone', 'Building', 'Code', 'Floors', 'Total Meters', 'Active', 'Offline', 'Hot m³', 'Cold m³', 'Total m³', 'Open Alerts')]
  d.buildings.forEach(b => {
    const zone    = d.zones.find(z => z.zoneId === b.zoneId)
    const bMeters = d.meters.filter(m => m.buildingId === b.buildingId)
    const hotV    = bMeters.filter(m => m.meterType === 'HOT').reduce((s, m) => s + (m.consumption ?? 0), 0)
    const coldV   = bMeters.filter(m => m.meterType === 'COLD').reduce((s, m) => s + (m.consumption ?? 0), 0)
    const alerts  = d.events.filter(e => e.buildingId === b.buildingId && !e.isResolved).length
    lines.push(row(
      zone?.zoneName ?? b.zoneId,
      b.buildingName, b.buildingCode, b.floorCount,
      bMeters.length,
      bMeters.filter(m => m.isActive).length,
      bMeters.filter(m => !m.isActive).length,
      hotV, coldV, hotV + coldV, alerts,
    ))
  })
  return lines.join('\n')
}

function rawReadingsExportCsv(d: ReportDataSources): string {
  const lines = [row('Meter Code', 'Type', 'Zone', 'Building', 'Location', 'Consumption (m³)', 'Flow Rate (m³/h)', 'Battery %', 'Status', 'Last Seen')]
  d.meters.forEach(m => {
    const bldg = d.buildings.find(b => b.buildingId === m.buildingId)
    const zone = d.zones.find(z => z.zoneId === m.zoneId)
    lines.push(row(
      m.meterCode, m.meterType,
      zone?.zoneName ?? m.zoneId,
      bldg?.buildingName ?? m.buildingId,
      m.locationLabel,
      m.consumption ?? 0,
      (m.currentFlowRate ?? 0).toFixed(3),
      m.batteryLevel,
      m.isActive ? 'Active' : 'Offline',
      m.lastSeenAt,
    ))
  })
  return lines.join('\n')
}

// ─── CSV dispatcher ──────────────────────────────────────────────────────────

function buildCsv(d: ReportDataSources): string {
  const id = d.reportType.toLowerCase()
  if (id.includes('hot') || id.includes('cold'))         return hotColdReportCsv(d)
  if (id.includes('meter status'))                       return meterStatusCsv(d)
  if (id.includes('alert') || id.includes('event'))      return alertEventLogCsv(d)
  if (id.includes('battery'))                            return batteryReportCsv(d)
  if (id.includes('zone comparison'))                    return zoneComparisonCsv(d)
  if (id.includes('building comparison'))                return buildingComparisonCsv(d)
  if (id.includes('raw'))                                return rawReadingsExportCsv(d)
  return consumptionSummaryCsv(d)
}

// ─── JSON builder ─────────────────────────────────────────────────────────────

function buildJson(d: ReportDataSources): string {
  const id = d.reportType.toLowerCase()
  let payload: unknown

  if (id.includes('zone comparison')) {
    payload = d.zones.map(z => {
      const zMeters = d.meters.filter(m => m.zoneId === z.zoneId)
      return {
        zoneId:     z.zoneId,
        zoneName:   z.zoneName,
        hot_m3:     zMeters.filter(m => m.meterType === 'HOT').reduce((s, m) => s + (m.consumption ?? 0), 0),
        cold_m3:    zMeters.filter(m => m.meterType === 'COLD').reduce((s, m) => s + (m.consumption ?? 0), 0),
        activeMeters:  zMeters.filter(m => m.isActive).length,
        offlineMeters: zMeters.filter(m => !m.isActive).length,
        openAlerts:    d.events.filter(e => e.zoneId === z.zoneId && !e.isResolved).length,
      }
    })
  } else if (id.includes('alert') || id.includes('event')) {
    payload = d.events.map(e => ({
      ...e,
      zoneName:     d.zones.find(z => z.zoneId === e.zoneId)?.zoneName,
      buildingName: d.buildings.find(b => b.buildingId === e.buildingId)?.buildingName,
    }))
  } else if (id.includes('battery')) {
    payload = [...d.meters]
      .sort((a, b) => a.batteryLevel - b.batteryLevel)
      .map(m => ({
        meterCode:    m.meterCode,
        meterType:    m.meterType,
        batteryLevel: m.batteryLevel,
        riskLevel:    m.batteryLevel < 20 ? 'CRITICAL' : m.batteryLevel < 50 ? 'LOW' : 'OK',
        locationLabel: m.locationLabel,
        buildingName: d.buildings.find(b => b.buildingId === m.buildingId)?.buildingName,
        zoneName:     d.zones.find(z => z.zoneId === m.zoneId)?.zoneName,
      }))
  } else {
    payload = d.meters.map(m => ({
      meterCode:      m.meterCode,
      meterType:      m.meterType,
      consumption_m3: m.consumption ?? 0,
      flowRate_m3h:   m.currentFlowRate ?? 0,
      batteryLevel:   m.batteryLevel,
      status:         m.isActive ? 'Active' : 'Offline',
      locationLabel:  m.locationLabel,
      buildingName:   d.buildings.find(b => b.buildingId === m.buildingId)?.buildingName,
      zoneName:       d.zones.find(z => z.zoneId === m.zoneId)?.zoneName,
      lastSeenAt:     m.lastSeenAt,
    }))
  }

  return JSON.stringify({
    report: {
      type:       d.reportType,
      region:     d.regionName,
      dateFrom:   d.dateFrom,
      dateTo:     d.dateTo,
      generatedAt: new Date().toISOString(),
      recordCount: Array.isArray(payload) ? payload.length : 1,
    },
    data: payload,
  }, null, 2)
}

// ─── XLSX (HTML table — Excel opens natively) ────────────────────────────────

function buildXlsxHtml(d: ReportDataSources): string {
  const csv  = buildCsv(d)
  const rows = csv.split('\n').map(r => r.split(','))
  const head = rows[0]
  const body = rows.slice(1)

  const thCells  = head.map(h => `<th style="background:#1E88E5;color:#fff;padding:6px 10px;border:1px solid #ccc;font-size:11px;">${h.replace(/"/g, '')}</th>`).join('')
  const dataCells = body.map((r, i) =>
    `<tr style="background:${i % 2 === 0 ? '#fff' : '#f5f9ff'};">${r.map(c => `<td style="padding:5px 10px;border:1px solid #e0e0e0;font-size:11px;">${c.replace(/"/g, '')}</td>`).join('')}</tr>`
  ).join('\n')

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${d.reportType.slice(0, 30)}">
    <Table>
      <Row>${head.map(h => `<Cell><Data ss:Type="String">${h.replace(/"/g, '')}</Data></Cell>`).join('')}</Row>
      ${body.map(r => `<Row>${r.map(c => `<Cell><Data ss:Type="String">${c.replace(/"/g, '')}</Data></Cell>`).join('')}</Row>`).join('\n      ')}
    </Table>
  </Worksheet>
</Workbook>`
}

// ─── PDF (print-ready HTML popup) ────────────────────────────────────────────

function buildPdfHtml(d: ReportDataSources): string {
  const csv  = buildCsv(d)
  const rows = csv.split('\n').map(r => r.split(','))
  const head = rows[0]
  const body = rows.slice(1)

  const thCells  = head.map(h => `<th>${h.replace(/"/g, '')}</th>`).join('')
  const dataCells = body.map(r =>
    `<tr>${r.map(c => `<td>${c.replace(/"/g, '')}</td>`).join('')}</tr>`
  ).join('\n')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${d.reportType} — ${d.regionName}</title>
  <style>
    @media print { @page { margin: 18mm; } }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; color: #1a202c; margin: 0; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #1E88E5; }
    .header h1 { font-size: 18px; font-weight: 700; color: #1E88E5; margin: 0 0 4px; }
    .header .meta { font-size: 11px; color: #718096; }
    .meta-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 20px; }
    .meta-box  { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; }
    .meta-box .label { font-size: 9px; text-transform: uppercase; letter-spacing: .06em; color: #718096; font-weight: 600; }
    .meta-box .value { font-size: 13px; font-weight: 700; color: #2d3748; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #1E88E5; color: #fff; padding: 6px 8px; text-align: left; font-weight: 600; }
    td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f7fafc; }
    .footer { margin-top: 16px; font-size: 9px; color: #a0aec0; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${d.reportType}</h1>
      <div class="meta">${d.regionName} · ${d.dateFrom} to ${d.dateTo}</div>
    </div>
    <div class="meta" style="text-align:right;">Generated: ${new Date().toLocaleString()}<br/>AquaWatch Dashboard</div>
  </div>
  <div class="meta-grid">
    <div class="meta-box"><div class="label">Total Meters</div><div class="value">${d.meters.length}</div></div>
    <div class="meta-box"><div class="label">Active</div><div class="value">${d.meters.filter(m => m.isActive).length}</div></div>
    <div class="meta-box"><div class="label">Open Alerts</div><div class="value">${d.events.filter(e => !e.isResolved).length}</div></div>
    <div class="meta-box"><div class="label">Zones</div><div class="value">${d.zones.length}</div></div>
  </div>
  <table>
    <thead><tr>${thCells}</tr></thead>
    <tbody>${dataCells}</tbody>
  </table>
  <div class="footer">AquaWatch Dashboard — ${d.reportType} — ${d.regionName} — Confidential</div>
  <script>window.onload = () => { window.print() }<\/script>
</body>
</html>`
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function triggerDownload(
  d:        ReportDataSources,
  format:   ReportFormat,
  filename: string
): void {
  if (format === 'PDF') {
    // Open a new window with print-ready HTML
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(buildPdfHtml(d))
      win.document.close()
    }
    return
  }

  let content:  string
  let mimeType: string
  let ext:      string

  if (format === 'JSON') {
    content  = buildJson(d)
    mimeType = 'application/json'
    ext      = 'json'
  } else if (format === 'XLSX') {
    content  = buildXlsxHtml(d)
    mimeType = 'application/vnd.ms-excel'
    ext      = 'xls'
  } else {
    // CSV
    content  = buildCsv(d)
    mimeType = 'text/csv;charset=utf-8;'
    ext      = 'csv'
  }

  const blob = new Blob([content], { type: mimeType })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${filename}.${ext}`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
