import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

import type {
  AIShortcut,
  CatStyle,
  MultiSessionDisplay,
  PopupState,
  SpeedThresholds,
} from '@shared/types'

const onboardingAPI = {
  apply: (): Promise<string> => ipcRenderer.invoke('onboarding:apply'),
  close: (): Promise<void> => ipcRenderer.invoke('onboarding:close'),
  skip: (): Promise<void> => ipcRenderer.invoke('onboarding:skip'),
}

const aiShortcutAPI = {
  list: (): Promise<AIShortcut[]> => ipcRenderer.invoke('ai-shortcut:list'),
  save: (shortcut: AIShortcut): Promise<void> => ipcRenderer.invoke('ai-shortcut:save', shortcut),
  delete: (id: string): Promise<void> => ipcRenderer.invoke('ai-shortcut:delete', id),
  closeWindow: (): Promise<void> => ipcRenderer.invoke('settings:close'),
}

const thresholdsAPI = {
  get: (): Promise<SpeedThresholds> => ipcRenderer.invoke('thresholds:get'),
  set: (thresholds: SpeedThresholds): Promise<void> =>
    ipcRenderer.invoke('thresholds:set', thresholds),
}

const popupAPI = {
  getState: (): Promise<PopupState> => ipcRenderer.invoke('popup:get-sessions'),
  quit: (): Promise<void> => ipcRenderer.invoke('popup:quit'),
}

const catStyleAPI = {
  get: (): Promise<CatStyle> => ipcRenderer.invoke('cat-style:get'),
  set: (style: CatStyle): Promise<void> => ipcRenderer.invoke('cat-style:set', style),
}

const multiSessionDisplayAPI = {
  get: (): Promise<MultiSessionDisplay> => ipcRenderer.invoke('multi-session-display:get'),
  set: (display: MultiSessionDisplay): Promise<void> =>
    ipcRenderer.invoke('multi-session-display:set', display),
}

const sessionColorsAPI = {
  get: (): Promise<boolean> => ipcRenderer.invoke('session-colors:get'),
  set: (enabled: boolean): Promise<void> => ipcRenderer.invoke('session-colors:set', enabled),
}

const agentHudAPI = {
  get: (): Promise<boolean> => ipcRenderer.invoke('agent-hud:get'),
  set: (enabled: boolean): Promise<void> => ipcRenderer.invoke('agent-hud:set', enabled),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('onboarding', onboardingAPI)
    contextBridge.exposeInMainWorld('aiShortcut', aiShortcutAPI)
    contextBridge.exposeInMainWorld('thresholds', thresholdsAPI)
    contextBridge.exposeInMainWorld('popup', popupAPI)
    contextBridge.exposeInMainWorld('catStyle', catStyleAPI)
    contextBridge.exposeInMainWorld('multiSessionDisplay', multiSessionDisplayAPI)
    contextBridge.exposeInMainWorld('sessionColors', sessionColorsAPI)
    contextBridge.exposeInMainWorld('agentHud', agentHudAPI)
  } catch (error) {
    console.error(error) // eslint-disable-line no-console
  }
} else {
  // @ts-expect-error non-isolated fallback
  window.electron = electronAPI
  // @ts-expect-error non-isolated fallback
  window.onboarding = onboardingAPI
  // @ts-expect-error non-isolated fallback
  window.aiShortcut = aiShortcutAPI
  // @ts-expect-error non-isolated fallback
  window.thresholds = thresholdsAPI
  // @ts-expect-error non-isolated fallback
  window.popup = popupAPI
  // @ts-expect-error non-isolated fallback
  window.catStyle = catStyleAPI
  // @ts-expect-error non-isolated fallback
  window.multiSessionDisplay = multiSessionDisplayAPI
  // @ts-expect-error non-isolated fallback
  window.sessionColors = sessionColorsAPI
  // @ts-expect-error non-isolated fallback
  window.agentHud = agentHudAPI
}
