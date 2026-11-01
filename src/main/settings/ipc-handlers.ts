import { ipcMain } from 'electron'

import { store } from '@main/store'
import { rebuildTrayMenu } from '@main/tray-menu'
import type { AIShortcut, CatStyle, MultiSessionDisplay, SpeedThresholds } from '@shared/types'

import { closeSettingsWindow } from './window'

export interface SettingsChangeCallbacks {
  onCatStyleChange: (style: CatStyle) => void
  onMultiSessionDisplayChange: (display: MultiSessionDisplay) => void
  onSessionColorsChange: (enabled: boolean) => void
}

export function registerSettingsIpcHandlers(callbacks: SettingsChangeCallbacks): void {
  ipcMain.handle('ai-shortcut:list', () => store.get('aiShortcuts'))

  ipcMain.handle('ai-shortcut:save', (_, shortcut: AIShortcut) => {
    const shortcuts = store.get('aiShortcuts')
    const idx = shortcuts.findIndex((s) => s.id === shortcut.id)
    if (idx >= 0) {
      shortcuts[idx] = shortcut
    } else {
      shortcuts.push(shortcut)
    }
    store.set('aiShortcuts', shortcuts)
    rebuildTrayMenu()
  })

  ipcMain.handle('ai-shortcut:delete', (_, id: string) => {
    store.set(
      'aiShortcuts',
      store.get('aiShortcuts').filter((s) => s.id !== id)
    )
    rebuildTrayMenu()
  })

  ipcMain.handle('settings:close', () => {
    closeSettingsWindow()
  })

  ipcMain.handle('thresholds:get', () => store.get('thresholds'))

  ipcMain.handle('thresholds:set', (_, thresholds: SpeedThresholds) => {
    store.set('thresholds', thresholds)
  })

  ipcMain.handle('cat-style:get', () => store.get('catStyle'))

  ipcMain.handle('cat-style:set', (_, style: CatStyle) => {
    store.set('catStyle', style)
    callbacks.onCatStyleChange(style)
  })

  ipcMain.handle('multi-session-display:get', () => store.get('multiSessionDisplay'))

  ipcMain.handle('multi-session-display:set', (_, display: MultiSessionDisplay) => {
    store.set('multiSessionDisplay', display)
    callbacks.onMultiSessionDisplayChange(display)
  })

  ipcMain.handle('session-colors:get', () => store.get('sessionColors'))

  ipcMain.handle('session-colors:set', (_, enabled: boolean) => {
    store.set('sessionColors', enabled)
    callbacks.onSessionColorsChange(enabled)
  })
}
