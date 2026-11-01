import type { Tray } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const animators: Array<{ setLevel: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn> }> =
  []

vi.mock('@main/tray-animator', () => ({
  createTrayAnimator: vi.fn(() => {
    const animator = { setLevel: vi.fn(), destroy: vi.fn() }
    animators.push(animator)
    return animator
  }),
}))

import { createMultiTrayManager, SESSION_PALETTE } from '@main/multi-tray-manager'
import { createTrayAnimator } from '@main/tray-animator'

function makeTrayFactory(): {
  createTray: () => Tray
  trays: Array<{ destroy: ReturnType<typeof vi.fn> }>
} {
  const trays: Array<{ destroy: ReturnType<typeof vi.fn> }> = []
  const createTray = vi.fn(() => {
    const tray = { destroy: vi.fn() }
    trays.push(tray)
    return tray as unknown as Tray
  })
  return { createTray, trays }
}

describe('createMultiTrayManager', () => {
  beforeEach(() => {
    animators.length = 0
    vi.mocked(createTrayAnimator).mockClear()
  })

  it('keeps a single idle tray when there are no sessions', () => {
    const { createTray } = makeTrayFactory()
    const manager = createMultiTrayManager(createTray, '/sprites', {
      style: 'cat',
      display: 'multi',
      sessionColors: false,
    })
    manager.update([])
    expect(manager.getTrayCount()).toBe(1)
    expect(animators[0].setLevel).toHaveBeenLastCalledWith('idle')
  })

  it('creates one tray per session', () => {
    const { createTray } = makeTrayFactory()
    const manager = createMultiTrayManager(createTray, '/sprites', {
      style: 'cat',
      display: 'multi',
      sessionColors: false,
    })
    manager.update([
      { pid: 1, level: 'slow' },
      { pid: 2, level: 'fast' },
      { pid: 3, level: 'idle' },
    ])
    expect(manager.getTrayCount()).toBe(3)
  })

  it('drives each tray with its own session level, in session order', () => {
    const { createTray } = makeTrayFactory()
    const manager = createMultiTrayManager(createTray, '/sprites', {
      style: 'cat',
      display: 'multi',
      sessionColors: false,
    })
    manager.update([
      { pid: 1, level: 'slow' },
      { pid: 2, level: 'fast' },
    ])
    expect(animators[0].setLevel).toHaveBeenLastCalledWith('slow')
    expect(animators[1].setLevel).toHaveBeenLastCalledWith('fast')
  })

  it('does not restart the animation when the level is unchanged', () => {
    const { createTray } = makeTrayFactory()
    const manager = createMultiTrayManager(createTray, '/sprites', {
      style: 'cat',
      display: 'multi',
      sessionColors: false,
    })
    manager.update([{ pid: 1, level: 'fast' }])
    const callsAfterFirst = animators[0].setLevel.mock.calls.length
    manager.update([{ pid: 1, level: 'fast' }])
    expect(animators[0].setLevel.mock.calls.length).toBe(callsAfterFirst)
  })

  it('removes extra trays when sessions exit, but never below one', () => {
    const { createTray, trays } = makeTrayFactory()
    const manager = createMultiTrayManager(createTray, '/sprites', {
      style: 'cat',
      display: 'multi',
      sessionColors: false,
    })
    manager.update([
      { pid: 1, level: 'fast' },
      { pid: 2, level: 'mid' },
    ])
    manager.update([])
    expect(manager.getTrayCount()).toBe(1)
    expect(trays[1].destroy).toHaveBeenCalled()
    expect(trays[0].destroy).not.toHaveBeenCalled()
    expect(animators[1].destroy).toHaveBeenCalled()
    expect(animators[0].setLevel).toHaveBeenLastCalledWith('idle')
  })

  it('rebuilds every animator with the new style and keeps current levels', () => {
    const { createTray } = makeTrayFactory()
    const manager = createMultiTrayManager(createTray, '/sprites', {
      style: 'cat',
      display: 'multi',
      sessionColors: false,
    })
    manager.update([
      { pid: 1, level: 'slow' },
      { pid: 2, level: 'fast' },
    ])
    manager.setStyle('cat2')
    expect(animators[0].destroy).toHaveBeenCalled()
    expect(animators[1].destroy).toHaveBeenCalled()
    expect(createTrayAnimator).toHaveBeenLastCalledWith(expect.anything(), '/sprites', 'cat2', null)
    expect(animators[2].setLevel).toHaveBeenLastCalledWith('slow')
    expect(animators[3].setLevel).toHaveBeenLastCalledWith('fast')
  })

  it('uses the new style for trays created after setStyle', () => {
    const { createTray } = makeTrayFactory()
    const manager = createMultiTrayManager(createTray, '/sprites', {
      style: 'cat',
      display: 'multi',
      sessionColors: false,
    })
    manager.update([])
    manager.setStyle('cat2')
    manager.update([
      { pid: 1, level: 'idle' },
      { pid: 2, level: 'idle' },
    ])
    expect(createTrayAnimator).toHaveBeenLastCalledWith(expect.anything(), '/sprites', 'cat2', null)
  })

  describe('single display mode', () => {
    it('shows one cat at the fastest session level', () => {
      const { createTray } = makeTrayFactory()
      const manager = createMultiTrayManager(createTray, '/sprites', {
        style: 'cat',
        display: 'single',
        sessionColors: false,
      })
      manager.update([
        { pid: 1, level: 'slow' },
        { pid: 2, level: 'fast' },
        { pid: 3, level: 'mid' },
      ])
      expect(manager.getTrayCount()).toBe(1)
      expect(animators[0].setLevel).toHaveBeenLastCalledWith('fast')
    })

    it('shows an idle cat when no sessions exist', () => {
      const { createTray } = makeTrayFactory()
      const manager = createMultiTrayManager(createTray, '/sprites', {
        style: 'cat',
        display: 'single',
        sessionColors: false,
      })
      manager.update([])
      expect(manager.getTrayCount()).toBe(1)
      expect(animators[0].setLevel).toHaveBeenLastCalledWith('idle')
    })

    it('collapses existing trays immediately when switching multi → single', () => {
      const { createTray, trays } = makeTrayFactory()
      const manager = createMultiTrayManager(createTray, '/sprites', {
        style: 'cat',
        display: 'multi',
        sessionColors: false,
      })
      manager.update([
        { pid: 1, level: 'slow' },
        { pid: 2, level: 'fast' },
      ])
      manager.setDisplay('single')
      expect(manager.getTrayCount()).toBe(1)
      expect(trays[1].destroy).toHaveBeenCalled()
      expect(animators[0].setLevel).toHaveBeenLastCalledWith('fast')
    })

    it('expands back to one tray per session when switching single → multi', () => {
      const { createTray } = makeTrayFactory()
      const manager = createMultiTrayManager(createTray, '/sprites', {
        style: 'cat',
        display: 'single',
        sessionColors: false,
      })
      manager.update([
        { pid: 1, level: 'slow' },
        { pid: 2, level: 'fast' },
      ])
      manager.setDisplay('multi')
      expect(manager.getTrayCount()).toBe(2)
      expect(animators[0].setLevel).toHaveBeenLastCalledWith('slow')
      expect(animators[1].setLevel).toHaveBeenLastCalledWith('fast')
    })
  })

  describe('session colors', () => {
    it('passes no tint when session colors are off', () => {
      const { createTray } = makeTrayFactory()
      const manager = createMultiTrayManager(createTray, '/sprites', {
        style: 'cat',
        display: 'multi',
        sessionColors: false,
      })
      manager.update([{ pid: 1, level: 'fast' }])
      expect(createTrayAnimator).toHaveBeenLastCalledWith(
        expect.anything(),
        '/sprites',
        'cat',
        null
      )
    })

    it('gives each slot the next palette color when session colors are on', () => {
      const { createTray } = makeTrayFactory()
      const manager = createMultiTrayManager(createTray, '/sprites', {
        style: 'cat',
        display: 'multi',
        sessionColors: true,
      })
      manager.update([
        { pid: 1, level: 'fast' },
        { pid: 2, level: 'slow' },
      ])
      const tints = vi.mocked(createTrayAnimator).mock.calls.map((c) => c[3])
      expect(tints).toEqual([SESSION_PALETTE[0], SESSION_PALETTE[1]])
    })

    it('wraps around the palette for more slots than colors', () => {
      const { createTray } = makeTrayFactory()
      const manager = createMultiTrayManager(createTray, '/sprites', {
        style: 'cat',
        display: 'multi',
        sessionColors: true,
      })
      manager.update(
        Array.from({ length: SESSION_PALETTE.length + 1 }, (_, i) => ({
          pid: i,
          level: 'idle' as const,
        }))
      )
      const tints = vi.mocked(createTrayAnimator).mock.calls.map((c) => c[3])
      expect(tints[SESSION_PALETTE.length]).toBe(SESSION_PALETTE[0])
    })

    it('rebuilds animators with tints when toggled on, keeping levels', () => {
      const { createTray } = makeTrayFactory()
      const manager = createMultiTrayManager(createTray, '/sprites', {
        style: 'cat',
        display: 'multi',
        sessionColors: false,
      })
      manager.update([
        { pid: 1, level: 'fast' },
        { pid: 2, level: 'slow' },
      ])
      manager.setSessionColors(true)
      expect(animators[0].destroy).toHaveBeenCalled()
      expect(animators[1].destroy).toHaveBeenCalled()
      const tints = vi
        .mocked(createTrayAnimator)
        .mock.calls.slice(-2)
        .map((c) => c[3])
      expect(tints).toEqual([SESSION_PALETTE[0], SESSION_PALETTE[1]])
      expect(animators[2].setLevel).toHaveBeenLastCalledWith('fast')
      expect(animators[3].setLevel).toHaveBeenLastCalledWith('slow')
    })
  })

  it('destroys all trays and animators on destroy', () => {
    const { createTray, trays } = makeTrayFactory()
    const manager = createMultiTrayManager(createTray, '/sprites', {
      style: 'cat',
      display: 'multi',
      sessionColors: false,
    })
    manager.update([
      { pid: 1, level: 'fast' },
      { pid: 2, level: 'mid' },
    ])
    manager.destroy()
    expect(manager.getTrayCount()).toBe(0)
    expect(trays.every((t) => t.destroy.mock.calls.length === 1)).toBe(true)
  })
})
