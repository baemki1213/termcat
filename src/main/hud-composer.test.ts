import { describe, expect, it } from 'vitest'

import { createHudComposer, type HudSettings, SESSION_PALETTE } from '@main/hud-composer'
import type { AgentSnapshot } from '@shared/types'

const DEFAULTS: HudSettings = {
  style: 'cat',
  display: 'multi',
  sessionColors: false,
  agentHud: true,
}

function agent(overrides: Partial<AgentSnapshot>): AgentSnapshot {
  return {
    key: 's:a1',
    sessionId: 's',
    agentId: 'a1',
    agentType: 'Explore',
    name: 'Explore',
    startedAt: 0,
    speedLevel: 'mid',
    toolCallsPerMinute: 4,
    lastActivityAt: 0,
    ...overrides,
  }
}

describe('createHudComposer', () => {
  it('returns one idle cat when nothing is running', () => {
    const entries = createHudComposer(DEFAULTS).compose([], [])
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ level: 'idle', style: 'cat', tint: null, title: '' })
  })

  it('puts session cats before agent cats', () => {
    const entries = createHudComposer(DEFAULTS).compose(
      [{ pid: 1, level: 'fast' }],
      [agent({ speedLevel: 'slow' })]
    )
    expect(entries.map((e) => e.key)).toEqual(['session:1', 'agent:s:a1'])
    expect(entries.map((e) => e.level)).toEqual(['fast', 'slow'])
  })

  it('gives agent cats their role look and a short title', () => {
    const [entry] = createHudComposer(DEFAULTS).compose(
      [],
      [agent({ agentType: 'Explore', name: 'Find all API endpoints' })]
    )
    expect(entry).toMatchObject({ style: 'cat', tint: '#3FA7FF', title: 'Find all …' })
    expect(entry.tooltip).toContain('Explore')
  })

  it('hides agents when agentHud is off', () => {
    const composer = createHudComposer({ ...DEFAULTS, agentHud: false })
    expect(composer.compose([], [agent({})])[0].key).toBe('idle')
  })

  it('tints sessions from the palette only when sessionColors is on', () => {
    const composer = createHudComposer(DEFAULTS)
    const sessions = Array.from({ length: 5 }, (_, i) => ({ pid: i, level: 'idle' as const }))
    expect(composer.compose(sessions, []).map((e) => e.tint)).toEqual([
      null,
      null,
      null,
      null,
      null,
    ])
    composer.setSessionColors(true)
    expect(composer.compose(sessions, []).map((e) => e.tint)).toEqual([
      ...SESSION_PALETTE,
      SESSION_PALETTE[0],
    ])
  })

  it('collapses everything into one fastest cat in single mode', () => {
    const composer = createHudComposer({ ...DEFAULTS, display: 'single' })
    const entries = composer.compose([{ pid: 1, level: 'slow' }], [agent({ speedLevel: 'fast' })])
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ key: 'single', level: 'fast', tint: null, title: '' })
  })

  it('applies the global style to session cats after setStyle', () => {
    const composer = createHudComposer(DEFAULTS)
    composer.setStyle('cat2')
    expect(composer.compose([{ pid: 1, level: 'idle' }], [])[0].style).toBe('cat2')
  })
})
