import { is } from '@electron-toolkit/utils'
import { app, Menu } from 'electron'

import {
  areClaudeHooksInstalled,
  buildHookCommand,
  installClaudeHooks,
  uninstallClaudeHooks,
} from '@cli/claude-hooks'
import { getCliEntryPath } from '@main/cli-path'
import { openOnboardingWindow } from '@main/onboarding'
import { launchAi, openSettingsWindow } from '@main/settings'
import { store } from '@main/store'

export function rebuildTrayMenu(): void {
  // no-op: menu is now built fresh on each right-click via getContextMenu()
}

/** Claude Code 서브에이전트 HUD 용 훅을 ~/.claude/settings.json 에 넣거나 뺀다. */
function toggleClaudeHooks(install: boolean): void {
  if (install) {
    installClaudeHooks(buildHookCommand(process.execPath, getCliEntryPath()))
  } else {
    uninstallClaudeHooks()
  }
}

export function getContextMenu(): Menu {
  const { openAtLogin } = app.getLoginItemSettings()

  const shortcuts = store.get('aiShortcuts')
  const shortcutItems = shortcuts.map((s) => ({
    label: s.name,
    click: () => launchAi(s.command),
  }))

  const aiSubmenuItems = [
    ...shortcutItems,
    ...(shortcutItems.length > 0 ? [{ type: 'separator' as const }] : []),
    { label: '설정 편집...', click: () => openSettingsWindow() },
  ]

  const devItems = is.dev
    ? [
        { type: 'separator' as const },
        {
          label: '[Dev] Reset Onboarding',
          click: () => {
            store.set('onboardingDone', false)
            openOnboardingWindow()
          },
        },
      ]
    : []

  return Menu.buildFromTemplate([
    { label: 'termcat', enabled: false },
    { type: 'separator' },
    {
      label: 'AI 실행하기',
      submenu: Menu.buildFromTemplate(aiSubmenuItems),
    },
    { type: 'separator' },
    {
      label: '데스크탑 실행 시 자동 시작',
      type: 'checkbox',
      checked: openAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({ openAtLogin: menuItem.checked, openAsHidden: true })
      },
    },
    {
      label: 'Claude Code 에이전트 HUD 훅 설치',
      type: 'checkbox',
      checked: areClaudeHooksInstalled(),
      click: (menuItem) => toggleClaudeHooks(menuItem.checked),
    },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' },
    ...devItems,
  ])
}
