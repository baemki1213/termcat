import { describe, expect, it } from 'vitest'

import {
  buildHookCommand,
  hasTermcatHooks,
  HOOK_MARKER,
  withoutTermcatHooks,
  withTermcatHooks,
} from '@cli/claude-hooks'

const CMD = buildHookCommand('/Applications/termcat.app/Contents/MacOS/termcat', '/x/cli/index.js')

describe('buildHookCommand', () => {
  it('runs the cli entry in node mode with the marker', () => {
    expect(CMD).toBe(
      `env ELECTRON_RUN_AS_NODE=1 ${HOOK_MARKER} "/Applications/termcat.app/Contents/MacOS/termcat" "/x/cli/index.js" hook`
    )
  })
})

describe('withTermcatHooks', () => {
  it('adds a hook group for every event on empty settings', () => {
    const result = withTermcatHooks({}, CMD)
    const hooks = result.hooks as Record<string, Array<{ matcher?: string; hooks: unknown[] }>>
    expect(Object.keys(hooks).sort()).toEqual(
      ['PostToolUse', 'PreToolUse', 'SessionEnd', 'SubagentStart', 'SubagentStop'].sort()
    )
    expect(hooks.PreToolUse[0].matcher).toBe('Agent')
    expect(hooks.PostToolUse[0].matcher).toBeUndefined()
    expect(hooks.SubagentStart[0].hooks[0]).toEqual({ type: 'command', command: CMD, timeout: 5 })
  })

  it('keeps unrelated hooks and other settings', () => {
    const other = { matcher: '*', hooks: [{ type: 'command', command: 'echo hi' }] }
    const result = withTermcatHooks({ model: 'opus', hooks: { PreToolUse: [other] } }, CMD)
    const hooks = result.hooks as Record<string, unknown[]>
    expect(result.model).toBe('opus')
    expect(hooks.PreToolUse).toHaveLength(2)
    expect(hooks.PreToolUse[0]).toEqual(other)
  })

  it('is idempotent and refreshes the command on reinstall', () => {
    const once = withTermcatHooks({}, 'env TERMCAT_HOOK=1 old hook')
    const twice = withTermcatHooks(once, CMD)
    const hooks = twice.hooks as Record<string, Array<{ hooks: Array<{ command: string }> }>>
    expect(hooks.SubagentStart).toHaveLength(1)
    expect(hooks.SubagentStart[0].hooks[0].command).toBe(CMD)
  })
})

describe('withoutTermcatHooks', () => {
  it('removes only termcat hooks and drops empty groups', () => {
    const other = { hooks: [{ type: 'command', command: 'echo hi' }] }
    const installed = withTermcatHooks({ hooks: { Stop: [other] } }, CMD)
    const result = withoutTermcatHooks(installed)
    expect(result.hooks).toEqual({ Stop: [other] })
    expect(hasTermcatHooks(result)).toBe(false)
  })

  it('removes a termcat hook that shares a group with another hook', () => {
    const settings = {
      hooks: {
        PostToolUse: [
          {
            hooks: [
              { type: 'command', command: 'echo' },
              { type: 'command', command: CMD },
            ],
          },
        ],
      },
    }
    const result = withoutTermcatHooks(settings)
    expect(result.hooks).toEqual({
      PostToolUse: [{ hooks: [{ type: 'command', command: 'echo' }] }],
    })
  })

  it('tolerates settings without hooks', () => {
    expect(withoutTermcatHooks({ model: 'x' })).toEqual({ model: 'x', hooks: {} })
  })
})

describe('hasTermcatHooks', () => {
  it('detects installed hooks', () => {
    expect(hasTermcatHooks({})).toBe(false)
    expect(hasTermcatHooks(withTermcatHooks({}, CMD))).toBe(true)
  })
})
