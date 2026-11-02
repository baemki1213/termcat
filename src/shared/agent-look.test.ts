import { describe, expect, it } from 'vitest'

import { AGENT_COLOR_HEX, lookForAgentType } from '@shared/agent-look'

describe('lookForAgentType', () => {
  it('gives built-in roles their fixed look', () => {
    expect(lookForAgentType('Explore')).toEqual({ color: 'blue', style: 'cat' })
    expect(lookForAgentType('general-purpose')).toEqual({ color: 'orange', style: 'runner' })
  })

  it('is deterministic for unknown roles', () => {
    expect(lookForAgentType('my-plugin:reviewer')).toEqual(lookForAgentType('my-plugin:reviewer'))
  })

  it('maps every look color to a hex value', () => {
    for (const type of ['Explore', 'Plan', 'a', 'b', 'c', 'zzz']) {
      expect(AGENT_COLOR_HEX[lookForAgentType(type).color]).toMatch(/^#[0-9A-F]{6}$/i)
    }
  })
})
