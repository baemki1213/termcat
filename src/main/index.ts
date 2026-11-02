import { electronApp, optimizer } from '@electron-toolkit/utils'
import { app, nativeImage, Tray } from 'electron'
import { join } from 'path'

import { createAgentRegistry } from '@main/agent-registry'
import { isAgentEvent } from '@main/cli-event-parser'
import { createHudComposer } from '@main/hud-composer'
import { createIpcServer } from '@main/ipc-server'
import { createMultiTrayManager } from '@main/multi-tray-manager'
import { hasAlias, openOnboardingWindow } from '@main/onboarding'
import { registerPopupIpcHandlers } from '@main/popup/ipc-handlers'
import { togglePopup } from '@main/popup/window'
import { createSessionManager } from '@main/session-manager'
import { registerSettingsIpcHandlers } from '@main/settings'
import { store } from '@main/store'
import { getContextMenu } from '@main/tray-menu'
import type { CatStyle, CliEvent, MultiSessionDisplay, StatusReport } from '@shared/types'

const TICK_MS = 100

function getSpritesDir(): string {
  return join(__dirname, '../../resources/sprites')
}

function createTray(): Tray {
  const iconPath = join(getSpritesDir(), 'cat-f01.png')
  const icon = nativeImage.createFromPath(iconPath)
  icon.setTemplateImage(true)

  const tray = new Tray(icon)
  tray.setToolTip('termcat')

  tray.on('click', (_, bounds) => togglePopup(bounds))
  tray.on('right-click', () => tray.popUpContextMenu(getContextMenu()))

  return tray
}

interface Core {
  stop: () => void
  setStyle: (style: CatStyle) => void
  setDisplay: (display: MultiSessionDisplay) => void
  setSessionColors: (enabled: boolean) => void
  setAgentHud: (enabled: boolean) => void
}

function startCore(): Core {
  const sessionManager = createSessionManager(() => store.get('thresholds'))
  const agentRegistry = createAgentRegistry()
  const hud = createHudComposer({
    style: store.get('catStyle'),
    display: store.get('multiSessionDisplay'),
    sessionColors: store.get('sessionColors'),
    agentHud: store.get('agentHud'),
  })
  const trayManager = createMultiTrayManager(createTray, getSpritesDir())
  let lastAgents = agentRegistry.tick()

  function getStatus(): StatusReport {
    return { sessions: sessionManager.getSnapshots(), agents: lastAgents }
  }

  function onEvent(event: CliEvent): void {
    if (event.type === 'session:start') {
      sessionManager.onStart(event.pid, event.command)
    } else if (event.type === 'session:data') {
      sessionManager.onData(event.pid, event.chars, event.timestamp)
    } else if (event.type === 'session:stats') {
      sessionManager.onStats(event.pid, event.tokens)
    } else if (event.type === 'session:exit') {
      sessionManager.onExit(event.pid)
    } else if (isAgentEvent(event)) {
      agentRegistry.handle(event)
    }
  }

  trayManager.update(hud.compose([], lastAgents))
  const ipcServer = createIpcServer({ onEvent, getStatus })
  registerPopupIpcHandlers(getStatus)
  ipcServer.start()

  const tickerId = setInterval(() => {
    lastAgents = agentRegistry.tick()
    trayManager.update(hud.compose(sessionManager.tick(), lastAgents))
  }, TICK_MS)

  return {
    stop: () => {
      clearInterval(tickerId)
      ipcServer.stop()
      trayManager.destroy()
    },
    setStyle: hud.setStyle,
    setDisplay: hud.setDisplay,
    setSessionColors: hud.setSessionColors,
    setAgentHud: hud.setAgentHud,
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.termcat')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  if (process.platform === 'darwin') {
    app.dock.hide()
  }

  const { stop, setStyle, setDisplay, setSessionColors, setAgentHud } = startCore()

  registerSettingsIpcHandlers({
    onCatStyleChange: setStyle,
    onMultiSessionDisplayChange: setDisplay,
    onSessionColorsChange: setSessionColors,
    onAgentHudChange: setAgentHud,
  })

  app.on('before-quit', stop)

  if (!store.get('onboardingDone') && !hasAlias()) {
    openOnboardingWindow()
  }
})

app.on('window-all-closed', () => {})
