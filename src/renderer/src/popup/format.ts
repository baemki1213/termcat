import type { SpeedLevel } from '@shared/types'

export const SPEED_LABEL: Record<SpeedLevel, string> = {
  idle: '⚫ idle',
  slow: '🔵 slow',
  mid: '🟡 mid',
  fast: '🔴 fast',
}

export const SPEED_COLORS: Record<SpeedLevel, { bg: string; fg: string }> = {
  idle: { bg: '#e5e7eb', fg: '#6b7280' },
  slow: { bg: '#dbeafe', fg: '#2563eb' },
  mid: { bg: '#fef3c7', fg: '#d97706' },
  fast: { bg: '#fee2e2', fg: '#dc2626' },
}

export function formatDuration(startedAt: number): string {
  const secs = Math.floor((Date.now() - startedAt) / 1000)
  const m = Math.floor(secs / 60)
  const sec = secs % 60
  return m > 0 ? `${m}분 ${sec}초` : `${sec}초`
}

export function formatTokens(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}
