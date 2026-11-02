import { describe, expect, it } from 'vitest'

import { AGENT_STALE_MS, createAgentRegistry } from '@main/agent-registry'

const SESSION = 'sess-1'

describe('createAgentRegistry', () => {
  it('is empty until an agent starts', () => {
    expect(createAgentRegistry(() => 0).tick()).toEqual([])
  })

  it('tracks a started agent with its type as the default name', () => {
    const registry = createAgentRegistry(() => 1000)
    registry.handle({
      type: 'agent:start',
      sessionId: SESSION,
      agentId: 'a1',
      agentType: 'Explore',
    })
    const [agent] = registry.tick()
    expect(agent).toMatchObject({
      key: `${SESSION}:a1`,
      agentType: 'Explore',
      name: 'Explore',
      startedAt: 1000,
      speedLevel: 'slow',
    })
  })

  it('names the agent after the matching Agent-tool description', () => {
    const registry = createAgentRegistry(() => 1000)
    registry.handle({
      type: 'agent:intent',
      sessionId: SESSION,
      agentType: 'Explore',
      description: 'Find API endpoints',
    })
    registry.handle({
      type: 'agent:start',
      sessionId: SESSION,
      agentId: 'a1',
      agentType: 'Explore',
    })
    registry.handle({
      type: 'agent:start',
      sessionId: SESSION,
      agentId: 'a2',
      agentType: 'Explore',
    })
    const [first, second] = registry.tick()
    expect(first.name).toBe('Find API endpoints')
    expect(second.name).toBe('Explore')
  })

  it('does not hand an intent to a different session or role', () => {
    const registry = createAgentRegistry(() => 1000)
    registry.handle({
      type: 'agent:intent',
      sessionId: 'other',
      agentType: 'Plan',
      description: 'x',
    })
    registry.handle({ type: 'agent:start', sessionId: SESSION, agentId: 'a1', agentType: 'Plan' })
    expect(registry.tick()[0].name).toBe('Plan')
  })

  it('raises the level with tool activity', () => {
    const registry = createAgentRegistry(() => 1000)
    registry.handle({ type: 'agent:start', sessionId: SESSION, agentId: 'a1', agentType: 'Plan' })
    for (let i = 0; i < 6; i++) {
      registry.handle({
        type: 'agent:activity',
        sessionId: SESSION,
        agentId: 'a1',
        toolName: 'Read',
        timestamp: 1000 + i,
      })
    }
    expect(registry.tick()[0].speedLevel).toBe('fast')
  })

  it('ignores activity for unknown agents', () => {
    const registry = createAgentRegistry(() => 1000)
    registry.handle({
      type: 'agent:activity',
      sessionId: SESSION,
      agentId: 'ghost',
      toolName: 'Read',
      timestamp: 1000,
    })
    expect(registry.tick()).toEqual([])
  })

  it('removes an agent on stop', () => {
    const registry = createAgentRegistry(() => 1000)
    registry.handle({ type: 'agent:start', sessionId: SESSION, agentId: 'a1', agentType: 'Plan' })
    registry.handle({ type: 'agent:stop', sessionId: SESSION, agentId: 'a1' })
    expect(registry.tick()).toEqual([])
  })

  it('removes every agent of a session when the session ends', () => {
    const registry = createAgentRegistry(() => 1000)
    registry.handle({ type: 'agent:start', sessionId: SESSION, agentId: 'a1', agentType: 'Plan' })
    registry.handle({ type: 'agent:start', sessionId: 'other', agentId: 'a1', agentType: 'Plan' })
    registry.handle({ type: 'agent:session-end', sessionId: SESSION })
    expect(registry.tick().map((a) => a.sessionId)).toEqual(['other'])
  })

  it('drops agents with no activity for a long time', () => {
    let now = 1000
    const registry = createAgentRegistry(() => now)
    registry.handle({ type: 'agent:start', sessionId: SESSION, agentId: 'a1', agentType: 'Plan' })
    now += AGENT_STALE_MS + 1
    expect(registry.tick()).toEqual([])
  })
})
