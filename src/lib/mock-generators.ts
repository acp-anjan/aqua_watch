/**
 * Synthetic mock data generators for Phase 3 sub-dashboards.
 * These replace the need for large static JSON files by deriving
 * plausible data from what is already stored in the meter records.
 */
import { format, subDays, subHours } from 'date-fns'
import type { Meter, TimeSeriesPoint, MeterReading } from '@/types'

// 30-day daily multiplier pattern (higher on weekends – every 6th/7th day)
const DAILY_PATTERN = [
  1.00, 1.10, 0.90, 1.00, 0.95, 1.20, 1.30,
  1.00, 1.05, 0.90, 1.10, 1.00, 1.30, 1.25,
  0.95, 1.00, 1.05, 0.90, 1.10, 1.20, 1.30,
  1.05, 0.95, 1.00, 1.10, 0.90, 1.20, 1.25,
  1.00, 1.05,
]

// 24-h usage multiplier relative to mean (peak morning + evening)
const HOURLY_MULT = [
  0.30, 0.20, 0.15, 0.10, 0.20, 0.35,
  0.55, 1.10, 1.25, 0.90, 0.75, 0.65,
  0.75, 0.60, 0.65, 0.75, 0.70, 0.80,
  0.90, 1.20, 1.30, 1.05, 0.75, 0.55,
]

const REF_DATE = new Date('2026-02-19T23:00:00Z')

// ─── Battery history ──────────────────────────────────────────────────────────

/**
 * Generates a 30-day battery level history.
 * If current level is low (< 30%) the curve shows a steady decline;
 * otherwise it shows a stable/very-slowly-declining curve.
 */
export function generateBatteryHistory(
  currentLevel: number,
  days = 30,
): { date: string; batteryLevel: number }[] {
  const declining  = currentLevel < 30
  const startLevel = declining
    ? Math.min(100, currentLevel + days * 1.2)
    : Math.min(100, currentLevel + 5)

  return Array.from({ length: days }).map((_, i) => {
    const date     = format(subDays(new Date('2026-02-19'), days - 1 - i), 'yyyy-MM-dd')
    const progress = i / Math.max(days - 1, 1)
    const noise    = Math.sin(i * 2.3 + 1) * 0.8
    const level    = declining
      ? startLevel - (startLevel - currentLevel) * progress + noise
      : startLevel - 5 * progress + noise
    return {
      date,
      batteryLevel: Math.max(0, Math.min(100, Math.round(level))),
    }
  })
}

// ─── Daily consumption trend ──────────────────────────────────────────────────

/**
 * Generates a 30-day daily consumption trend for a single meter.
 * Uses the meter's total `consumption` field as the period total,
 * then distributes it across 30 days using a realistic weekly pattern.
 */
export function generateMeterTrend(meter: Meter, days = 30): TimeSeriesPoint[] {
  const dailyBase = (meter.consumption ?? 0) / Math.max(days, 1)
  const isHot     = meter.meterType === 'HOT'
  const isCold    = meter.meterType === 'COLD'

  return DAILY_PATTERN.slice(0, days).map((mult, i) => {
    const val = Math.round(dailyBase * mult * 10) / 10
    return {
      ts:    format(subDays(new Date('2026-02-19'), days - 1 - i), 'yyyy-MM-dd'),
      total: val,
      hot:   isHot  ? val : 0,
      cold:  isCold ? val : 0,
    }
  })
}

// ─── Flow rate trend ──────────────────────────────────────────────────────────

/**
 * Generates a 30-day daily average flow-rate trend for a single meter.
 * Returns TimeSeriesPoint[] where total=flowRate, hot/cold split by meter type.
 */
export function generateFlowRateTrend(meter: Meter, days = 30): TimeSeriesPoint[] {
  const baseFlow = meter.currentFlowRate ?? 0
  const isHot    = meter.meterType === 'HOT'
  const isCold   = meter.meterType === 'COLD'

  return DAILY_PATTERN.slice(0, days).map((mult, i) => {
    const val = Math.round(baseFlow * mult * 100) / 100
    return {
      ts:    format(subDays(new Date('2026-02-19'), days - 1 - i), 'yyyy-MM-dd'),
      total: val,
      hot:   isHot  ? val : 0,
      cold:  isCold ? val : 0,
    }
  })
}

// ─── Raw readings (hourly) ────────────────────────────────────────────────────

/**
 * Generates synthetic hourly MeterReading records for the last `count` hours.
 * Uses daily pattern scaled by the meter's current consumption and flow rate.
 */
export function generateRawReadings(meter: Meter, count = 48): MeterReading[] {
  const hourlyBase = (meter.consumption ?? 0) / 30 / 24
  const flowBase   = meter.currentFlowRate ?? 0

  return Array.from({ length: count }).map((_, idx) => {
    const ts       = subHours(REF_DATE, count - 1 - idx)
    const hourMult = HOURLY_MULT[ts.getUTCHours()] ?? 1.0

    return {
      readingId:         `r-${meter.meterId}-${String(idx).padStart(3, '0')}`,
      meterId:           meter.meterId,
      totalConsumption:  Math.round(hourlyBase * hourMult * 100) / 100,
      instantaneousFlow: Math.round(flowBase   * hourMult * 100) / 100,
      batteryLevel:      meter.batteryLevel,
      tamper:            false,
      leakage:           false,
      reverseFlow:       false,
      backflowEvents:    0,
      mechanicalError:   false,
      readingTs:         ts.toISOString(),
    }
  })
}
