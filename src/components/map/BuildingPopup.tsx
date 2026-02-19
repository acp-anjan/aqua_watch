import type { Building, Meter, MeterEvent } from '@/types'

/** Returns an HTML string for a Leaflet building popup */
export function buildingPopupHtml(
  building: Building,
  meters:   Meter[],
  events:   MeterEvent[],
  zoneId:   string
): string {
  const active   = meters.filter(m => m.isActive).length
  const offline  = meters.filter(m => !m.isActive).length
  const alerts   = events.filter(e => !e.isResolved).length
  const hotM3    = meters.filter(m => m.meterType === 'HOT').reduce((s, m) => s + (m.consumption ?? 0), 0)
  const coldM3   = meters.filter(m => m.meterType === 'COLD').reduce((s, m) => s + (m.consumption ?? 0), 0)
  const total    = hotM3 + coldM3
  const alertRow = alerts > 0
    ? `<div style="margin-top:6px;padding:4px 8px;background:#FFF3E0;border:1px solid #FFB74D;border-radius:6px;color:#E65100;font-size:11px;font-weight:600;">⚠ ${alerts} unresolved alert${alerts > 1 ? 's' : ''}</div>`
    : `<div style="margin-top:6px;padding:4px 8px;background:#E8F5E9;border:1px solid #81C784;border-radius:6px;color:#2E7D32;font-size:11px;font-weight:600;">✓ No active alerts</div>`

  const url = `/dashboard/zone/${zoneId}/building/${building.buildingId}`

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;width:230px;padding:2px 0">
  <div style="font-size:13px;font-weight:700;color:#1a202c;margin-bottom:2px;">${building.buildingName}</div>
  <div style="font-size:11px;color:#718096;margin-bottom:8px;">${building.buildingCode} · ${building.floorCount} floors</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:4px;">
    <div style="background:#FFEBEE;border-radius:8px;padding:6px 8px;text-align:center;">
      <div style="font-size:10px;color:#E53935;font-weight:600;">HOT</div>
      <div style="font-size:12px;font-weight:700;color:#C62828;">${hotM3} m³</div>
    </div>
    <div style="background:#E3F2FD;border-radius:8px;padding:6px 8px;text-align:center;">
      <div style="font-size:10px;color:#1E88E5;font-weight:600;">COLD</div>
      <div style="font-size:12px;font-weight:700;color:#1565C0;">${coldM3} m³</div>
    </div>
    <div style="background:#ECEFF1;border-radius:8px;padding:6px 8px;text-align:center;">
      <div style="font-size:10px;color:#546E7A;font-weight:600;">TOTAL</div>
      <div style="font-size:12px;font-weight:700;color:#37474F;">${total} m³</div>
    </div>
  </div>
  <div style="font-size:11px;color:#4a5568;margin-bottom:4px;">
    <span style="margin-right:8px;">🔘 ${active} active</span>
    ${offline > 0 ? `<span style="color:#B71C1C;">● ${offline} offline</span>` : ''}
  </div>
  ${alertRow}
  <a href="${url}" onclick="event.preventDefault();window.dispatchEvent(new CustomEvent('map-navigate',{detail:'${url}'}))"
     style="display:block;margin-top:8px;text-align:center;background:#1E88E5;color:#fff;border-radius:8px;padding:6px 0;font-size:12px;font-weight:600;text-decoration:none;">
    View Dashboard →
  </a>
</div>`
}
