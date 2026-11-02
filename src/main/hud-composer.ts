import { AGENT_COLOR_HEX, lookForAgentType } from '@shared/agent-look'
import type {
  AgentSnapshot,
  CatStyle,
  HudEntry,
  MultiSessionDisplay,
  SessionLevel,
  SpeedLevel,
} from '@shared/types'

/** sessionColors 가 켜지면 세션 i 는 이 팔레트의 i 번째 색을 받는다 (다크/라이트 메뉴바 모두에서 보이는 채도). */
export const SESSION_PALETTE = ['#FF8C42', '#3FA7FF', '#3DD37A', '#FF5DA2'] as const

/** 메뉴바가 너무 넓어지지 않도록 에이전트 이름은 이 길이까지만 보여준다 */
const TITLE_MAX_CHARS = 10
const APP_TOOLTIP = 'termcat'

const LEVEL_RANK: Record<SpeedLevel, number> = { idle: 0, slow: 1, mid: 2, fast: 3 }

function maxLevel(levels: SpeedLevel[]): SpeedLevel {
  return levels.reduce<SpeedLevel>((max, l) => (LEVEL_RANK[l] > LEVEL_RANK[max] ? l : max), 'idle')
}

function shortTitle(name: string): string {
  const trimmed = name.trim()
  return trimmed.length > TITLE_MAX_CHARS ? `${trimmed.slice(0, TITLE_MAX_CHARS - 1)}…` : trimmed
}

export interface HudSettings {
  style: CatStyle
  display: MultiSessionDisplay
  sessionColors: boolean
  /** 서브에이전트 고양이를 보여줄지 */
  agentHud: boolean
}

export type HudComposer = ReturnType<typeof createHudComposer>

/**
 * 세션 속도와 에이전트 현황을 설정에 맞춰 "메뉴바에 그릴 고양이 목록"으로 바꾼다.
 * 세션 고양이가 앞, 에이전트 고양이가 뒤에 온다. 항상 최소 한 마리(idle)는 돌려준다.
 */
export function createHudComposer(initial: HudSettings) {
  const settings: HudSettings = { ...initial }

  function idleEntry(): HudEntry {
    return {
      key: 'idle',
      level: 'idle',
      style: settings.style,
      tint: null,
      title: '',
      tooltip: APP_TOOLTIP,
    }
  }

  function sessionEntry(session: SessionLevel, index: number): HudEntry {
    return {
      key: `session:${session.pid}`,
      level: session.level,
      style: settings.style,
      tint: settings.sessionColors ? SESSION_PALETTE[index % SESSION_PALETTE.length] : null,
      title: '',
      tooltip: APP_TOOLTIP,
    }
  }

  function agentEntry(agent: AgentSnapshot): HudEntry {
    const look = lookForAgentType(agent.agentType)
    return {
      key: `agent:${agent.key}`,
      level: agent.speedLevel,
      style: look.style,
      tint: AGENT_COLOR_HEX[look.color],
      title: shortTitle(agent.name),
      tooltip: `${agent.name} · ${agent.agentType}`,
    }
  }

  /** 'single' 모드: 모든 고양이를 가장 빠른 속도 한 마리로 합친다. */
  function collapse(entries: HudEntry[]): HudEntry[] {
    return [{ ...idleEntry(), key: 'single', level: maxLevel(entries.map((e) => e.level)) }]
  }

  return {
    compose(sessions: SessionLevel[], agents: AgentSnapshot[]): HudEntry[] {
      const entries = [
        ...sessions.map(sessionEntry),
        ...(settings.agentHud ? agents.map(agentEntry) : []),
      ]
      if (entries.length === 0) return [idleEntry()]
      return settings.display === 'single' ? collapse(entries) : entries
    },
    setStyle(style: CatStyle): void {
      settings.style = style
    },
    setDisplay(display: MultiSessionDisplay): void {
      settings.display = display
    },
    setSessionColors(enabled: boolean): void {
      settings.sessionColors = enabled
    },
    setAgentHud(enabled: boolean): void {
      settings.agentHud = enabled
    },
  }
}
