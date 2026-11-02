import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { dirname, join } from 'path'

/** termcat 이 설치한 훅을 알아보는 표식. 앱 경로가 바뀌어도 이 표식으로 제거한다 */
export const HOOK_MARKER = 'TERMCAT_HOOK=1'
/** 훅 하나가 Claude Code 를 붙잡을 수 있는 최대 시간(초). 데몬이 없으면 즉시 끝난다 */
const HOOK_TIMEOUT_SEC = 5

type Json = Record<string, unknown>

interface HookCommand {
  type: 'command'
  command: string
  timeout: number
}

interface HookGroup {
  matcher?: string
  hooks: HookCommand[]
}

/** 구독할 훅 이벤트와 matcher. PreToolUse 는 Agent 도구만 (이름 수집), PostToolUse 는 전부 (활동량) */
const HOOK_EVENTS: Array<{ event: string; matcher?: string }> = [
  { event: 'SubagentStart' },
  { event: 'SubagentStop' },
  { event: 'PreToolUse', matcher: 'Agent' },
  { event: 'PostToolUse' },
  { event: 'SessionEnd' },
]

export function getClaudeSettingsPath(): string {
  return join(homedir(), '.claude', 'settings.json')
}

/** `termcat hook` 을 실행하는 셸 커맨드. 절대 경로라 PATH/alias 와 무관하게 동작한다. */
export function buildHookCommand(execPath: string, cliEntryPath: string): string {
  return `env ELECTRON_RUN_AS_NODE=1 ${HOOK_MARKER} "${execPath}" "${cliEntryPath}" hook`
}

function isTermcatHook(hook: unknown): boolean {
  return (
    typeof hook === 'object' &&
    hook !== null &&
    String((hook as Json).command).includes(HOOK_MARKER)
  )
}

function asGroups(value: unknown): HookGroup[] {
  return Array.isArray(value) ? (value as HookGroup[]) : []
}

/** 모든 이벤트에서 termcat 훅만 걷어낸 설정을 돌려준다 (다른 훅은 그대로). */
export function withoutTermcatHooks(settings: Json): Json {
  const hooks = (typeof settings.hooks === 'object' && settings.hooks) || {}
  const cleaned: Json = {}
  for (const [event, groups] of Object.entries(hooks as Json)) {
    const kept = asGroups(groups)
      .map((g) => ({ ...g, hooks: (g.hooks ?? []).filter((h) => !isTermcatHook(h)) }))
      .filter((g) => g.hooks.length > 0)
    if (kept.length > 0) cleaned[event] = kept
  }
  return { ...settings, hooks: cleaned }
}

/** 기존 termcat 훅을 걷어낸 뒤 현재 커맨드로 다시 붙인다 (재설치 = 경로 갱신). */
export function withTermcatHooks(settings: Json, command: string): Json {
  const base = withoutTermcatHooks(settings)
  const hooks = { ...(base.hooks as Json) }
  for (const { event, matcher } of HOOK_EVENTS) {
    const group: HookGroup = {
      ...(matcher ? { matcher } : {}),
      hooks: [{ type: 'command', command, timeout: HOOK_TIMEOUT_SEC }],
    }
    hooks[event] = [...asGroups(hooks[event]), group]
  }
  return { ...base, hooks }
}

export function hasTermcatHooks(settings: Json): boolean {
  const hooks = (typeof settings.hooks === 'object' && settings.hooks) || {}
  return Object.values(hooks as Json).some((groups) =>
    asGroups(groups).some((g) => (g.hooks ?? []).some(isTermcatHook))
  )
}

function readSettings(path: string): Json {
  if (!existsSync(path)) return {}
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf-8'))
  return typeof parsed === 'object' && parsed !== null ? (parsed as Json) : {}
}

function writeSettings(path: string, settings: Json): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(settings, null, 2) + '\n', 'utf-8')
}

export function installClaudeHooks(command: string, path = getClaudeSettingsPath()): void {
  writeSettings(path, withTermcatHooks(readSettings(path), command))
}

export function uninstallClaudeHooks(path = getClaudeSettingsPath()): void {
  if (!existsSync(path)) return
  writeSettings(path, withoutTermcatHooks(readSettings(path)))
}

export function areClaudeHooksInstalled(path = getClaudeSettingsPath()): boolean {
  try {
    return hasTermcatHooks(readSettings(path))
  } catch {
    return false
  }
}
