import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * The bridge between the page and the snow.
 *
 * Everything here is a plain object read by the render loop in SnowGL, never
 * React state — the pointer moves sixty times a second and a state write per
 * move would re-render the tree under an animation whose only job is to stay
 * smooth. Before the GL chunk arrives, or where WebGL is off, every call here
 * quietly does nothing: the site is complete without the snow answering it.
 */

/** Where the pointer is, in normalised device coordinates (-1..1). */
export const pointer = { x: 0, y: 0, on: false }

/** The last tap, as a ring that runs out through the field. `at` is the
    field's own clock, set by SnowGL; -1 means no ring. */
export const ripple = { x: 0, y: 0, at: -1 }

export type Burst = {
  /** Screen points, as [x0, y0, x1, y1, ...] in CSS pixels. */
  points: Float32Array
  /** Where the flakes fly from, in screen pixels. Defaults to each point. */
  origin?: { x: number; y: number }
  /** How hard they are thrown outward from the origin, in px/s. */
  scatter: number
  /** Random speed added to every flake, in px/s. */
  jitter: number
  /** Toward the camera, in world units per second: [min, max]. */
  rush: [number, number]
  /** Seconds before the flake is gone. */
  life: number
  /** Point size range. The falling snow's sizes are read at half this
      distance, so a burst needs about twice the number to look the same. */
  size: [number, number]
}

type Emitter = (burst: Burst) => void

let emitter: Emitter | null = null

/** SnowGL installs itself here once it is mounted, and removes itself after. */
export function setEmitter(fn: Emitter | null) {
  emitter = fn
}

/** A handful of flakes thrown from one screen point. */
export function spark(x: number, y: number, count: number, spread = 70) {
  if (!emitter) return
  const points = new Float32Array(count * 2)
  for (let i = 0; i < count; i += 1) {
    points[i * 2] = x
    points[i * 2 + 1] = y
  }
  emitter({
    points,
    scatter: 0,
    jitter: spread,
    rush: [10, 70],
    life: 1.1,
    size: [3.0, 6.5],
  })
}

/** The wake of the pointer: two flakes that drift down from where it just
    was. Called on every move, so it is deliberately the smallest burst. */
export function trail(x: number, y: number) {
  if (!emitter) return
  emitter({
    points: Float32Array.of(x, y, x, y),
    scatter: 0,
    jitter: 26,
    rush: [4, 22],
    life: 1.0,
    size: [3.5, 6.5],
  })
}

/**
 * Turns an element's text into flakes and throws them outward.
 *
 * The glyphs are rasterised with the element's own computed font onto an
 * offscreen canvas and sampled on a grid, so the burst has the shape of the
 * word. It is an approximation of where the browser drew the letters — the
 * element fades at the same moment, so a few pixels of drift never show.
 */
export function dissolve(el: HTMLElement, step = 4) {
  if (!emitter) return
  const text = el.textContent ?? ''
  if (!text.trim()) return

  const rect = el.getBoundingClientRect()
  const style = getComputedStyle(el)
  const width = Math.ceil(rect.width)
  const height = Math.ceil(rect.height)
  if (width === 0 || height === 0) return

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return

  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  // Titles are tracked tight; without this the canvas word runs a few
  // pixels wider than the one on screen.
  if ('letterSpacing' in ctx) ctx.letterSpacing = style.letterSpacing
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText(text, width / 2, height / 2)

  const data = ctx.getImageData(0, 0, width, height).data
  const found: number[] = []
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (data[(y * width + x) * 4 + 3] > 110) {
        found.push(rect.left + x, rect.top + y)
      }
    }
  }
  if (found.length === 0) return

  emitter({
    points: Float32Array.from(found),
    origin: { x: rect.left + width / 2, y: rect.top + height / 2 },
    scatter: 0.9,
    jitter: 55,
    rush: [90, 260],
    life: 1.9,
    size: [2.4, 4.8],
  })
}

/**
 * Throws a few flakes from the caret every time a character lands.
 *
 * `count` is how many characters are on screen; the effect only fires when
 * it grows, so a re-render for any other reason costs nothing.
 */
export function useCaretSparks(host: RefObject<HTMLElement>, count: number, flakes: number) {
  const last = useRef(count)
  useEffect(() => {
    if (count <= last.current) {
      last.current = count
      return
    }
    last.current = count
    const caret = host.current?.querySelector<HTMLElement>('.caret')
    if (!caret) return
    const box = caret.getBoundingClientRect()
    spark(box.left + box.width / 2, box.top + box.height / 2, flakes)
  }, [host, count, flakes])
}
