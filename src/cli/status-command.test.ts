import { describe, expect, it } from 'vitest'

import { formatStatus } from '@cli/status-command'

describe('formatStatus', () => {
  it('prints placeholders when nothing is running', () => {
    expect(formatStatus({ sessions: [], agents: [] })).toBe(
      'sessions (0):\n  (none)\nagents (0):\n  (none)\n'
    )
  })

  it('lists sessions and agents with their levels', () => {
    const text = formatStatus({
      sessions: [
        { pid: 7, command: 'claude', startedAt: 0, speedLevel: 'fast', cps: 150.4, tokens: null },
      ],
      agents: [
        {
          key: 'sess:a1',
          sessionId: 'sess-123456789',
          agentId: 'a1',
          agentType: 'Explore',
          name: 'Find endpoints',
          startedAt: 0,
          speedLevel: 'mid',
          toolCallsPerMinute: 12,
          lastActivityAt: 0,
        },
      ],
    })
    expect(text).toContain('[fast] claude (pid 7, 150 chars/s)')
    expect(text).toContain('[mid] Find endpoints — Explore (12 calls/min, session sess-123)')
  })
})
