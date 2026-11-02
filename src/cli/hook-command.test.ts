import { describe, expect, it } from 'vitest'

import { hookPayloadToEvent, hookResponse } from '@cli/hook-command'

const BASE = { session_id: 'sess', transcript_path: '/t', cwd: '/c' }

describe('hookPayloadToEvent', () => {
  it('maps SubagentStart to agent:start', () => {
    const event = hookPayloadToEvent({
      ...BASE,
      hook_event_name: 'SubagentStart',
      agent_id: 'a1',
      agent_type: 'Explore',
    })
    expect(event).toEqual({
      type: 'agent:start',
      sessionId: 'sess',
      agentId: 'a1',
      agentType: 'Explore',
    })
  })

  it('maps SubagentStop to agent:stop', () => {
    const event = hookPayloadToEvent({ ...BASE, hook_event_name: 'SubagentStop', agent_id: 'a1' })
    expect(event).toEqual({ type: 'agent:stop', sessionId: 'sess', agentId: 'a1' })
  })

  it('maps PostToolUse inside a subagent to agent:activity', () => {
    const event = hookPayloadToEvent(
      { ...BASE, hook_event_name: 'PostToolUse', agent_id: 'a1', tool_name: 'Read' },
      123
    )
    expect(event).toEqual({
      type: 'agent:activity',
      sessionId: 'sess',
      agentId: 'a1',
      toolName: 'Read',
      timestamp: 123,
    })
  })

  it('ignores PostToolUse on the main thread', () => {
    expect(
      hookPayloadToEvent({ ...BASE, hook_event_name: 'PostToolUse', tool_name: 'Read' })
    ).toBeNull()
  })

  it('maps a PreToolUse Agent call to agent:intent with its description', () => {
    const event = hookPayloadToEvent({
      ...BASE,
      hook_event_name: 'PreToolUse',
      tool_name: 'Agent',
      tool_input: { subagent_type: 'Plan', description: 'Plan the migration' },
    })
    expect(event).toEqual({
      type: 'agent:intent',
      sessionId: 'sess',
      agentType: 'Plan',
      description: 'Plan the migration',
    })
  })

  it('defaults the intent type to general-purpose', () => {
    const event = hookPayloadToEvent({
      ...BASE,
      hook_event_name: 'PreToolUse',
      tool_name: 'Agent',
      tool_input: { description: 'x' },
    })
    expect(event).toMatchObject({ type: 'agent:intent', agentType: 'general-purpose' })
  })

  it('ignores PreToolUse for other tools', () => {
    expect(
      hookPayloadToEvent({ ...BASE, hook_event_name: 'PreToolUse', tool_name: 'Bash' })
    ).toBeNull()
  })

  it('maps SessionEnd to agent:session-end', () => {
    expect(hookPayloadToEvent({ ...BASE, hook_event_name: 'SessionEnd' })).toEqual({
      type: 'agent:session-end',
      sessionId: 'sess',
    })
  })

  it('returns null for unrelated or malformed payloads', () => {
    expect(hookPayloadToEvent({ ...BASE, hook_event_name: 'Notification' })).toBeNull()
    expect(hookPayloadToEvent({ hook_event_name: 'SubagentStart', agent_id: 'a' })).toBeNull()
    expect(hookPayloadToEvent('nope')).toBeNull()
  })
})

describe('hookResponse', () => {
  it('tells a starting subagent its cat and the status command', () => {
    const response = hookResponse(
      { type: 'agent:start', sessionId: 's', agentId: 'a', agentType: 'Explore' },
      true
    )
    const output = response.hookSpecificOutput as { additionalContext: string }
    expect(output.additionalContext).toContain('blue cat')
    expect(output.additionalContext).toContain('termcat status')
  })

  it('stays silent when the daemon is not running or for other events', () => {
    expect(
      hookResponse({ type: 'agent:start', sessionId: 's', agentId: 'a', agentType: 'x' }, false)
    ).toEqual({})
    expect(hookResponse({ type: 'agent:session-end', sessionId: 's' }, true)).toEqual({})
    expect(hookResponse(null, true)).toEqual({})
  })
})
