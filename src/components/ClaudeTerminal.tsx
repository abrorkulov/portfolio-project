import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronRight, RotateCcw, Sparkles, Square } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { aiPractice } from '../data/content'
import { ease, staggerParent } from '../lib/motion'
import { useMotionProfile } from '../lib/useMotionProfile'

const session = aiPractice.session

/** Glyph and colour per line kind. `null` icon means the text carries its own. */
const lineStyles: Record<
  (typeof session)[number]['kind'],
  { icon: LucideIcon | null; className: string }
> = {
  shell: { icon: null, className: 'text-ink-faint' },
  brand: { icon: Sparkles, className: 'text-signal' },
  user: { icon: ChevronRight, className: 'text-ink' },
  tool: { icon: Square, className: 'text-pulse' },
  ok: { icon: Check, className: 'text-emerald-400' },
}

/** Characters revealed per tick, and the delay between ticks. */
const CHARS_PER_TICK = 3
const TICK_MS = 26
/** Beat between one line finishing and the next starting. */
const LINE_GAP_MS = 240

export default function ClaudeTerminal() {
  const { isLite } = useMotionProfile()
  const rootRef = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)
  const [lineIndex, setLineIndex] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [runId, setRunId] = useState(0)

  const finished = lineIndex >= session.length

  // Nothing types until the panel is actually on screen. A timer chain that
  // starts on mount would have played the whole session to an empty viewport
  // and left the visitor with a finished transcript and no idea it moved.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.25 },
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  // The typing itself. Skipped entirely on the lite tier: a character-by-
  // character reveal is ~35 React renders a second, and a phone is better off
  // reading the finished transcript than watching it arrive.
  useEffect(() => {
    if (!started || isLite || finished) return

    const line = session[lineIndex]

    if (charCount < line.text.length) {
      const timer = setTimeout(() => {
        setCharCount((count) =>
          Math.min(line.text.length, count + CHARS_PER_TICK),
        )
      }, TICK_MS)
      return () => clearTimeout(timer)
    }

    const timer = setTimeout(() => {
      setLineIndex((index) => index + 1)
      setCharCount(0)
    }, LINE_GAP_MS)
    return () => clearTimeout(timer)
  }, [started, isLite, finished, lineIndex, charCount])

  const replay = () => {
    setLineIndex(0)
    setCharCount(0)
    setRunId((id) => id + 1)
    setStarted(true)
  }

  /** How many characters of a given line are currently visible. */
  const revealed = (index: number) => {
    if (!started) return 0
    // Lite skips the typing, so every line is complete the moment it starts.
    if (isLite) return session[index].text.length
    if (index < lineIndex) return session[index].text.length
    if (index === lineIndex) return charCount
    return 0
  }

  return (
    <div
      ref={rootRef}
      className="glass-card glow-border overflow-hidden rounded-3xl"
    >
      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.02] px-4 py-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <span className="min-w-0 flex-1 truncate text-center font-mono text-[11px] text-ink-faint">
          claude — ~/portfolio
        </span>
        <button
          type="button"
          onClick={replay}
          className="flex min-h-[28px] items-center gap-1.5 rounded-md px-2 font-mono text-[10px] uppercase tracking-wider text-ink-faint transition-colors hover:bg-white/5 hover:text-signal"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          replay
        </button>
      </div>

      {/* Transcript.

          Every line renders its full text at all times — the untyped tail is
          just transparent. That reserves the exact final height from the first
          frame, so nothing reflows as the session plays and a line that wraps
          on a narrow screen does not shove the rest of the page around. */}
      <motion.div
        key={runId}
        variants={staggerParent(0.05)}
        initial="hidden"
        animate={started ? 'show' : 'hidden'}
        className="space-y-1.5 p-4 font-mono text-[11px] leading-relaxed sm:p-5 sm:text-xs"
      >
        {session.map((line, index) => {
          const { icon: Icon, className } = lineStyles[line.kind]
          const shown = revealed(index)
          const isCurrent = !isLite && started && !finished && index === lineIndex

          return (
            <motion.div
              key={`${line.text}-${index}`}
              // Lite reads the finished transcript: no typing, and no
              // per-line fade either.
              variants={
                isLite
                  ? { hidden: {}, show: {} }
                  : {
                      hidden: { opacity: 1, y: 0 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.3, ease: ease.out },
                      },
                    }
              }
              className={`flex items-start gap-2 ${className}`}
            >
              {Icon && (
                <Icon
                  className="mt-[3px] h-3 w-3 shrink-0 transition-opacity duration-200"
                  style={{ opacity: shown > 0 ? 1 : 0 }}
                  aria-hidden="true"
                />
              )}
              <span className="min-w-0 break-words">
                <span>{line.text.slice(0, shown)}</span>
                {isCurrent && (
                  <span
                    aria-hidden="true"
                    className="ml-0.5 inline-block h-3 w-[6px] translate-y-[1px] animate-blink bg-signal"
                  />
                )}
                {/* The tail keeps its space without showing its glyphs. */}
                <span className="opacity-0">{line.text.slice(shown)}</span>
              </span>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
