// ─── Color tokens ────────────────────────────────────────────────────────────
export const COLORS = {
  hot:   { primary: '#E53935', accent: '#FFCDD2', light: '#FFEBEE' },
  cold:  { primary: '#1E88E5', accent: '#BBDEFB', light: '#E3F2FD' },
  total: { primary: '#546E7A', accent: '#ECEFF1' },
  alert: {
    critical: '#D32F2F',   // TAMPER
    warning:  '#F57C00',   // LEAKAGE, BACKFLOW
    info:     '#1565C0',   // REVERSE_FLOW
    muted:    '#455A64',   // MECH_ERROR
    battery:  '#F9A825',   // LOW_BATTERY
  },
  status: {
    active:   '#2E7D32',
    offline:  '#B71C1C',
    alerting: '#E65100',
  },
} as const

// ─── Roles ────────────────────────────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN:    'Super Admin',
  ADMIN:          'Admin',
  REGIONAL_ADMIN: 'Regional Admin',
  REGIONAL_USER:  'Regional User',
  ZONE_ADMIN:     'Zone Admin',
  ZONE_USER:      'Zone User',
} as const

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN'] as const

// ─── Alert types ──────────────────────────────────────────────────────────────
export const EVENT_TYPES = {
  TAMPER:       { label: 'Tamper',        color: COLORS.alert.critical, icon: '🔴' },
  LEAKAGE:      { label: 'Leakage',       color: COLORS.alert.warning,  icon: '🟠' },
  REVERSE_FLOW: { label: 'Reverse Flow',  color: COLORS.alert.info,     icon: '🔵' },
  BACKFLOW:     { label: 'Backflow',      color: COLORS.alert.warning,  icon: '🟡' },
  MECH_ERROR:   { label: 'Mech. Error',   color: COLORS.alert.muted,    icon: '⚫' },
  LOW_BATTERY:  { label: 'Low Battery',   color: COLORS.alert.battery,  icon: '🔋' },
} as const

// ─── Nav items ────────────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { label: 'Dashboard',       path: '/dashboard',  icon: 'LayoutDashboard' },
  { label: 'Map View',        path: '/map',         icon: 'Map'             },
  { label: 'Reports',         path: '/reports',     icon: 'FileText'        },
  { label: 'User Management', path: '/users',       icon: 'Users', adminOnly: true },
] as const

// ─── Date range presets ───────────────────────────────────────────────────────
export const DATE_PRESETS = ['Today', '7D', '30D', 'This Month', 'Last Month', 'Custom'] as const

// ─── Mock credentials ─────────────────────────────────────────────────────────
export const MOCK_CREDENTIALS: Record<string, string> = {
  'admin@system.com':  'Admin1234@',
  'sadmin@system.com': 'Admin1234@',
}
