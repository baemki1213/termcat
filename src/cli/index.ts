import {
  buildHookCommand,
  getClaudeSettingsPath,
  installClaudeHooks,
  uninstallClaudeHooks,
} from '@cli/claude-hooks'
import { runHookCommand } from '@cli/hook-command'
import { createIpcClient } from '@cli/ipc-client'
import { runStatusCommand } from '@cli/status-command'

const USAGE = `Usage:
  termcat <command> [args...]     run a command and show its output speed as a menu-bar cat
  termcat status [--json]         show running sessions and Claude Code subagents
  termcat hooks install|uninstall register Claude Code hooks for the agent HUD
  termcat hook                    (used by Claude Code hooks; reads the hook payload from stdin)
`

function runHooksCommand(action: string | undefined): void {
  const settingsPath = getClaudeSettingsPath()
  if (action === 'install') {
    installClaudeHooks(buildHookCommand(process.execPath, process.argv[1]))
    process.stdout.write(`termcat: Claude Code hooks installed in ${settingsPath}\n`)
    return
  }
  if (action === 'uninstall') {
    uninstallClaudeHooks()
    process.stdout.write(`termcat: Claude Code hooks removed from ${settingsPath}\n`)
    return
  }
  process.stderr.write(USAGE)
  process.exit(1)
}

async function runWrapper(command: string, args: string[]): Promise<void> {
  const ipc = createIpcClient()
  try {
    await ipc.connect()
  } catch {
    // daemon not running — tracking disabled silently
  }
  // node-pty 네이티브 모듈은 래퍼 모드에서만 필요하므로 훅/상태 조회 경로에서는 로드하지 않는다.
  const { runPtyWrapper } = await import('./pty-wrapper.js')
  runPtyWrapper(command, args, ipc)
}

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv

  if (!command) {
    process.stderr.write(USAGE)
    process.exit(1)
  }
  if (command === 'hook') return runHookCommand(createIpcClient())
  if (command === 'status') return runStatusCommand(createIpcClient(), args.includes('--json'))
  if (command === 'hooks') return runHooksCommand(args[0])
  return runWrapper(command, args)
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  process.stderr.write(`termcat: ${message}\n`)
  process.exit(1)
})
