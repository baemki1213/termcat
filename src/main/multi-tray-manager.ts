import type { Tray } from 'electron'

import { createTrayAnimator, type TrayAnimator } from '@main/tray-animator'
import type { HudEntry } from '@shared/types'

interface TraySlot {
  tray: Tray
  animator: TrayAnimator
  entry: HudEntry
}

function sameLook(a: HudEntry, b: HudEntry): boolean {
  return a.style === b.style && a.tint === b.tint
}

export type MultiTrayManager = ReturnType<typeof createMultiTrayManager>

/**
 * HudEntry 목록을 메뉴바 Tray(고양이)들로 그린다. 슬롯 i 는 i 번째 entry 를 맡으며,
 * 외모(style/tint)가 바뀐 슬롯만 애니메이터를 다시 만들고, 속도가 바뀐 슬롯만 setLevel 을 호출한다.
 * 목록은 호출자가 비지 않게 보장한다(HudComposer 가 항상 idle 한 마리는 돌려준다).
 */
export function createMultiTrayManager(createTray: () => Tray, spritesDir: string) {
  // Tray 는 GC 되지 않도록 매니저 수명 동안 이 배열에서 레퍼런스를 유지한다.
  const slots: TraySlot[] = []

  function addSlot(entry: HudEntry): void {
    const tray = createTray()
    const animator = createTrayAnimator(tray, spritesDir, entry.style, entry.tint)
    animator.setLevel(entry.level)
    tray.setTitle(entry.title)
    tray.setToolTip(entry.tooltip)
    slots.push({ tray, animator, entry })
  }

  function removeLastSlot(): void {
    const slot = slots.pop()
    if (!slot) return
    slot.animator.destroy()
    slot.tray.destroy()
  }

  function applyEntry(slot: TraySlot, entry: HudEntry): void {
    const prev = slot.entry
    if (!sameLook(prev, entry)) {
      slot.animator.destroy()
      slot.animator = createTrayAnimator(slot.tray, spritesDir, entry.style, entry.tint)
      slot.animator.setLevel(entry.level)
    } else if (prev.level !== entry.level) {
      slot.animator.setLevel(entry.level)
    }
    if (prev.title !== entry.title) slot.tray.setTitle(entry.title)
    if (prev.tooltip !== entry.tooltip) slot.tray.setToolTip(entry.tooltip)
    slot.entry = entry
  }

  return {
    update(entries: HudEntry[]): void {
      entries.forEach((entry, i) => {
        if (i < slots.length) applyEntry(slots[i], entry)
        else addSlot(entry)
      })
      while (slots.length > entries.length) removeLastSlot()
    },
    getTrayCount(): number {
      return slots.length
    },
    destroy(): void {
      while (slots.length > 0) removeLastSlot()
    },
  }
}
