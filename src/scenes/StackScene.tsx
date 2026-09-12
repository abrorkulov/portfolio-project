import GlowArrow from '../components/GlowArrow'
import SceneHeader from '../components/SceneHeader'
import { stack } from '../data/site'

export default function StackScene({ onNext }: { onNext: () => void }) {
  return (
    <div className="scene scene-stack">
      <SceneHeader index="03" eyebrow="stack" title="What I work with" />

      <div className="stack-grid">
        {stack.map((group) => (
          <article key={group.id} className="stack-card" data-enter="">
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
