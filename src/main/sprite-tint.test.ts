import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ nativeImage: { createFromBitmap: vi.fn() } }))

import { parseHexColor, tintBgra } from '@main/sprite-tint'

function bgra(...pixels: Array<[number, number, number, number]>): Buffer {
  return Buffer.from(pixels.flat())
}

describe('parseHexColor', () => {
  it('parses with or without leading #', () => {
    expect(parseHexColor('#FF8C42')).toEqual({ r: 255, g: 140, b: 66 })
    expect(parseHexColor('3fa7ff')).toEqual({ r: 63, g: 167, b: 255 })
  })

  it('throws on malformed input', () => {
    expect(() => parseHexColor('#fff')).toThrow()
  })
})

describe('tintBgra', () => {
  it('fill: paints opaque pixels with the color and leaves transparent pixels alone', () => {
    const input = bgra([0, 0, 0, 255], [0, 0, 0, 0])
    const out = tintBgra(input, '#FF8C42', 'fill')
    expect([...out]).toEqual([66, 140, 255, 255, 0, 0, 0, 0])
  })

  it('fill: premultiplies by alpha for semi-transparent pixels', () => {
    const out = tintBgra(bgra([0, 0, 0, 128]), '#FFFFFF', 'fill')
    expect([...out]).toEqual([128, 128, 128, 128])
  })

  it('duotone: black stays black, white becomes white, mid-gray becomes the color', () => {
    const out = tintBgra(
      bgra([0, 0, 0, 255], [255, 255, 255, 255], [128, 128, 128, 255]),
      '#FF8C42',
      'duotone'
    )
    expect([...out.subarray(0, 4)]).toEqual([0, 0, 0, 255])
    expect([...out.subarray(4, 8)]).toEqual([255, 255, 255, 255])
    const [b, g, r] = [...out.subarray(8, 11)]
    expect(Math.abs(r - 255)).toBeLessThanOrEqual(2)
    expect(Math.abs(g - 140)).toBeLessThanOrEqual(2)
    expect(Math.abs(b - 66)).toBeLessThanOrEqual(2)
  })

  it('does not mutate the input buffer', () => {
    const input = bgra([0, 0, 0, 255])
    tintBgra(input, '#FF8C42', 'fill')
    expect([...input]).toEqual([0, 0, 0, 255])
  })
})
