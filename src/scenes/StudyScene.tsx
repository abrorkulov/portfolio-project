import Carousel from '../components/Carousel'
import GlowArrow from '../components/GlowArrow'
import SceneHeader from '../components/SceneHeader'
import { study } from '../data/site'

export default function StudyScene({ onNext }: { onNext: () => void }) {
  return (
    <div className="scene scene-study">
      <SceneHeader index="02" eyebrow="study" title="Where I learn" />

      <div className="scene-block" data-enter="">
        <Carousel cards={study} />
      </div>

      <div className="scene-foot" data-enter="">
        <GlowArrow
          direction="down"
          variant="pill"
          label="Next: my stack"
          caption="stack"
          onClick={onNext}
        />
      </div>
    </div>
  )
}
