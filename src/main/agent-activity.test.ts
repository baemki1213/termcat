import { describe, expect, it } from 'vitest'

import { AGENT_ACTIVITY_WINDOW_MS, createAgentActivity } from '@main/agent-activity'

describe('createAgentActivity', () => {
  it('is idle with no calls', () => {
    const activity = createAgentActivity(() => 1000)
    expect(activity.tick()).toBe('idle')
    expect(activity.getCallsPerMinute()).toBe(0)
  })

  it('classifies by number of calls inside the window', () => {
    const activity = createAgentActivity(() => 100_000)
    activity.record(99_000)
    expect(activity.tick()).toBe('slow')
    activity.record(99_100)
    activity.record(99_200)
    expect(activity.tick()).toBe('mid')
    for (let i = 0; i < 3; i++) activity.record(99_300 + i)
    expect(activity.tick()).toBe('fast')
  })

  it('forgets calls older than the window', () => {
    let now = 100_000
    const activity = createAgentActivity(() => now)
    activity.record(now)
    expect(activity.tick()).toBe('slow')
    now += AGENT_ACTIVITY_WINDOW_MS + 1
    expect(activity.tick()).toBe('idle')
  })

  it('scales calls per minute from the window', () => {
    const activity = createAgentActivity(() => 100_000)
    activity.record(100_000)
    expect(activity.getCallsPerMinute()).toBe(4)
  })
})
