export type ClaudeModel =
  | 'claude-opus-4-7'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5-20251001'
  | (string & {})

export type CatStyle = 'cat' | 'cat2' | 'runner'

/** 세션이 여러 개일 때 고양이를 세션마다 한 마리씩 보여줄지, 가장 빠른 속도 한 마리로 합칠지 */
export type MultiSessionDisplay = 'multi' | 'single'

export type IpcChannel =
  | 'onboarding:apply'
  | 'onboarding:close'
  | 'onboarding:skip'
  | 'ai-shortcut:list'
  | 'ai-shortcut:save'
  | 'ai-shortcut:delete'
  | 'settings:close'
  | 'thresholds:get'
  | 'thresholds:set'
  | 'cat-style:get'
  | 'cat-style:set'
  | 'multi-session-display:get'
  | 'multi-session-display:set'
  | 'session-colors:get'
  | 'session-colors:set'
  | 'agent-hud:get'
  | 'agent-hud:set'
  | 'popup:get-sessions'
  | 'popup:quit'

export interface AIShortcut {
  id: string
  name: string
  command: string
}

export type SpeedLevel = 'idle' | 'slow' | 'mid' | 'fast'

export interface SessionLevel {
  pid: number
  level: SpeedLevel
}

export interface TokenStats {
  model: ClaudeModel | null
  inputTokens: number
  outputTokens: number
  contextWindowSize: number
  contextUsedPercent: number
}

export interface SessionSnapshot {
  pid: number
  command: string
  startedAt: number
  speedLevel: SpeedLevel
  cps: number
  tokens: Partial<TokenStats> | null
}

/** Claude Code 서브에이전트 하나의 현재 상태 (훅 이벤트로 수집). */
export interface AgentSnapshot {
  /** `${sessionId}:${agentId}` — 세션이 달라도 유일하다 */
  key: string
  sessionId: string
  agentId: string
  /** 에이전트 정의의 name (Explore, Plan, general-purpose, my-plugin:reviewer ...) */
  agentType: string
  /** Agent 도구 호출의 description. 없으면 agentType */
  name: string
  startedAt: number
  speedLevel: SpeedLevel
  toolCallsPerMinute: number
  lastActivityAt: number
}

/** Claude Code 에이전트 frontmatter `color` 와 같은 이름 체계 */
export type AgentColorName =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'cyan'

/** 역할(agentType)별 고양이 외모 */
export interface AgentLook {
  color: AgentColorName
  style: CatStyle
}

/** 메뉴바에 그릴 고양이 한 마리 */
export interface HudEntry {
  key: string
  level: SpeedLevel
  style: CatStyle
  /** null 이면 템플릿(메뉴바 색) 그대로 */
  tint: string | null
  /** 아이콘 옆에 붙는 짧은 텍스트. 빈 문자열이면 없음 */
  title: string
  tooltip: string
}

/** `termcat status` 와 팝업이 공유하는 전체 현황 */
export interface StatusReport {
  sessions: SessionSnapshot[]
  agents: AgentSnapshot[]
}

export interface PopupState extends StatusReport {
  openAtLogin: boolean
}

/** @deprecated Use SessionSnapshot */
export interface SessionStats {
  model: ClaudeModel | null
  inputTokens: number
  outputTokens: number
  contextWindowSize: number
  contextUsedPercent: number
  isActive: boolean
  sessionStartedAt: string | null
}

export interface SpeedThresholds {
  slow: number
  mid: number
  smoothingTicks: number
}

export const DEFAULT_SPEED_THRESHOLDS: SpeedThresholds = {
  slow: 20,
  mid: 100,
  smoothingTicks: 3,
}

export type CliEvent =
  | { type: 'session:start'; pid: number; command: string }
  | { type: 'session:data'; pid: number; chars: number; timestamp: number }
  | { type: 'session:exit'; pid: number; code: number }
  | { type: 'session:stats'; pid: number; tokens: Partial<TokenStats> }
  | AgentEvent
  | { type: 'status:get' }

/** Claude Code 훅(`termcat hook`)이 보내는 서브에이전트 이벤트 */
export type AgentEvent =
  | { type: 'agent:intent'; sessionId: string; agentType: string; description: string }
  | { type: 'agent:start'; sessionId: string; agentId: string; agentType: string }
  | {
      type: 'agent:activity'
      sessionId: string
      agentId: string
      toolName: string
      timestamp: number
    }
  | { type: 'agent:stop'; sessionId: string; agentId: string }
  | { type: 'agent:session-end'; sessionId: string }
