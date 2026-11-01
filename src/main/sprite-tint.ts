import { nativeImage } from 'electron'

/**
 * fill: 불투명 픽셀을 전부 한 색으로 칠한다 (실루엣 스프라이트용).
 * duotone: 밝기를 유지한 채 검정→색→흰색 그라데이션으로 다시 칠한다 (사진형 스프라이트용).
 */
export type TintMode = 'fill' | 'duotone'

interface Rgb {
  r: number
  g: number
  b: number
}

const BYTES_PER_PIXEL = 4
const LUMA = { r: 0.299, g: 0.587, b: 0.114 }

export function parseHexColor(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) throw new Error(`invalid hex color: ${hex}`)
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff }
}

function duotoneChannel(luma: number, color: number): number {
  // 0..0.5 → 검정→색, 0.5..1 → 색→흰색
  if (luma < 0.5) return color * (luma * 2)
  return color + (255 - color) * ((luma - 0.5) * 2)
}

/**
 * BGRA(premultiplied) 비트맵 버퍼를 제자리에서 색칠한 새 버퍼를 돌려준다.
 */
export function tintBgra(bitmap: Buffer, hex: string, mode: TintMode): Buffer {
  const color = parseHexColor(hex)
  const out = Buffer.from(bitmap)
  for (let i = 0; i < out.length; i += BYTES_PER_PIXEL) {
    const alpha = out[i + 3]
    if (alpha === 0) continue
    const scale = alpha / 255
    let { r, g, b } = color
    if (mode === 'duotone') {
      // premultiplied 값을 되돌려 실제 밝기를 구한다
      const luma = (LUMA.b * out[i] + LUMA.g * out[i + 1] + LUMA.r * out[i + 2]) / (255 * scale)
      r = duotoneChannel(luma, color.r)
      g = duotoneChannel(luma, color.g)
      b = duotoneChannel(luma, color.b)
    }
    out[i] = Math.round(b * scale)
    out[i + 1] = Math.round(g * scale)
    out[i + 2] = Math.round(r * scale)
  }
  return out
}

export function tintImage(
  img: Electron.NativeImage,
  hex: string,
  mode: TintMode
): Electron.NativeImage {
  const { width, height } = img.getSize()
  return nativeImage.createFromBitmap(tintBgra(img.toBitmap(), hex, mode), { width, height })
}
