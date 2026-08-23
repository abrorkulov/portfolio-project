import { useSyncExternalStore } from 'react'
import { isLiteMotion } from '@/shared/motion/motion'

/**
 * The two ambient effects the visitor is allowed to turn off, and the store
 * that keeps every component's view of them in sync.
 *
 * `particles` — the drifting canvas field and the cursor glow. Some people
 * find a moving background actively unpleasant to read over, and until now
 * the only way to stop it was an OS-level reduced-motion switch, which is a
 * blunt instrument for "I just want the dots to stop".
 *
 * `sound` — a very quiet synthesised tick on hover and click. It is **off by
 * default and always will be**: a page that makes noise before being asked is
 * the single most disliked thing on the web, and browsers block it anyway
 * until the visitor has interacted. The toggle is the opt-in.
 *
 * This is a hand-rolled external store rather than context because the
 * consumers are scattered (navbar, canvas, cursor) and the value changes
 * roughly never — a context provider would re-render the whole tree to
 * deliver two booleans.
 */

export type FxPrefs = {
  particles: boolean
  sound: boolean
}

const STORAGE_KEY = 'portfolio:fx'

function readStored(): FxPrefs {
  // The lite tier renders no particles regardless, so the stored value would
  // be describing something that does not exist. Report it honestly as off.
  const defaults: FxPrefs = { particles: !isLiteMotion, sound: false }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<FxPrefs>
    return {
      particles: isLiteMotion ? false : parsed.particles !== false,
      sound: parsed.sound === true,
    }
  } catch {
    // Private mode, disabled storage, or corrupt JSON. Not worth a failure.
    return defaults
  }
}

/**
 * The snapshot must keep a stable identity between changes.
 * `useSyncExternalStore` compares snapshots with `Object.is`, so returning a
 * fresh object on every read is an infinite render loop, not a stale-value bug
 * you would notice later.
 */
let state: FxPrefs = readStored()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => state

export function setFx(patch: Partial<FxPrefs>) {
  const next = { ...state, ...patch }
  if (next.particles === state.particles && next.sound === state.sound) return

  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Preference is still honoured for this session; it just will not persist.
  }
  listeners.forEach((listener) => listener())
}

export function useFx(): FxPrefs {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/* -------------------------------------------------------------------------
   Sound

   Synthesised, not sampled. Two oscillators and a gain ramp cost nothing and
   ship no bytes; a pair of mp3s would be two more network requests for
   something most visitors will never switch on.
------------------------------------------------------------------------- */

type AudioContextCtor = typeof AudioContext
let audio: AudioContext | null = null

function getContext(): AudioContext | null {
  if (audio) return audio

  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor })
      .webkitAudioContext

  if (!Ctor) return null

  try {
    audio = new Ctor()
    return audio
  } catch {
    return null
  }
}

/**
 * A short filtered blip.
 *
 * Every node is created per call and stopped on a timer. That sounds
 * wasteful, but a `WebAudio` oscillator is single-use by specification — it
 * cannot be restarted once stopped — and the graph is torn down for us the
 * moment the node finishes, so nothing accumulates.
 */
export function playTick(variant: 'hover' | 'click' = 'hover') {
  if (!state.sound) return

  const ctx = getContext()
  if (!ctx) return

  // Browsers start the context suspended until a gesture. Resuming on the
  // first tick means the very first click is silent and everything after it
  // works, which is better than asking for permission the page cannot get.
  if (ctx.state === 'suspended') void ctx.resume()

  const now = ctx.currentTime
  const isClick = variant === 'click'

  const osc = ctx.createOscillator()
  osc.type = isClick ? 'triangle' : 'sine'
  osc.frequency.setValueAtTime(isClick ? 660 : 1180, now)
  osc.frequency.exponentialRampToValueAtTime(isClick ? 330 : 880, now + 0.09)

  // Take the top off, or a bare oscillator reads as a smoke alarm.
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 2400

  const gain = ctx.createGain()
  const peak = isClick ? 0.05 : 0.022
  // A ramp, never a step: an instantaneous gain change is a click in the
  // waveform, which is audible as a pop over the top of the intended sound.
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (isClick ? 0.16 : 0.1))

  osc.connect(filter).connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.2)
}
