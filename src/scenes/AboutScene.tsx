import { useEffect, useState } from 'react'
import GlowArrow from '../components/GlowArrow'
import { useTypewriter } from '../lib/useTypewriter'
import { about } from '../data/site'

type Props = {
  onNext: () => void
  instant: boolean
}

export default function AboutScene({ onNext, instant }: Props) {
  const lines = useTypewriter(about.lines, {
    speed: 30,
    linePause: 340,
    // Long enough for the page to finish arriving before the first character
    // lands — typing under a moving element reads as a glitch.
    delay: 620,
    instant,
  })
  const [landed, setLanded] = useState(false)

  // A class and a CSS transition, not a tween — see HomeScene for why the one
  // control that moves the reader on is never left to an interruptible
  // animation.
  useEffect(() => {
    if (lines.done) setLanded(true)
  }, [lines.done])

  return (
    <div className="about">
      <div className="about-lines">
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
