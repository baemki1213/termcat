import { create } from 'zustand'

import { createLogger } from '@renderer/logger'
import {
  type AIShortcut,
  type CatStyle,
  DEFAULT_SPEED_THRESHOLDS,
  type MultiSessionDisplay,
  type SpeedThresholds,
} from '@shared/types'

const log = createLogger('settings-store')

const THRESHOLDS_SAVE_DEBOUNCE_MS = 300

interface SettingsState {
  shortcuts: AIShortcut[]
  catStyle: CatStyle
  multiSessionDisplay: MultiSessionDisplay
  sessionColors: boolean
  agentHud: boolean
  thresholds: SpeedThresholds
  loaded: boolean

  /** Settings 창 마운트 시 한 번 호출 — 모든 설정을 병렬 로드한다. */
  load: () => Promise<void>
  setCatStyle: (style: CatStyle) => Promise<void>
  setMultiSessionDisplay: (display: MultiSessionDisplay) => Promise<void>
  setSessionColors: (enabled: boolean) => Promise<void>
  setAgentHud: (enabled: boolean) => Promise<void>
  /** 상태는 즉시 반영하고 IPC 저장만 debounce 한다 (슬라이더 연속 조작 대비). */
  setThresholds: (next: SpeedThresholds) => void
  saveShortcut: (shortcut: AIShortcut) => Promise<void>
  deleteShortcut: (id: string) => Promise<void>
}

let thresholdsSaveTimer: ReturnType<typeof setTimeout> | null = null

export const useSettingsStore = create<SettingsState>((set) => ({
  shortcuts: [],
  catStyle: 'cat',
  multiSessionDisplay: 'multi',
  sessionColors: false,
  agentHud: true,
  thresholds: DEFAULT_SPEED_THRESHOLDS,
  loaded: false,

  load: async () => {
    try {
      const [shortcuts, catStyle, multiSessionDisplay, sessionColors, agentHud, thresholds] =
        await Promise.all([
          window.aiShortcut.list(),
          window.catStyle.get(),
          window.multiSessionDisplay.get(),
          window.sessionColors.get(),
          window.agentHud.get(),
          window.thresholds.get(),
        ])
      set({
        shortcuts,
        catStyle,
        multiSessionDisplay,
        sessionColors,
        agentHud,
        thresholds,
        loaded: true,
      })
    } catch (err) {
      log.error('failed to load settings', err)
    }
  },

  setCatStyle: async (style) => {
    set({ catStyle: style })
    try {
      await window.catStyle.set(style)
    } catch (err) {
      log.error('failed to save cat style', err)
    }
  },

  setMultiSessionDisplay: async (display) => {
    set({ multiSessionDisplay: display })
    try {
      await window.multiSessionDisplay.set(display)
    } catch (err) {
      log.error('failed to save multi-session display', err)
    }
  },

  setSessionColors: async (enabled) => {
    set({ sessionColors: enabled })
    try {
      await window.sessionColors.set(enabled)
    } catch (err) {
      log.error('failed to save session colors', err)
    }
  },

  setAgentHud: async (enabled) => {
    set({ agentHud: enabled })
    try {
      await window.agentHud.set(enabled)
    } catch (err) {
      log.error('failed to save agent hud', err)
    }
  },

  setThresholds: (next) => {
    set({ thresholds: next })
    if (thresholdsSaveTimer !== null) clearTimeout(thresholdsSaveTimer)
    thresholdsSaveTimer = setTimeout(() => {
      window.thresholds.set(next).catch((err) => log.error('failed to save thresholds', err))
    }, THRESHOLDS_SAVE_DEBOUNCE_MS)
  },

  saveShortcut: async (shortcut) => {
    await window.aiShortcut.save(shortcut)
    set({ shortcuts: await window.aiShortcut.list() })
  },

  deleteShortcut: async (id) => {
    await window.aiShortcut.delete(id)
    set((state) => ({ shortcuts: state.shortcuts.filter((s) => s.id !== id) }))
  },
}))
