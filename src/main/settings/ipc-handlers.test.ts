import { ipcMain } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { storeMock, rebuildTrayMenu, closeSettingsWindow } = vi.hoisted(() => ({
  storeMock: { get: vi.fn(), set: vi.fn() },
  rebuildTrayMenu: vi.fn(),
  closeSettingsWindow: vi.fn(),
}))

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
}))
vi.mock('@main/store', () => ({ store: storeMock }))
vi.mock('@main/tray-menu', () => ({ rebuildTrayMenu }))
vi.mock('@main/settings/window', () => ({ closeSettingsWindow }))

import {
  registerSettingsIpcHandlers,
  type SettingsChangeCallbacks,
} from '@main/settings/ipc-handlers'
import type { AIShortcut, SpeedThresholds } from '@shared/types'

type Handler = (event: unknown, ...args: unknown[]) => unknown

function noopCallbacks(): SettingsChangeCallbacks {
  return {
    onCatStyleChange: vi.fn(),
    onMultiSessionDisplayChange: vi.fn(),
    onSessionColorsChange: vi.fn(),
    onAgentHudChange: vi.fn(),
  }
}

function getHandler(channel: string): Handler {
  const call = vi.mocked(ipcMain.handle).mock.calls.find((c) => c[0] === channel)
  if (!call) throw new Error(`No handler registered for ${channel}`)
  return call[1] as Handler
}

