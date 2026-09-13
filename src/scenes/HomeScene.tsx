import { useEffect, useRef, useState } from 'react'
import { useTypewriter } from '../lib/useTypewriter'
import { useMagnet } from '../lib/pointer'
import { useCaretSparks } from '../lib/snowfx'
import { home } from '../data/site'

type Props = {
  onNext: () => void
  /** True on a second visit — the word is already known, so it just appears. */
  instant: boolean
}

export default function HomeScene({ onNext, instant }: Props) {
  // A click on the word while it is still being written finishes it. The
  // typing is the charm of the page, not a gate in front of it.
  const [skipped, setSkipped] = useState(false)
  const greeting = useTypewriter([home.greeting], {
    speed: 165,
    delay: 420,
    instant: instant || skipped,
  })
  const [landed, setLanded] = useState(false)
  const [wink, setWink] = useState(false)
  const magnet = useMagnet<HTMLSpanElement>()

  // Every letter that lands knocks a few flakes off the caret.
  const hello = useRef<HTMLHeadingElement>(null)
  useCaretSparks(hello, greeting.typed[0].length, 36)

  // The smile and the button are the payoff of the typing, so they wait for
  // it rather than sitting there while the word is still being written.
  //
  // This reveal is a class and a CSS transition rather than a tween. A tween
  // that is interrupted — by a page change landing mid-flight, by a reverted
  // context — leaves the element stranded at whatever opacity it had reached,
  // and the button that opens the whole site is not something to leave to
  // that. A class either is on the element or is not.
  useEffect(() => {
    if (greeting.done) setLanded(true)
  }, [greeting.done])

  return (
    <div className="home">
      <h1
        ref={hello}
        className={greeting.done ? 'home-hello' : 'home-hello is-typing'}
        onClick={() => setSkipped(true)}
        title={greeting.done ? undefined : 'Skip'}
      >
        <span className="home-word">{greeting.typed[0]}</span>
        {!greeting.done ? <i className="caret caret-hello" /> : null}
        <span
          className={landed ? 'home-smile is-in' : 'home-smile'}
          onPointerEnter={() => setWink(true)}
          onPointerLeave={() => setWink(false)}
        >
          {wink ? home.wink : home.smile}
        </span>
      </h1>

      <div className={landed ? 'home-cta is-in' : 'home-cta'}>
        {/* The magnet moves this span, never the button: the button carries
            its own hover transition on transform, and the two must not share
            an element. */}
        <span ref={magnet} className="magnet">
          <button type="button" className="press-me" onClick={onNext}>
            <span>{home.cta}</span>
          </button>
        </span>
        <p className="home-tagline">{home.tagline}</p>
      </div>
    </div>
  )
}
