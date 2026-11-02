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

import { createMultiTrayManager } from '@main/multi-tray-manager'
import { createTrayAnimator } from '@main/tray-animator'
import type { HudEntry } from '@shared/types'

interface FakeTray {
  destroy: ReturnType<typeof vi.fn>
  setTitle: ReturnType<typeof vi.fn>
  setToolTip: ReturnType<typeof vi.fn>
}

function makeTrayFactory(): { createTray: () => Tray; trays: FakeTray[] } {
  const trays: FakeTray[] = []
  const createTray = vi.fn(() => {
    const tray: FakeTray = { destroy: vi.fn(), setTitle: vi.fn(), setToolTip: vi.fn() }
    trays.push(tray)
    return tray as unknown as Tray
  })
  return { createTray, trays }
}

function entry(overrides: Partial<HudEntry>): HudEntry {
  return {
    key: 'k',
    level: 'idle',
    style: 'cat',
    tint: null,
    title: '',
    tooltip: 'termcat',
    ...overrides,
  }
}

describe('createMultiTrayManager', () => {
  beforeEach(() => {
    animators.length = 0
    vi.mocked(createTrayAnimator).mockClear()
  })

  it('creates one tray per entry with its level, title and tooltip', () => {
    const { createTray, trays } = makeTrayFactory()
    const manager = createMultiTrayManager(createTray, '/sprites')
    manager.update([
      entry({ key: 'a', level: 'slow' }),
      entry({ key: 'b', level: 'fast', title: 'Explore', tooltip: 'Explore · Explore' }),
    ])
    expect(manager.getTrayCount()).toBe(2)
    expect(animators[0].setLevel).toHaveBeenLastCalledWith('slow')
    expect(animators[1].setLevel).toHaveBeenLastCalledWith('fast')
    expect(trays[1].setTitle).toHaveBeenCalledWith('Explore')
    expect(trays[1].setToolTip).toHaveBeenCalledWith('Explore · Explore')
  })

  it('passes style and tint to the animator', () => {
    const { createTray } = makeTrayFactory()
    const manager = createMultiTrayManager(createTray, '/sprites')
    manager.update([entry({ style: 'runner', tint: '#FF8C42' })])
    expect(createTrayAnimator).toHaveBeenCalledWith(
      expect.anything(),
      '/sprites',
      'runner',
      '#FF8C42'
    )
  })

  it('does not restart the animation when the level is unchanged', () => {
    const { createTray } = makeTrayFactory()
    const manager = createMultiTrayManager(createTray, '/sprites')
    manager.update([entry({ level: 'fast' })])
    manager.update([entry({ level: 'fast' })])
    expect(animators[0].setLevel).toHaveBeenCalledTimes(1)
  })

  it('changes only the level when the look is the same', () => {
    const { createTray } = makeTrayFactory()
    const manager = createMultiTrayManager(createTray, '/sprites')
    manager.update([entry({ level: 'slow' })])
    manager.update([entry({ level: 'fast' })])
    expect(animators).toHaveLength(1)
    expect(animators[0].setLevel).toHaveBeenLastCalledWith('fast')
  })

  it('rebuilds the animator when the look changes, keeping the tray', () => {
    const { createTray, trays } = makeTrayFactory()
    const manager = createMultiTrayManager(createTray, '/sprites')
    manager.update([entry({ level: 'mid', style: 'cat' })])
    manager.update([entry({ level: 'mid', style: 'cat2', tint: '#000000' })])
    expect(animators[0].destroy).toHaveBeenCalled()
    expect(animators[1].setLevel).toHaveBeenLastCalledWith('mid')
    expect(createTrayAnimator).toHaveBeenLastCalledWith(trays[0], '/sprites', 'cat2', '#000000')
    expect(trays).toHaveLength(1)
  })

  it('updates the title only when it changes', () => {
    const { createTray, trays } = makeTrayFactory()
    const manager = createMultiTrayManager(createTray, '/sprites')
    manager.update([entry({ title: 'a' })])
    manager.update([entry({ title: 'a' })])
    manager.update([entry({ title: 'b' })])
    expect(trays[0].setTitle.mock.calls.map((c) => c[0])).toEqual(['a', 'b'])
  })

  it('removes trailing trays when entries shrink', () => {
    const { createTray, trays } = makeTrayFactory()
    const manager = createMultiTrayManager(createTray, '/sprites')
    manager.update([entry({ key: 'a' }), entry({ key: 'b' }), entry({ key: 'c' })])
    manager.update([entry({ key: 'a' })])
    expect(manager.getTrayCount()).toBe(1)
    expect(trays[1].destroy).toHaveBeenCalled()
    expect(trays[2].destroy).toHaveBeenCalled()
    expect(animators[2].destroy).toHaveBeenCalled()
  })

  it('destroys everything on destroy', () => {
    const { createTray, trays } = makeTrayFactory()
    const manager = createMultiTrayManager(createTray, '/sprites')
    manager.update([entry({ key: 'a' }), entry({ key: 'b' })])
    manager.destroy()
    expect(manager.getTrayCount()).toBe(0)
    expect(trays.every((t) => t.destroy.mock.calls.length === 1)).toBe(true)
  })
})
