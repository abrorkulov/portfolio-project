import { useEffect, useState } from 'react'

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

/**
 * Decides whether the 3D canvas should render, based on viewport width,
 * WebGL support, and the user's reduced-motion preference. Re-evaluates
 * on resize so rotating a tablet doesn't leave a stale decision.
 */
export function useCanSupport3D(minWidth = 640) {
  const [canSupport, setCanSupport] = useState(false)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const evaluate = () => {
      setCanSupport(window.innerWidth >= minWidth && hasWebGL() && !prefersReducedMotion)
    }

    evaluate()
    window.addEventListener('resize', evaluate)
    return () => window.removeEventListener('resize', evaluate)
  }, [minWidth])

  return canSupport
}
