import { type AgentActivity, createAgentActivity } from '@main/agent-activity'
import type { AgentEvent, AgentSnapshot, SpeedLevel } from '@shared/types'

/** SubagentStop 훅을 놓쳤을 때를 대비해, 이 시간 동안 활동이 없으면 지운다 */
export const AGENT_STALE_MS = 10 * 60_000

interface ActiveAgent {
  key: string
  sessionId: string
  agentId: string
  agentType: string
  name: string
  startedAt: number
  lastActivityAt: number
  lastLevel: SpeedLevel
  activity: AgentActivity
}

interface SpawnIntent {
  sessionId: string
  agentType: string
  description: string
}

function agentKey(sessionId: string, agentId: string): string {
  return `${sessionId}:${agentId}`
}

export type AgentRegistry = ReturnType<typeof createAgentRegistry>

/**
 * Claude Code 훅이 보낸 서브에이전트 이벤트를 모아 에이전트별 활동 속도를 관리한다.
 * Agent 도구 호출(PreToolUse)의 description 은 agent_id 를 모르므로, 같은 세션·역할의
 * 다음 SubagentStart 가 FIFO 로 가져가 이름으로 쓴다.
 */
export function createAgentRegistry(now: () => number = Date.now) {
  const agents = new Map<string, ActiveAgent>()
  const intents: SpawnIntent[] = []

  function takeIntent(sessionId: string, agentType: string): string | null {
    const idx = intents.findIndex((i) => i.sessionId === sessionId && i.agentType === agentType)
    if (idx < 0) return null
    const [intent] = intents.splice(idx, 1)
    return intent.description || null
  }

  function onStart(sessionId: string, agentId: string, agentType: string): void {
    const key = agentKey(sessionId, agentId)
    const startedAt = now()
    const activity = createAgentActivity(now)
    // 막 생성된 에이전트는 도구 호출 전이라도 일하는 중이므로 한 번 움직여 준다.
    activity.record(startedAt)
    agents.set(key, {
      key,
      sessionId,
      agentId,
      agentType,
      name: takeIntent(sessionId, agentType) ?? agentType,
      startedAt,
      lastActivityAt: startedAt,
      lastLevel: 'idle',
      activity,
    })
  }

  function onActivity(sessionId: string, agentId: string, timestamp: number): void {
    const agent = agents.get(agentKey(sessionId, agentId))
    if (!agent) return
    agent.activity.record(timestamp)
    agent.lastActivityAt = Math.max(agent.lastActivityAt, timestamp)
  }

  function removeStale(): void {
    const cutoff = now() - AGENT_STALE_MS
    for (const [key, agent] of agents) {
      if (agent.lastActivityAt < cutoff) agents.delete(key)
    }
  }

  return {
    handle(event: AgentEvent): void {
      if (event.type === 'agent:intent') {
        intents.push({
          sessionId: event.sessionId,
          agentType: event.agentType,
          description: event.description,
        })
      } else if (event.type === 'agent:start') {
        onStart(event.sessionId, event.agentId, event.agentType)
      } else if (event.type === 'agent:activity') {
        onActivity(event.sessionId, event.agentId, event.timestamp)
      } else if (event.type === 'agent:stop') {
        agents.delete(agentKey(event.sessionId, event.agentId))
      } else if (event.type === 'agent:session-end') {
        for (const [key, agent] of agents) {
          if (agent.sessionId === event.sessionId) agents.delete(key)
        }
      }
    },
    /** 오래된 에이전트를 정리하고 속도를 갱신한 뒤, 시작 순서대로 스냅샷을 돌려준다. */
    tick(): AgentSnapshot[] {
      removeStale()
      return [...agents.values()].map((a) => {
        a.lastLevel = a.activity.tick()
        return {
          key: a.key,
          sessionId: a.sessionId,
          agentId: a.agentId,
          agentType: a.agentType,
          name: a.name,
          startedAt: a.startedAt,
          speedLevel: a.lastLevel,
          toolCallsPerMinute: a.activity.getCallsPerMinute(),
          lastActivityAt: a.lastActivityAt,
        }
      })
    },
  }
}
