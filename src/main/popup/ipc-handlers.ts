import { app, ipcMain } from 'electron'

import type { StatusReport } from '@shared/types'

export function registerPopupIpcHandlers(getStatus: () => StatusReport): void {
  ipcMain.handle('popup:get-sessions', () => ({
    ...getStatus(),
    openAtLogin: app.getLoginItemSettings().openAtLogin,
  }))

  ipcMain.handle('popup:quit', () => app.quit())
}
