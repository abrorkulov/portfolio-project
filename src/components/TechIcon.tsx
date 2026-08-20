import { useState } from 'react'
import { getTechMeta, readableAccent } from '../lib/techMeta'

type TechIconProps = {
  name: string
  className?: string
}

/**
 * A technology's logo, with a monogram or glyph underneath it at all times.
 *
 * The fallback is painted first and the logo cross-fades over it once it
 * decodes. That ordering matters: the grid fires ~29 requests at the icon CDN
 * at once, and with the logo alone a tile sat visibly empty until its image
 * landed — or forever, if the CDN throttled or the visitor was offline.
 */
export default function TechIcon({
  name,
  className = 'h-8 w-8',
}: TechIconProps) {
  const meta = getTechMeta(name)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const accent = readableAccent(meta.color)
  const Glyph = meta.icon
  const showImage = Boolean(meta.slug) && !failed

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center ${className}`}
    >
      {/* Fallback layer — always mounted, faded out once the logo paints. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 grid place-items-center transition-opacity duration-300"
        style={{ opacity: loaded ? 0 : 1 }}
      >
        {Glyph ? (
          <Glyph className="h-full w-full" style={{ color: accent }} />
        ) : (
          <span
            className="font-display font-bold leading-none"
            style={{
              color: accent,
              fontSize: meta.mono.length > 2 ? '0.68em' : '0.9em',
            }}
          >
            {meta.mono}
          </span>
        )}
      </span>

      {showImage && (
        <img
          src={`https://cdn.simpleicons.org/${meta.slug}/${meta.color.replace('#', '')}`}
          alt=""
          aria-hidden="true"
          width={32}
          height={32}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-contain transition-opacity duration-300"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      )}
    </span>
  )
}