describe('registerSettingsIpcHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('channel registration', () => {
    it('registers all 14 settings channels exactly once', () => {
      registerSettingsIpcHandlers(noopCallbacks())
      const channels = vi.mocked(ipcMain.handle).mock.calls.map((c) => c[0])
      expect(channels.sort()).toEqual(
        [
          'ai-shortcut:list',
          'ai-shortcut:save',
          'ai-shortcut:delete',
          'settings:close',
          'thresholds:get',
          'thresholds:set',
          'cat-style:get',
          'cat-style:set',
          'multi-session-display:get',
          'multi-session-display:set',
          'session-colors:get',
          'session-colors:set',
          'agent-hud:get',
          'agent-hud:set',
        ].sort()
      )
    })
  })

  describe('ai-shortcut:list', () => {
    it('returns shortcuts from store', () => {
      const shortcuts: AIShortcut[] = [{ id: 'a', name: 'Claude', command: 'claude' }]
      storeMock.get.mockReturnValue(shortcuts)
      registerSettingsIpcHandlers(noopCallbacks())
      expect(getHandler('ai-shortcut:list')(null)).toEqual(shortcuts)
      expect(storeMock.get).toHaveBeenCalledWith('aiShortcuts')
    })
  })

  describe('ai-shortcut:save', () => {
    it('appends a new shortcut when its id is not present', () => {
      const existing: AIShortcut[] = [{ id: 'a', name: 'A', command: 'a' }]
      storeMock.get.mockReturnValue(existing)
      registerSettingsIpcHandlers(noopCallbacks())
      const newShortcut: AIShortcut = { id: 'b', name: 'B', command: 'b' }
      getHandler('ai-shortcut:save')(null, newShortcut)
      expect(storeMock.set).toHaveBeenCalledWith('aiShortcuts', [
        { id: 'a', name: 'A', command: 'a' },
        newShortcut,
      ])
    })

    it('overwrites the existing shortcut when ids match', () => {
      const existing: AIShortcut[] = [
        { id: 'a', name: 'A', command: 'a' },
        { id: 'b', name: 'B', command: 'b' },
      ]
      storeMock.get.mockReturnValue(existing)
      registerSettingsIpcHandlers(noopCallbacks())
      const updated: AIShortcut = { id: 'a', name: 'A2', command: 'a2' }
      getHandler('ai-shortcut:save')(null, updated)
      expect(storeMock.set).toHaveBeenCalledWith('aiShortcuts', [
        updated,
        { id: 'b', name: 'B', command: 'b' },
      ])
    })

    it('rebuilds the tray menu after save', () => {
      storeMock.get.mockReturnValue([])
      registerSettingsIpcHandlers(noopCallbacks())
      getHandler('ai-shortcut:save')(null, { id: 'a', name: 'A', command: 'a' })
      expect(rebuildTrayMenu).toHaveBeenCalledOnce()
    })
  })

  describe('ai-shortcut:delete', () => {
    it('removes only the shortcut whose id matches', () => {
      storeMock.get.mockReturnValue([
        { id: 'a', name: 'A', command: 'a' },
        { id: 'b', name: 'B', command: 'b' },
      ])
      registerSettingsIpcHandlers(noopCallbacks())
      getHandler('ai-shortcut:delete')(null, 'a')
      expect(storeMock.set).toHaveBeenCalledWith('aiShortcuts', [
        { id: 'b', name: 'B', command: 'b' },
      ])
    })

    it('leaves the list unchanged when id is not found', () => {
      const existing: AIShortcut[] = [{ id: 'a', name: 'A', command: 'a' }]
      storeMock.get.mockReturnValue(existing)
      registerSettingsIpcHandlers(noopCallbacks())
      getHandler('ai-shortcut:delete')(null, 'nonexistent')
      expect(storeMock.set).toHaveBeenCalledWith('aiShortcuts', existing)
    })

    it('rebuilds the tray menu even when nothing was deleted', () => {
      storeMock.get.mockReturnValue([])
      registerSettingsIpcHandlers(noopCallbacks())
      getHandler('ai-shortcut:delete')(null, 'unknown')
      expect(rebuildTrayMenu).toHaveBeenCalledOnce()
    })
  })

  describe('thresholds', () => {
    it('thresholds:get returns the persisted value', () => {
      const thresholds: SpeedThresholds = { slow: 30, mid: 150, smoothingTicks: 5 }
      storeMock.get.mockReturnValue(thresholds)
      registerSettingsIpcHandlers(noopCallbacks())
      expect(getHandler('thresholds:get')(null)).toEqual(thresholds)
      expect(storeMock.get).toHaveBeenCalledWith('thresholds')
    })

    it('thresholds:set persists the new value', () => {
      registerSettingsIpcHandlers(noopCallbacks())
      const next: SpeedThresholds = { slow: 50, mid: 200, smoothingTicks: 4 }
      getHandler('thresholds:set')(null, next)
      expect(storeMock.set).toHaveBeenCalledWith('thresholds', next)
    })
  })

  describe('cat-style', () => {
    it('cat-style:get returns the persisted style', () => {
      storeMock.get.mockReturnValue('cat2')
      registerSettingsIpcHandlers(noopCallbacks())
      expect(getHandler('cat-style:get')(null)).toBe('cat2')
      expect(storeMock.get).toHaveBeenCalledWith('catStyle')
    })

    it('cat-style:set persists the style and notifies the callback', () => {
      const onChange = vi.fn()
      registerSettingsIpcHandlers({ ...noopCallbacks(), onCatStyleChange: onChange })
      getHandler('cat-style:set')(null, 'cat2')
      expect(storeMock.set).toHaveBeenCalledWith('catStyle', 'cat2')
      expect(onChange).toHaveBeenCalledWith('cat2')
    })

    it('cat-style:set notifies once per call', () => {
      const onChange = vi.fn()
      registerSettingsIpcHandlers({ ...noopCallbacks(), onCatStyleChange: onChange })
      const handler = getHandler('cat-style:set')
      handler(null, 'cat')
      handler(null, 'cat2')
      expect(onChange).toHaveBeenCalledTimes(2)
      expect(onChange).toHaveBeenNthCalledWith(1, 'cat')
      expect(onChange).toHaveBeenNthCalledWith(2, 'cat2')
    })
  })

  describe('multi-session-display', () => {
    it('multi-session-display:get returns the persisted mode', () => {
      storeMock.get.mockReturnValue('single')
      registerSettingsIpcHandlers(noopCallbacks())
      expect(getHandler('multi-session-display:get')(null)).toBe('single')
      expect(storeMock.get).toHaveBeenCalledWith('multiSessionDisplay')
    })

    it('multi-session-display:set persists the mode and notifies the callback', () => {
      const onChange = vi.fn()
      registerSettingsIpcHandlers({ ...noopCallbacks(), onMultiSessionDisplayChange: onChange })
      getHandler('multi-session-display:set')(null, 'single')
      expect(storeMock.set).toHaveBeenCalledWith('multiSessionDisplay', 'single')
      expect(onChange).toHaveBeenCalledWith('single')
    })
  })

  describe('session-colors', () => {
    it('session-colors:get returns the persisted flag', () => {
      storeMock.get.mockReturnValue(true)
      registerSettingsIpcHandlers(noopCallbacks())
      expect(getHandler('session-colors:get')(null)).toBe(true)
      expect(storeMock.get).toHaveBeenCalledWith('sessionColors')
    })

    it('session-colors:set persists the flag and notifies the callback', () => {
      const onChange = vi.fn()
      registerSettingsIpcHandlers({ ...noopCallbacks(), onSessionColorsChange: onChange })
      getHandler('session-colors:set')(null, true)
      expect(storeMock.set).toHaveBeenCalledWith('sessionColors', true)
      expect(onChange).toHaveBeenCalledWith(true)
    })
  })

  describe('agent-hud', () => {
    it('agent-hud:get returns the persisted flag', () => {
      storeMock.get.mockReturnValue(false)
      registerSettingsIpcHandlers(noopCallbacks())
      expect(getHandler('agent-hud:get')(null)).toBe(false)
      expect(storeMock.get).toHaveBeenCalledWith('agentHud')
    })

    it('agent-hud:set persists the flag and notifies the callback', () => {
      const onChange = vi.fn()
      registerSettingsIpcHandlers({ ...noopCallbacks(), onAgentHudChange: onChange })
      getHandler('agent-hud:set')(null, false)
      expect(storeMock.set).toHaveBeenCalledWith('agentHud', false)
      expect(onChange).toHaveBeenCalledWith(false)
    })
  })

  describe('settings:close', () => {
    it('invokes closeSettingsWindow', () => {
      registerSettingsIpcHandlers(noopCallbacks())
      getHandler('settings:close')(null)
      expect(closeSettingsWindow).toHaveBeenCalledOnce()
    })
  })
})
