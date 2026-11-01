import { describe, expect, it } from 'vitest'

import { createSessionManager } from '@main/session-manager'
import type { SpeedThresholds } from '@shared/types'

const NO_SMOOTH: SpeedThresholds = { slow: 20, mid: 100, smoothingTicks: 1 }

describe('createSessionManager', () => {
  it('returns an empty list when no sessions exist', () => {
    const manager = createSessionManager()
    expect(manager.tick()).toEqual([])
  })

  it('returns an empty list after all sessions exit', () => {
    const manager = createSessionManager(() => NO_SMOOTH)
    manager.onStart(1, 'claude')
    manager.onData(1, 200, Date.now())
    manager.onExit(1)
    expect(manager.tick()).toEqual([])
  })

  it('reflects the speed level of the active session', () => {
    const manager = createSessionManager(() => NO_SMOOTH)
    manager.onStart(1, 'claude')
    manager.onData(1, 200, Date.now()) // 200 cps → fast
    expect(manager.tick()).toEqual([{ pid: 1, level: 'fast' }])
  })

  it('ignores data for unknown pids without throwing', () => {
    const manager = createSessionManager(() => NO_SMOOTH)
    manager.onData(999, 200, Date.now()) // unknown pid
    expect(manager.tick()).toEqual([])
  })

  it('returns an independent level per concurrent session, in start order', () => {
    const manager = createSessionManager(() => NO_SMOOTH)
    manager.onStart(1, 'claude')
    manager.onStart(2, 'chatgpt')
    manager.onData(1, 10, Date.now()) // slow
    manager.onData(2, 200, Date.now()) // fast
    expect(manager.tick()).toEqual([
      { pid: 1, level: 'slow' },
      { pid: 2, level: 'fast' },
    ])
  })

  it('removes only the exited session, keeps others active', () => {
    const manager = createSessionManager(() => NO_SMOOTH)
    manager.onStart(1, 'claude')
    manager.onStart(2, 'chatgpt')
    manager.onData(1, 200, Date.now()) // fast
    manager.onExit(2)
    expect(manager.tick()).toEqual([{ pid: 1, level: 'fast' }])
  })

  it('handles multiple independent session lifecycles', () => {
    const manager = createSessionManager(() => NO_SMOOTH)

    manager.onStart(1, 'claude')
    manager.onExit(1)
    expect(manager.tick()).toEqual([])

    manager.onStart(2, 'chatgpt')
    manager.onData(2, 60, Date.now()) // mid
    expect(manager.tick()).toEqual([{ pid: 2, level: 'mid' }])
  })

  it('exposes the last ticked level in snapshots', () => {
    const manager = createSessionManager(() => NO_SMOOTH)
    manager.onStart(1, 'claude')
    manager.onData(1, 200, Date.now())
    manager.tick()
    expect(manager.getSnapshots()[0].speedLevel).toBe('fast')
  })
})
