import ElectronStore from 'electron-store'

import {
  type AIShortcut,
  type CatStyle,
  DEFAULT_SPEED_THRESHOLDS,
  type MultiSessionDisplay,
  type SpeedThresholds,
} from '@shared/types'

interface StoreSchema {
  onboardingDone: boolean
  aiShortcuts: AIShortcut[]
  thresholds: SpeedThresholds
  catStyle: CatStyle
  multiSessionDisplay: MultiSessionDisplay
  /** 세션(슬롯)마다 다른 색으로 고양이를 칠할지 */
  sessionColors: boolean
}

// 신규 설치 시 바로 쓸 수 있도록 기본 단축키를 시딩한다 (command 는 raw — 런처가 termcat 으로 래핑).
const DEFAULT_AI_SHORTCUTS: AIShortcut[] = [
  { id: 'claude', name: 'Claude', command: 'claude' },
  { id: 'chatgpt', name: 'ChatGPT', command: 'chatgpt' },
  { id: 'gemini', name: 'Gemini', command: 'gemini' },
]

export const store = new ElectronStore<StoreSchema>({
  defaults: {
    onboardingDone: false,
    aiShortcuts: DEFAULT_AI_SHORTCUTS,
    thresholds: DEFAULT_SPEED_THRESHOLDS,
    catStyle: 'cat',
    multiSessionDisplay: 'multi',
    sessionColors: false,
  },
})
