import { corners, pages } from '../data/site'

/**
 * The two corners: a name at the top left and a page count at the top right.
 *
 * The only thing on the site that says whose it is on every page. It is set
 * small and tracked wide so it reads as a label on the frame, not a heading
 * competing with the one in the middle.
 */
export default function Corners({ page, onHome }: { page: number; onHome: () => void }) {
  const total = String(pages.length).padStart(2, '0')
  return (
    <div className="corners">
      <button type="button" className="corner corner-name" onClick={onHome}>
        {corners.name}
      </button>
      <p className="corner corner-count" aria-label={`Page ${page + 1} of ${pages.length}`}>
        <span className="corner-current">{String(page + 1).padStart(2, '0')}</span>
        <span className="corner-track" aria-hidden="true">
          {pages.map((entry, i) => (
            <i key={entry.id} className={i <= page ? 'is-lit' : undefined} />
          ))}
        </span>
        <span className="corner-total">{total}</span>
      </p>
    </div>
  )
}
