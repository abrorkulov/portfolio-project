type Direction = 'left' | 'right' | 'down'

type Props = {
  direction: Direction
  onClick: () => void
  label: string
  /** The wide labelled form used to move between pages. */
  variant?: 'round' | 'pill'
  /** Pill only: the word printed beside the arrow. */
  caption?: string
  disabled?: boolean
}

const ROTATION: Record<Direction, string> = {
  right: '0deg',
  left: '180deg',
  down: '90deg',
}

function Arrow({ direction }: { direction: Direction }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: `rotate(${ROTATION[direction]})` }}
    >
      <path d="M5 12h13" />
      <path d="M12.5 5.5 19 12l-6.5 6.5" />
    </svg>
  )
}

/**
 * The one navigation control on the site, in two sizes.
 *
 * `pill` moves between pages and carries a word, because an unlabelled arrow
 * next to a deck that also has arrows is a coin toss. `round` is the pair that
 * flanks the deck and only ever changes the card.
 */
export default function GlowArrow({
  direction,
  onClick,
  label,
  variant = 'round',
  caption,
  disabled = false,
}: Props) {
  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="glow-pill"
      >
        <span>{caption ?? label}</span>
        <span className="glow-pill-mark">
          <Arrow direction={direction} />
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="glow-round"
    >
      <Arrow direction={direction} />
    </button>
  )
}
