import type { AgentColorName, AgentLook } from '@shared/types'

/** Claude Code frontmatter 색 이름 → 메뉴바(다크/라이트)에서 모두 보이는 hex */
export const AGENT_COLOR_HEX: Record<AgentColorName, string> = {
  red: '#FF5C5C',
  blue: '#3FA7FF',
  green: '#3DD37A',
  yellow: '#FFD23F',
  purple: '#B388FF',
  orange: '#FF8C42',
  pink: '#FF5DA2',
  cyan: '#2EE6D6',
}

/** 모르는 역할은 이름 해시로 이 순서에서 색을 고른다 */
const FALLBACK_COLORS: AgentColorName[] = [
  'orange',
  'blue',
  'green',
  'pink',
  'purple',
  'cyan',
  'yellow',
  'red',
]

/** 내장 에이전트 역할의 기본 외모 */
const BUILTIN_LOOKS: Record<string, AgentLook> = {
  Explore: { color: 'blue', style: 'cat' },
  Plan: { color: 'green', style: 'cat' },
  'general-purpose': { color: 'orange', style: 'runner' },
  'claude-code-guide': { color: 'purple', style: 'cat' },
  fork: { color: 'cyan', style: 'runner' },
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

/** 역할(agentType)마다 같은 외모가 나오도록 결정적으로 고른다. */
export function lookForAgentType(agentType: string): AgentLook {
  const builtin = BUILTIN_LOOKS[agentType]
  if (builtin) return builtin
  const color = FALLBACK_COLORS[hashString(agentType) % FALLBACK_COLORS.length]
  return { color, style: 'runner' }
}
