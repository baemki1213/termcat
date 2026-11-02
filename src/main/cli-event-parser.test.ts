import { describe, expect, it } from 'vitest'

import { parseCliEvent } from '@main/cli-event-parser'

describe('parseCliEvent', () => {
  describe('session:start', () => {
    it('parses a valid session:start event', () => {
      const result = parseCliEvent({ type: 'session:start', pid: 123, command: 'claude' })
      expect(result).toEqual({ type: 'session:start', pid: 123, command: 'claude' })
    })

    it('throws when pid is missing', () => {
      expect(() => parseCliEvent({ type: 'session:start', command: 'claude' })).toThrow()
    })

    it('throws when command is missing', () => {
      expect(() => parseCliEvent({ type: 'session:start', pid: 123 })).toThrow()
    })
  })

  describe('session:data', () => {
    it('parses a valid session:data event', () => {
      const result = parseCliEvent({ type: 'session:data', pid: 123, chars: 50, timestamp: 1000 })
      expect(result).toEqual({ type: 'session:data', pid: 123, chars: 50, timestamp: 1000 })
    })

    it('throws when chars is missing', () => {
      expect(() => parseCliEvent({ type: 'session:data', pid: 123, timestamp: 1000 })).toThrow()
    })
  })

  describe('session:exit', () => {
    it('parses a valid session:exit event', () => {
      const result = parseCliEvent({ type: 'session:exit', pid: 123, code: 0 })
      expect(result).toEqual({ type: 'session:exit', pid: 123, code: 0 })
    })

    it('parses non-zero exit codes', () => {
      const result = parseCliEvent({ type: 'session:exit', pid: 123, code: 1 })
      expect(result).toEqual({ type: 'session:exit', pid: 123, code: 1 })
    })
  })

  describe('agent events', () => {
    it('parses agent:start', () => {
      const raw = { type: 'agent:start', sessionId: 's', agentId: 'a', agentType: 'Explore' }
      expect(parseCliEvent(raw)).toEqual(raw)
    })

    it('parses agent:intent', () => {
      const raw = { type: 'agent:intent', sessionId: 's', agentType: 'Plan', description: 'd' }
      expect(parseCliEvent(raw)).toEqual(raw)
    })

    it('parses agent:activity and drops unknown fields', () => {
      const raw = {
        type: 'agent:activity',
        sessionId: 's',
        agentId: 'a',
        toolName: 'Read',
        timestamp: 5,
        extra: true,
      }
      expect(parseCliEvent(raw)).toEqual({
        type: 'agent:activity',
        sessionId: 's',
        agentId: 'a',
        toolName: 'Read',
        timestamp: 5,
      })
    })

    it('parses agent:stop and agent:session-end', () => {
      expect(parseCliEvent({ type: 'agent:stop', sessionId: 's', agentId: 'a' })).toEqual({
        type: 'agent:stop',
        sessionId: 's',
        agentId: 'a',
      })
      expect(parseCliEvent({ type: 'agent:session-end', sessionId: 's' })).toEqual({
        type: 'agent:session-end',
        sessionId: 's',
      })
    })

    it('throws when sessionId is missing', () => {
      expect(() => parseCliEvent({ type: 'agent:start', agentId: 'a', agentType: 'x' })).toThrow()
    })
  })

  describe('status:get', () => {
    it('parses a status request', () => {
      expect(parseCliEvent({ type: 'status:get' })).toEqual({ type: 'status:get' })
    })
  })

  describe('invalid input', () => {
    it('throws for unknown event type', () => {
      expect(() => parseCliEvent({ type: 'unknown', pid: 1 })).toThrow('unknown event type')
    })

    it('throws for null input', () => {
      expect(() => parseCliEvent(null)).toThrow('invalid event')
    })

    it('throws for non-object input', () => {
      expect(() => parseCliEvent('string')).toThrow('invalid event')
    })

    it('throws for missing type field', () => {
      expect(() => parseCliEvent({ pid: 123 })).toThrow()
    })
  })
})
