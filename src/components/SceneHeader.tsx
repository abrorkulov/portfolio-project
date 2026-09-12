type Props = {
  index: string
  eyebrow: string
  title: string
}

export default function SceneHeader({ index, eyebrow, title }: Props) {
  return (
    <header className="scene-header" data-enter="">
      <p className="scene-eyebrow">
        <span className="scene-index">{index}</span>
        <span className="scene-rule" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 className="scene-title">{title}</h2>
    </header>
  )
}
