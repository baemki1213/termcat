import { createSpeedMonitor, type SpeedMonitor } from '@main/speed-monitor'
import type {
  SessionLevel,
  SessionSnapshot,
  SpeedLevel,
  SpeedThresholds,
  TokenStats,
} from '@shared/types'

interface ActiveSession {
  pid: number
  command: string
  startedAt: number
  monitor: SpeedMonitor
  lastLevel: SpeedLevel
  tokens: Partial<TokenStats> | null
}

export type SessionManager = ReturnType<typeof createSessionManager>

export function createSessionManager(getThresholds?: () => SpeedThresholds) {
  const sessions = new Map<number, ActiveSession>()

  return {
    onStart(pid: number, command: string): void {
      sessions.set(pid, {
        pid,
        command,
        startedAt: Date.now(),
        monitor: createSpeedMonitor(getThresholds),
        lastLevel: 'idle',
        tokens: null,
      })
    },
    onData(pid: number, chars: number, timestamp: number): void {
      sessions.get(pid)?.monitor.feed(chars, timestamp)
    },
    onStats(pid: number, tokens: Partial<TokenStats>): void {
      const session = sessions.get(pid)
      if (!session) return
      session.tokens = { ...session.tokens, ...tokens }
    },
    onExit(pid: number): void {
      sessions.delete(pid)
    },
    /** 모든 세션의 속도를 갱신하고, 세션 시작 순서대로 (pid, level) 목록을 돌려준다. */
    tick(): SessionLevel[] {
      return [...sessions.values()].map((s) => {
        s.lastLevel = s.monitor.tick()
        return { pid: s.pid, level: s.lastLevel }
      })
    },
    getSnapshots(): SessionSnapshot[] {
      return [...sessions.values()].map((s) => ({
        pid: s.pid,
        command: s.command,
        startedAt: s.startedAt,
        speedLevel: s.lastLevel,
        cps: s.monitor.getCps(),
        tokens: s.tokens ? s.tokens : null,
      }))
    },
  }
}
