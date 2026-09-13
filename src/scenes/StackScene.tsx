import GlowArrow from '../components/GlowArrow'
import SceneHeader from '../components/SceneHeader'
import { glass } from '../lib/pointer'
import { stack } from '../data/site'

export default function StackScene({ onNext }: { onNext: () => void }) {
  const lit = glass(6)

  return (
    <div className="scene scene-stack">
      <SceneHeader index="03" eyebrow="stack" title="What I work with" />

      <div className="stack-grid">
        {stack.map((group, i) => (
          <article key={group.id} className="stack-card glass tilt" data-enter="" {...lit}>
            <span className="stack-num" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="stack-title">{group.title}</h3>
            <p className="stack-summary">{group.summary}</p>
            <ul className="stack-items">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="scene-foot" data-enter="">
        <GlowArrow
          direction="down"
          variant="pill"
          label="Next: contact"
          caption="contact"
          onClick={onNext}
        />
      </div>
    </div>
  )
}
