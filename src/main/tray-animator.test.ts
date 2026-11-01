import type { Tray } from 'electron'
import { nativeImage } from 'electron'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  nativeImage: {
    createFromPath: vi.fn(() => ({
      setTemplateImage: vi.fn(),
    })),
  },
}))
vi.mock('@main/sprite-tint', () => ({
  tintImage: vi.fn(() => ({ tinted: true })),
}))

import { tintImage } from '@main/sprite-tint'
import { createTrayAnimator } from '@main/tray-animator'

function makeTray(): { tray: Tray; setImage: ReturnType<typeof vi.fn> } {
  const setImage = vi.fn()
  return { tray: { setImage } as unknown as Tray, setImage }
}

describe('createTrayAnimator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(nativeImage.createFromPath).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('frame loading', () => {
    it('loads 8 frames for cat style', () => {
      const { tray } = makeTray()
      createTrayAnimator(tray, '/sprites', 'cat')
      expect(nativeImage.createFromPath).toHaveBeenCalledTimes(8)
    })

    it('loads 67 frames for cat2 style', () => {
      const { tray } = makeTray()
      createTrayAnimator(tray, '/sprites', 'cat2')
      expect(nativeImage.createFromPath).toHaveBeenCalledTimes(67)
    })

    it('loads 8 frames for runner style', () => {
      const { tray } = makeTray()
      createTrayAnimator(tray, '/sprites', 'runner')
      expect(nativeImage.createFromPath).toHaveBeenCalledTimes(8)
    })

    it('defaults to cat style when style argument omitted', () => {
      const { tray } = makeTray()
      createTrayAnimator(tray, '/sprites')
      expect(nativeImage.createFromPath).toHaveBeenCalledTimes(8)
    })

    it('marks cat-style frames as template images', () => {
      const { tray } = makeTray()
      createTrayAnimator(tray, '/sprites', 'cat')
      const firstFrame = vi.mocked(nativeImage.createFromPath).mock.results[0].value
      expect(firstFrame.setTemplateImage).toHaveBeenCalledWith(true)
    })

    it('does not mark cat2-style frames as template images', () => {
      const { tray } = makeTray()
      createTrayAnimator(tray, '/sprites', 'cat2')
      const firstFrame = vi.mocked(nativeImage.createFromPath).mock.results[0].value
      expect(firstFrame.setTemplateImage).not.toHaveBeenCalled()
    })
  })

  describe('tint', () => {
    beforeEach(() => {
      vi.mocked(tintImage).mockClear()
    })

    it('does not tint when tint is omitted', () => {
      const { tray } = makeTray()
      createTrayAnimator(tray, '/sprites', 'cat')
      expect(tintImage).not.toHaveBeenCalled()
    })

    it('fills silhouette styles with the color and skips template marking', () => {
      const { tray } = makeTray()
      createTrayAnimator(tray, '/sprites', 'cat', '#FF8C42')
      expect(tintImage).toHaveBeenCalledTimes(8)
      expect(tintImage).toHaveBeenCalledWith(expect.anything(), '#FF8C42', 'fill')
      const firstFrame = vi.mocked(nativeImage.createFromPath).mock.results[0].value
      expect(firstFrame.setTemplateImage).not.toHaveBeenCalled()
    })

    it('applies duotone to photo styles', () => {
      const { tray } = makeTray()
      createTrayAnimator(tray, '/sprites', 'cat2', '#3FA7FF')
      expect(tintImage).toHaveBeenCalledWith(expect.anything(), '#3FA7FF', 'duotone')
    })

    it('paints tinted frames on the tray', () => {
      const { tray, setImage } = makeTray()
      const animator = createTrayAnimator(tray, '/sprites', 'cat', '#FF8C42')
      animator.setLevel('idle')
      expect(setImage).toHaveBeenCalledWith({ tinted: true })
    })
  })

  describe('idle level', () => {
    it('shows an idle frame immediately for cat style', () => {
      const { tray, setImage } = makeTray()
      const animator = createTrayAnimator(tray, '/sprites', 'cat')
      animator.setLevel('idle')
      expect(setImage).toHaveBeenCalledTimes(1)
    })

    it('cycles between idle frames every 800ms for cat style (2 idle frames)', () => {
      const { tray, setImage } = makeTray()
      const animator = createTrayAnimator(tray, '/sprites', 'cat')
      animator.setLevel('idle')
      setImage.mockClear()
      vi.advanceTimersByTime(799)
      expect(setImage).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(setImage).toHaveBeenCalledTimes(1)
      vi.advanceTimersByTime(800)
      expect(setImage).toHaveBeenCalledTimes(2)
    })

    it('does not start a timer for cat2 idle (single idle frame)', () => {
      const { tray, setImage } = makeTray()
      const animator = createTrayAnimator(tray, '/sprites', 'cat2')
      animator.setLevel('idle')
      setImage.mockClear()
      vi.advanceTimersByTime(10_000)
      expect(setImage).not.toHaveBeenCalled()
    })
  })

  describe('active levels', () => {
    it.each([
      ['slow', 500],
      ['mid', 200],
      ['fast', 70],
    ])('schedules next frame at FRAME_INTERVALS[%s] = %dms', (level, interval) => {
      const { tray, setImage } = makeTray()
      const animator = createTrayAnimator(tray, '/sprites', 'cat')
      animator.setLevel(level as 'slow' | 'mid' | 'fast')
      setImage.mockClear()
      vi.advanceTimersByTime(interval - 1)
      expect(setImage).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(setImage).toHaveBeenCalledTimes(1)
    })

    it('paints the first intro frame immediately on activation', () => {
      const { tray, setImage } = makeTray()
      const animator = createTrayAnimator(tray, '/sprites', 'cat')
      animator.setLevel('slow')
      expect(setImage).toHaveBeenCalledTimes(1)
    })

    it('plays intro frames then transitions into loop (cat2, 67 intro + 14 loop)', () => {
      const { tray, setImage } = makeTray()
      const animator = createTrayAnimator(tray, '/sprites', 'cat2')
      animator.setLevel('mid')
      setImage.mockClear()
      // 67 intro frames advance via 67 ticks; then loop continues indefinitely.
      vi.advanceTimersByTime(200 * 100)
      expect(setImage).toHaveBeenCalledTimes(100)
    })
  })

  describe('level transitions', () => {
    it('clears the previous timer when switching from active to idle (cat2)', () => {
      const { tray, setImage } = makeTray()
      const animator = createTrayAnimator(tray, '/sprites', 'cat2')
      animator.setLevel('fast')
      vi.advanceTimersByTime(35) // halfway into a fast tick
      animator.setLevel('idle') // cat2 idle has no timer
      setImage.mockClear()
      vi.advanceTimersByTime(5_000)
      expect(setImage).not.toHaveBeenCalled()
    })

    it('restarts intro from frame 0 when switching between active levels', () => {
      const { tray, setImage } = makeTray()
      const animator = createTrayAnimator(tray, '/sprites', 'cat2')
      animator.setLevel('slow')
      vi.advanceTimersByTime(500 * 5) // partway through intro
      setImage.mockClear()
      animator.setLevel('fast')
      // First call after switch must be intro[0] (frame index 0)
      expect(setImage).toHaveBeenCalledTimes(1)
      const firstFrameAfterSwitch = vi.mocked(nativeImage.createFromPath).mock.results[0].value
      expect(setImage).toHaveBeenCalledWith(firstFrameAfterSwitch)
    })

    it('replaces the idle timer when switching from idle to active', () => {
      const { tray, setImage } = makeTray()
      const animator = createTrayAnimator(tray, '/sprites', 'cat')
      animator.setLevel('idle')
      vi.advanceTimersByTime(400)
      animator.setLevel('fast')
      setImage.mockClear()
      // After switch, fast ticks at 70ms; idle would have fired at 800ms.
      vi.advanceTimersByTime(70)
      expect(setImage).toHaveBeenCalledTimes(1)
      // Past where idle timer would have fired, count should still match fast cadence only.
      vi.advanceTimersByTime(70 * 3)
      expect(setImage).toHaveBeenCalledTimes(4)
    })
  })

  describe('destroy', () => {
    it('stops the active timer', () => {
      const { tray, setImage } = makeTray()
      const animator = createTrayAnimator(tray, '/sprites', 'cat')
      animator.setLevel('slow')
      setImage.mockClear()
      animator.destroy()
      vi.advanceTimersByTime(5_000)
      expect(setImage).not.toHaveBeenCalled()
    })

    it('is a no-op when no timer is running', () => {
      const { tray } = makeTray()
      const animator = createTrayAnimator(tray, '/sprites', 'cat')
      expect(() => animator.destroy()).not.toThrow()
    })

    it('is idempotent — destroy twice does not throw', () => {
      const { tray } = makeTray()
      const animator = createTrayAnimator(tray, '/sprites', 'cat')
      animator.setLevel('slow')
      animator.destroy()
      expect(() => animator.destroy()).not.toThrow()
    })
  })
})
