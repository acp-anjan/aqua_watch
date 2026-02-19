import type { Meter, MeterEvent } from '@/types'

/** Returns an HTML string for a Leaflet meter popup */
export function meterPopupHtml(
  meter:  Meter,
  events: MeterEvent[],
  zoneId: string
): string {
  const isHot     = meter.meterType === 'HOT'
  const badgeBg   = isHot ? '#FFEBEE' : '#E3F2FD'
  const badgeCol  = isHot ? '#C62828' : '#1565C0'
  const badgeTxt  = isHot ? 'HOT'     : 'COLD'
  const status    = meter.isActive ? '✅ Active' : '🔴 Offline'
  const alerts    = events.filter(e => !e.isResolved).length
  const alertRow  = alerts > 0
    ? `<div style="margin-top:5px;padding:3px 7px;background:#FFF3E0;border:1px solid #FFB74D;border-radius:5px;color:#E65100;font-size:10px;font-weight:600;">⚠ ${alerts} unresolved alert${alerts > 1 ? 's' : ''}</div>`
    : ''

  const batColor  = meter.batteryLevel < 20 ? '#D32F2F' : meter.batteryLevel < 50 ? '#F57C00' : '#2E7D32'
  const batWidth  = Math.max(4, meter.batteryLevel)

  const url = `/dashboard/zone/${zoneId}/building/${meter.buildingId}/meter/${meter.meterId}`

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;width:210px;padding:2px 0">
  <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
    <span style="background:${badgeBg};color:${badgeCol};border-radius:5px;padding:2px 7px;font-size:10px;font-weight:700;">${badgeTxt}</span>
    <span style="font-size:12px;font-weight:700;color:#1a202c;">${meter.meterCode}</span>
  </div>
  <div style="font-size:11px;color:#4a5568;margin-bottom:2px;">📍 ${meter.locationLabel}</div>
  <div style="font-size:11px;color:#4a5568;margin-bottom:6px;">${status}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">
    <div style="background:#F7FAFC;border-radius:6px;padding:5px 7px;">
      <div style="font-size:10px;color:#718096;">Consumption</div>
      <div style="font-size:12px;font-weight:700;color:#2D3748;">${meter.consumption ?? 0} m³</div>
    </div>
    <div style="background:#F7FAFC;border-radius:6px;padding:5px 7px;">
      <div style="font-size:10px;color:#718096;">Flow Rate</div>
      <div style="font-size:12px;font-weight:700;color:#2D3748;">${(meter.currentFlowRate ?? 0).toFixed(2)} m³/h</div>
    </div>
  </div>
  <div style="margin-bottom:4px;">
    <div style="font-size:10px;color:#718096;margin-bottom:2px;">Battery ${meter.batteryLevel}%</div>
    <div style="background:#E2E8F0;border-radius:3px;height:5px;overflow:hidden;">
      <div style="background:${batColor};width:${batWidth}%;height:100%;border-radius:3px;"></div>
    </div>
  </div>
  ${alertRow}
  <a href="${url}" onclick="event.preventDefault();window.dispatchEvent(new CustomEvent('map-navigate',{detail:'${url}'}))"
     style="display:block;margin-top:7px;text-align:center;background:#546E7A;color:#fff;border-radius:7px;padding:5px 0;font-size:11px;font-weight:600;text-decoration:none;">
    View Meter Details →
  </a>
</div>`
}
