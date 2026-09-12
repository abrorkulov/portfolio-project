import { useEffect, useState } from 'react'
import { useTypewriter } from '../lib/useTypewriter'
import { home } from '../data/site'

type Props = {
  onNext: () => void
  /** True on a second visit — the word is already known, so it just appears. */
  instant: boolean
}

export default function HomeScene({ onNext, instant }: Props) {
  const greeting = useTypewriter([home.greeting], { speed: 165, delay: 420, instant })
  const [landed, setLanded] = useState(false)

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
      <h1 className="home-hello">
        <span className="home-word">{greeting.typed[0]}</span>
        {!greeting.done ? <i className="caret caret-hello" /> : null}
        <span className={landed ? 'home-smile is-in' : 'home-smile'}>{home.smile}</span>
      </h1>

      <div className={landed ? 'home-cta is-in' : 'home-cta'}>
        <button type="button" className="press-me" onClick={onNext}>
          <span>{home.cta}</span>
        </button>
      </div>
    </div>
  )
}
