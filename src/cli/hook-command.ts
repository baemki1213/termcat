import type { IpcClient } from '@cli/ipc-client'
import { lookForAgentType } from '@shared/agent-look'
import type { AgentEvent } from '@shared/types'

const DEFAULT_SUBAGENT_TYPE = 'general-purpose'

type Raw = Record<string, unknown>

function isStr(v: unknown): v is string {
  return typeof v === 'string'
}

function parseAgentIntent(obj: Raw, sessionId: string): AgentEvent | null {
  if (obj.tool_name !== 'Agent') return null
  const input = (typeof obj.tool_input === 'object' && obj.tool_input) || {}
  const { subagent_type: agentType, description } = input as Raw
  return {
    type: 'agent:intent',
    sessionId,
    agentType: isStr(agentType) ? agentType : DEFAULT_SUBAGENT_TYPE,
    description: isStr(description) ? description : '',
  }
}

/**
 * Claude Code 훅 stdin(JSON)을 termcat 이벤트로 바꾼다. 관심 없는 훅이면 null.
 * - SubagentStart / SubagentStop → agent:start / agent:stop
 * - PostToolUse (서브에이전트 안에서) → agent:activity
 * - PreToolUse (Agent 도구) → agent:intent (이름으로 쓸 description)
 * - SessionEnd → agent:session-end
 */
export function hookPayloadToEvent(raw: unknown, now: number = Date.now()): AgentEvent | null {
  if (typeof raw !== 'object' || raw === null) return null
  const obj = raw as Raw
  if (!isStr(obj.session_id)) return null
  const sessionId = obj.session_id
  const name = obj.hook_event_name

  if (name === 'SubagentStart' && isStr(obj.agent_id) && isStr(obj.agent_type)) {
    return { type: 'agent:start', sessionId, agentId: obj.agent_id, agentType: obj.agent_type }
  }
  if (name === 'SubagentStop' && isStr(obj.agent_id)) {
    return { type: 'agent:stop', sessionId, agentId: obj.agent_id }
  }
  if (name === 'PostToolUse' && isStr(obj.agent_id)) {
    const toolName = isStr(obj.tool_name) ? obj.tool_name : 'unknown'
    return { type: 'agent:activity', sessionId, agentId: obj.agent_id, toolName, timestamp: now }
  }
  if (name === 'PreToolUse') return parseAgentIntent(obj, sessionId)
  if (name === 'SessionEnd') return { type: 'agent:session-end', sessionId }
  return null
}

/** SubagentStart 에 한해 서브에이전트에게 자기 고양이와 `termcat status` 를 알려준다. */
export function hookResponse(
  event: AgentEvent | null,
  connected: boolean
): Record<string, unknown> {
  if (!connected || event?.type !== 'agent:start') return {}
  const look = lookForAgentType(event.agentType)
  return {
    hookSpecificOutput: {
      hookEventName: 'SubagentStart',
      additionalContext:
        `termcat HUD: you appear in the macOS menu bar as the ${look.color} cat ` +
        `(role "${event.agentType}"). Run \`termcat status\` to see every running agent.`,
    },
  }
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = ''
    process.stdin.setEncoding('utf-8')
    process.stdin.on('data', (chunk) => {
      data += chunk
    })
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', () => resolve(data))
  })
}

/** `termcat hook`: 훅 입력을 데몬에 전달하고 항상 0 으로 끝난다 (Claude Code 를 막지 않기 위해). */
export async function runHookCommand(ipc: IpcClient): Promise<void> {
  let event: AgentEvent | null = null
  try {
    event = hookPayloadToEvent(JSON.parse(await readStdin()))
  } catch {
    event = null
  }

  let connected = false
  try {
    await ipc.connect()
    connected = true
  } catch {
    connected = false
  }

  const response = hookResponse(event, connected)
  process.stdout.write(JSON.stringify(response) + '\n')
  if (event && connected) {
    ipc.sendAndExit(event, 0)
    return
  }
  ipc.disconnect()
  process.exit(0)
}
