import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import gsap from 'gsap'
import { isCompact, prefersReducedMotion } from '../lib/env'
import { pulseWarp } from '../lib/warp'

type Props = {
  page: number
  children: (page: number) => ReactNode
}

/**
 * Holds one page at a time and plays the hand-off.
 *
 * The requested page and the rendered one are separate pieces of state on
 * purpose: the outgoing page has to finish leaving before React is allowed to
 * unmount it, and there is no way to await that from a render.
 *
 * The travel is vertical — forward throws the current page up and out and
 * brings the next one in from below, so moving through the site feels like
 * falling through it rather than sliding along a carousel. The snow surges at
 * the same moment, which is what actually sells the distance.
 *
 * Everything inside a page marked `data-enter` is staggered in from here, so
 * a page only has to say which of its blocks are worth announcing.
 */
export default function SceneStage({ page, children }: Props) {
  const [shown, setShown] = useState(page)
  const wrap = useRef<HTMLDivElement>(null)
  const direction = useRef(1)

  useEffect(() => {
    if (shown === page) return
    direction.current = page > shown ? 1 : -1

    const el = wrap.current
    if (!el || prefersReducedMotion()) {
      setShown(page)
      return
    }

    pulseWarp()

    const tween = gsap.to(el, {
      y: -110 * direction.current,
      opacity: 0,
      scale: 0.94,
      // Blur is the one part of this that costs real compositing, so phones
      // get the travel without it.
      filter: isCompact() ? 'none' : 'blur(16px)',
      duration: 0.44,
      ease: 'power2.in',
      onComplete: () => setShown(page),
    })
    return () => {
      tween.kill()
    }
  }, [page, shown])

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return

    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0, scale: 1, filter: 'none' })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        {
          y: 130 * direction.current,
          opacity: 0,
          scale: 1.06,
          filter: isCompact() ? 'none' : 'blur(18px)',
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.9,
          ease: 'power3.out',
          // Leaving a filter on the element keeps it on its own layer and
          // re-rasterising for the life of the page.
          clearProps: 'filter',
        },
      )

      const blocks = el.querySelectorAll('[data-enter]')
      if (blocks.length) {
        gsap.from(blocks, {
          y: 56,
          opacity: 0,
          duration: 0.85,
          stagger: 0.085,
          ease: 'power3.out',
          delay: 0.16,
          // The glass panes lean toward the pointer with a transform from the
          // stylesheet; an inline `translate(0, 0)` left behind by this tween
          // would override it for the life of the page.
          clearProps: 'transform,opacity',
        })
      }
    }, el)

    return () => ctx.revert()
  }, [shown])

  return (
    <div ref={wrap} className="stage">
      {children(shown)}
    </div>
  )
}
