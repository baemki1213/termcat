import type { IpcClient } from '@cli/ipc-client'
import type { AgentSnapshot, SessionSnapshot, StatusReport } from '@shared/types'

function formatSession(s: SessionSnapshot): string {
  return `  [${s.speedLevel}] ${s.command} (pid ${s.pid}, ${Math.round(s.cps)} chars/s)`
}

function formatAgent(a: AgentSnapshot): string {
  const calls = Math.round(a.toolCallsPerMinute)
  return `  [${a.speedLevel}] ${a.name} — ${a.agentType} (${calls} calls/min, session ${a.sessionId.slice(0, 8)})`
}

/** 사람이 읽는 형식. 에이전트가 읽을 땐 `--json` 을 쓴다. */
export function formatStatus(status: StatusReport): string {
  const lines = [`sessions (${status.sessions.length}):`]
  lines.push(...(status.sessions.length ? status.sessions.map(formatSession) : ['  (none)']))
  lines.push(`agents (${status.agents.length}):`)
  lines.push(...(status.agents.length ? status.agents.map(formatAgent) : ['  (none)']))
  return lines.join('\n') + '\n'
}

/** `termcat status [--json]`: 데몬에 현황을 물어 출력한다. 데몬이 없으면 1 로 끝난다. */
export async function runStatusCommand(ipc: IpcClient, json: boolean): Promise<void> {
  try {
    await ipc.connect()
  } catch {
    process.stderr.write('termcat: app is not running\n')
    process.exit(1)
  }
  const line = await ipc.request({ type: 'status:get' })
  process.stdout.write(json ? line + '\n' : formatStatus(JSON.parse(line) as StatusReport))
  process.exit(0)
}
