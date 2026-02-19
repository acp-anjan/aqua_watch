// ─── Geography ───────────────────────────────────────────────────────────────
export interface Region {
  regionId:    string
  regionName:  string
  description: string
  zoneCount:   number
  meterCount:  number
  isActive:    boolean
}

export interface Zone {
  zoneId:        string
  regionId:      string
  zoneName:      string
  buildingCount: number
  isActive:      boolean
}

export interface Building {
  buildingId:    string
  zoneId:        string
  buildingName:  string
  buildingCode:  string
  lat:           number
  lng:           number
  floorCount:    number
  isActive:      boolean
}

// ─── Device ───────────────────────────────────────────────────────────────────
export type MeterType = 'HOT' | 'COLD' | 'MIXED'

export interface Meter {
  meterId:          string
  concentratorId:   string
  buildingId:       string
  zoneId:           string
  meterCode:        string
  meterType:        MeterType
  locationLabel:    string
  isActive:         boolean
  batteryLevel:     number
  lastSeenAt:       string
  installedAt:      string
  /** mock display fields — pre-computed for dashboards */
  consumption?:     number   // m³ in current period
  currentFlowRate?: number   // m³/h instantaneous
}

export interface MeterReading {
  readingId:          string
  meterId:            string
  totalConsumption:   number
  instantaneousFlow:  number
  batteryLevel:       number
  tamper:             boolean
  leakage:            boolean
  reverseFlow:        boolean
  backflowEvents:     number
  mechanicalError:    boolean
  readingTs:          string
}

export type EventType =
  | 'TAMPER' | 'LEAKAGE' | 'REVERSE_FLOW'
  | 'BACKFLOW' | 'MECH_ERROR' | 'LOW_BATTERY'

export type Severity = 'INFO' | 'WARNING' | 'CRITICAL'

export interface MeterEvent {
  eventId:    string
  meterId:    string
  buildingId: string
  zoneId:     string
  eventType:  EventType
  severity:   Severity
  eventTs:    string
  isResolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  notes?:     string
}

// ─── Auth & Users ─────────────────────────────────────────────────────────────
export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'REGIONAL_ADMIN'
  | 'REGIONAL_USER'
  | 'ZONE_ADMIN'
  | 'ZONE_USER'

export interface User {
  userId:             string
  email:              string
  username:           string
  fullName:           string
  role:               UserRole
  isActive:           boolean
  mustResetPassword:  boolean
  createdAt:          string
  lastLoginAt?:       string
  regionAccess:       string[]
}

// ─── KPI ──────────────────────────────────────────────────────────────────────
export interface KpiSummary {
  totalConsumption: number
  activeMeters:     number
  totalMeters:      number
  hotConsumption:   number
  coldConsumption:  number
  activeAlerts:     number
  avgBatteryLevel:  number
  period:           'TODAY' | '7D' | '30D'
  deltas:           Record<string, number>
  sparklines:       Record<string, number[]>
}

// ─── Charts ───────────────────────────────────────────────────────────────────
export interface TimeSeriesPoint {
  ts:    string
  total: number
  hot:   number
  cold:  number
}

export interface ZoneComparison {
  zoneId:   string
  zoneName: string
  hot:      number
  cold:     number
}

export interface HotColdBreakdown {
  hot:   number
  cold:  number
  mixed: number
  total: number
}

export interface HourlyProfilePoint {
  hour:  number
  label: string
  hot:   number
  cold:  number
  total: number
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export type ReportFormat    = 'PDF' | 'XLSX' | 'CSV' | 'JSON'
export type ReportStatus    = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED'
export type ReportFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface ReportJob {
  jobId:        string
  reportType:   string
  format:       ReportFormat
  status:       ReportStatus
  requestedAt:  string
  completedAt?: string
  errorMessage?: string
}

export interface ScheduledReport {
  scheduleId:        string
  name:              string
  reportType:        string
  format:            ReportFormat
  frequency:         ReportFrequency
  nextRunAt:         string
  isActive:          boolean
  emailRecipients:   string[]
}
