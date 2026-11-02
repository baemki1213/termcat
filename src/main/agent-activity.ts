import type { SpeedLevel } from '@shared/types'

/** 이 시간 안의 도구 호출 수로 에이전트 속도를 정한다 */
export const AGENT_ACTIVITY_WINDOW_MS = 15_000
/** 윈도우 안 도구 호출 수 → 속도 단계 (초과 기준) */
const SLOW_MAX_CALLS = 2
const MID_MAX_CALLS = 5

export type AgentActivity = ReturnType<typeof createAgentActivity>

/**
 * 서브에이전트는 터미널 출력이 없으므로 chars/sec 대신 도구 호출 빈도로 속도를 잰다.
 * 호출 시각만 쌓아두고, tick 마다 윈도우 밖의 기록을 버린다.
 */
export function createAgentActivity(now: () => number = Date.now) {
  let calls: number[] = []

  function prune(): void {
    const cutoff = now() - AGENT_ACTIVITY_WINDOW_MS
    calls = calls.filter((ts) => ts > cutoff)
  }

  return {
    record(timestamp: number): void {
      calls.push(timestamp)
    },
    tick(): SpeedLevel {
      prune()
      const count = calls.length
      if (count === 0) return 'idle'
      if (count <= SLOW_MAX_CALLS) return 'slow'
      if (count <= MID_MAX_CALLS) return 'mid'
      return 'fast'
    },
    getCallsPerMinute(): number {
      prune()
      return calls.length * (60_000 / AGENT_ACTIVITY_WINDOW_MS)
    },
  }
}
