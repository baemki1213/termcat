import type { AgentEvent, CliEvent, TokenStats } from '@shared/types'

type Raw = Record<string, unknown>

function isStr(v: unknown): v is string {
  return typeof v === 'string'
}

function parseSessionEvent(obj: Raw): CliEvent | null {
  if (obj.type === 'session:start' && typeof obj.pid === 'number' && isStr(obj.command)) {
    return { type: 'session:start', pid: obj.pid, command: obj.command }
  }
  if (
    obj.type === 'session:data' &&
    typeof obj.pid === 'number' &&
    typeof obj.chars === 'number' &&
    typeof obj.timestamp === 'number'
  ) {
    return { type: 'session:data', pid: obj.pid, chars: obj.chars, timestamp: obj.timestamp }
  }
  if (obj.type === 'session:exit' && typeof obj.pid === 'number' && typeof obj.code === 'number') {
    return { type: 'session:exit', pid: obj.pid, code: obj.code }
  }
  if (
    obj.type === 'session:stats' &&
    typeof obj.pid === 'number' &&
    typeof obj.tokens === 'object' &&
    obj.tokens !== null
  ) {
    return { type: 'session:stats', pid: obj.pid, tokens: obj.tokens as Partial<TokenStats> }
  }
  return null
}

function parseAgentEvent(obj: Raw): AgentEvent | null {
  if (!isStr(obj.sessionId)) return null
  const sessionId = obj.sessionId
  if (obj.type === 'agent:intent' && isStr(obj.agentType) && isStr(obj.description)) {
    return {
      type: 'agent:intent',
      sessionId,
      agentType: obj.agentType,
      description: obj.description,
    }
  }
  if (obj.type === 'agent:start' && isStr(obj.agentId) && isStr(obj.agentType)) {
    return { type: 'agent:start', sessionId, agentId: obj.agentId, agentType: obj.agentType }
  }
  if (
    obj.type === 'agent:activity' &&
    isStr(obj.agentId) &&
    isStr(obj.toolName) &&
    typeof obj.timestamp === 'number'
  ) {
    return {
      type: 'agent:activity',
      sessionId,
      agentId: obj.agentId,
      toolName: obj.toolName,
      timestamp: obj.timestamp,
    }
  }
  if (obj.type === 'agent:stop' && isStr(obj.agentId)) {
    return { type: 'agent:stop', sessionId, agentId: obj.agentId }
  }
  if (obj.type === 'agent:session-end') {
    return { type: 'agent:session-end', sessionId }
  }
  return null
}

export function isAgentEvent(event: CliEvent): event is AgentEvent {
  return event.type.startsWith('agent:')
}

/** 소켓으로 들어온 한 줄(JSON)을 검증해 CliEvent 로 바꾼다. 모양이 안 맞으면 throw. */
export function parseCliEvent(raw: unknown): CliEvent {
  if (typeof raw !== 'object' || raw === null) throw new Error('invalid event')
  const obj = raw as Raw

  if (obj.type === 'status:get') return { type: 'status:get' }
  const event = parseSessionEvent(obj) ?? parseAgentEvent(obj)
  if (event) return event
  throw new Error(`unknown event type: ${String(obj.type)}`)
}
