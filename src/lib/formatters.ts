import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function formatVolume(value: number, unit: 'm³' | 'L' = 'm³'): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M ${unit}`
  if (value >= 1_000)     return `${(value / 1_000).toFixed(1)}k ${unit}`
  return `${value.toFixed(2)} ${unit}`
}

export function formatFlowRate(value: number): string {
  return `${value.toFixed(2)} m³/h`
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

export function formatDelta(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function formatDate(iso: string, fmt = 'dd MMM yyyy'): string {
  return format(parseISO(iso), fmt)
}

export function formatDatetime(iso: string): string {
  return format(parseISO(iso), 'dd MMM yyyy HH:mm')
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true })
}

export function formatBattery(level: number): string {
  const filled = Math.round(level / 10)
  const empty  = 10 - filled
  return `${'█'.repeat(filled)}${'░'.repeat(empty)} ${level}%`
}
