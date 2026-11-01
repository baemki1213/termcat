import type { Tray } from 'electron'

import { createTrayAnimator, type TrayAnimator } from '@main/tray-animator'
import type { CatStyle, MultiSessionDisplay, SessionLevel, SpeedLevel } from '@shared/types'

/** 세션이 하나도 없을 때도 메뉴/팝업 진입점으로 항상 남겨두는 고양이 수 */
const MIN_TRAY_COUNT = 1

/** sessionColors 가 켜지면 슬롯 i 는 이 팔레트의 i 번째 색을 받는다 (다크/라이트 메뉴바 모두에서 보이는 채도). */
export const SESSION_PALETTE = ['#FF8C42', '#3FA7FF', '#3DD37A', '#FF5DA2'] as const

const LEVEL_RANK: Record<SpeedLevel, number> = { idle: 0, slow: 1, mid: 2, fast: 3 }

function maxLevel(levels: SpeedLevel[]): SpeedLevel {
  return levels.reduce<SpeedLevel>((max, l) => (LEVEL_RANK[l] > LEVEL_RANK[max] ? l : max), 'idle')
}

/** 'single' 모드: 모든 세션을 가장 빠른 속도의 고양이 한 마리로 합친다. */
function collapseToSingle(sessions: SessionLevel[]): SessionLevel[] {
  if (sessions.length === 0) return []
  return [{ pid: sessions[0].pid, level: maxLevel(sessions.map((s) => s.level)) }]
}

interface TraySlot {
  tray: Tray
  animator: TrayAnimator
  level: SpeedLevel
}

export type MultiTrayManager = ReturnType<typeof createMultiTrayManager>

interface MultiTrayOptions {
  style: CatStyle
  display: MultiSessionDisplay
  sessionColors: boolean
}

/**
 * 세션 수만큼 Tray(고양이)를 유지하고, 각 Tray가 해당 세션의 속도로 회전하도록 한다.
 * 슬롯 i 는 i 번째로 시작된 세션에 대응하며, 세션이 없으면 idle 고양이 한 마리만 남긴다.
 * display 가 'single' 이면 세션 수와 무관하게 가장 빠른 속도의 고양이 한 마리만 보여준다.
 */
export function createMultiTrayManager(
  createTray: () => Tray,
  spritesDir: string,
  options: MultiTrayOptions
) {
  let style = options.style
  let display = options.display
  let sessionColors = options.sessionColors
  let lastSessions: SessionLevel[] = []
  // Tray 는 GC 되지 않도록 매니저 수명 동안 이 배열에서 레퍼런스를 유지한다.
  const slots: TraySlot[] = []

  function tintForSlot(index: number): string | null {
    return sessionColors ? SESSION_PALETTE[index % SESSION_PALETTE.length] : null
  }

  function addSlot(): void {
    const tray = createTray()
    const animator = createTrayAnimator(tray, spritesDir, style, tintForSlot(slots.length))
    animator.setLevel('idle')
    slots.push({ tray, animator, level: 'idle' })
  }

  /** 스타일/색 설정이 바뀌면 모든 슬롯의 애니메이터를 현재 속도를 유지한 채 다시 만든다. */
  function rebuildAnimators(): void {
    slots.forEach((slot, i) => {
      slot.animator.destroy()
      slot.animator = createTrayAnimator(slot.tray, spritesDir, style, tintForSlot(i))
      slot.animator.setLevel(slot.level)
    })
  }

  function removeLastSlot(): void {
    const slot = slots.pop()
    if (!slot) return
    slot.animator.destroy()
    slot.tray.destroy()
  }

  function resizeTo(count: number): void {
    while (slots.length < count) addSlot()
    while (slots.length > count) removeLastSlot()
  }

  function applyLevel(slot: TraySlot, level: SpeedLevel): void {
    if (slot.level === level) return
    slot.level = level
    slot.animator.setLevel(level)
  }

  /** 세션 목록(시작 순)에 맞춰 고양이 수와 각 고양이의 회전 속도를 갱신한다. */
  function update(sessions: SessionLevel[]): void {
    lastSessions = sessions
    const visible = display === 'single' ? collapseToSingle(sessions) : sessions
    resizeTo(Math.max(MIN_TRAY_COUNT, visible.length))
    slots.forEach((slot, i) => applyLevel(slot, visible[i]?.level ?? 'idle'))
  }

  return {
    update,
    setDisplay(nextDisplay: MultiSessionDisplay): void {
      display = nextDisplay
      update(lastSessions)
    },
    setStyle(nextStyle: CatStyle): void {
      style = nextStyle
      rebuildAnimators()
    },
    setSessionColors(enabled: boolean): void {
      sessionColors = enabled
      rebuildAnimators()
    },
    getTrayCount(): number {
      return slots.length
    },
    destroy(): void {
      while (slots.length > 0) removeLastSlot()
    },
  }
}
