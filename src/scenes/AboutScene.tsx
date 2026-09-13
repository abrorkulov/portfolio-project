import { useEffect, useRef, useState } from 'react'
import GlowArrow from '../components/GlowArrow'
import { useCaretSparks } from '../lib/snowfx'
import { useTypewriter } from '../lib/useTypewriter'
import { about } from '../data/site'

type Props = {
  onNext: () => void
  instant: boolean
}

export default function AboutScene({ onNext, instant }: Props) {
  // Four lines take a few seconds to write. A click on them lands the whole
  // text at once, for the reader who would rather read than watch.
  const [skipped, setSkipped] = useState(false)
  const lines = useTypewriter(about.lines, {
    speed: 30,
    linePause: 340,
    // Long enough for the page to finish arriving before the first character
    // lands — typing under a moving element reads as a glitch.
    delay: 620,
    instant: instant || skipped,
  })
  const [landed, setLanded] = useState(false)

  // Smaller sparks than the front page: there are a hundred and twenty of
  // these, and each one is a grace note, not an event.
  const block = useRef<HTMLDivElement>(null)
  useCaretSparks(block, lines.typed.join('').length, 5)

  // A class and a CSS transition, not a tween — see HomeScene for why the one
  // control that moves the reader on is never left to an interruptible
  // animation.
  useEffect(() => {
    if (lines.done) setLanded(true)
  }, [lines.done])

  return (
    <div className="about">
      <div
        ref={block}
        className={lines.done ? 'about-lines' : 'about-lines is-typing'}
        onClick={() => setSkipped(true)}
        title={lines.done ? undefined : 'Skip'}
      >
        {about.lines.map((line, i) => (
          <p key={line} className="about-line">
            {lines.typed[i]}
            {lines.cursor === i ? <i className="caret" /> : null}
          </p>
        ))}
      </div>

      <div className={landed ? 'about-next is-in' : 'about-next'}>
        <GlowArrow
          direction="down"
          variant="pill"
          label="Next: where I learn"
          caption={about.next}
          onClick={onNext}
        />
      </div>
    </div>
  )
}
