import { AGENT_COLOR_HEX, lookForAgentType } from '@shared/agent-look'
import type { AgentSnapshot } from '@shared/types'

import { formatDuration, SPEED_COLORS, SPEED_LABEL } from './format'
import * as s from './Popup.css'

const SESSION_ID_CHARS = 8

export function AgentCard({ agent }: { agent: AgentSnapshot }): JSX.Element {
  const colors = SPEED_COLORS[agent.speedLevel]
  const look = lookForAgentType(agent.agentType)

  return (
    <div className={s.sessionItem}>
      <div className={s.agentHeader}>
        <span className={s.agentDot} style={{ background: AGENT_COLOR_HEX[look.color] }} />
        <p className={s.sessionCommand}>{agent.name}</p>
      </div>

      <div className={s.sessionMeta}>
        <span className={s.agentRole}>{agent.agentType}</span>
        <span className={s.speedBadge} style={{ background: colors.bg, color: colors.fg }}>
          {SPEED_LABEL[agent.speedLevel]}
        </span>
        <span className={s.cps}>{Math.round(agent.toolCallsPerMinute)} calls/min</span>
      </div>

      <p className={s.duration}>
        {formatDuration(agent.startedAt)} · 세션 {agent.sessionId.slice(0, SESSION_ID_CHARS)}
      </p>
    </div>
  )
}
