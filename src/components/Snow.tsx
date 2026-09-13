import { Suspense, lazy, useEffect, useState } from 'react'
import Spotlight from './Spotlight'
import { canRunWebGL } from '../lib/env'

const SnowGL = lazy(() => import('./SnowGL'))

/**
 * The weather under the whole site: black, and falling.
 *
 * The tiled CSS field paints on the very first frame and stays. It is the
 * only snow a reduced-motion or software-rendered visitor ever sees, and it
 * gives the WebGL layer something to sit in front of while its chunk arrives.
 */
export default function Snow() {
  const [webgl, setWebgl] = useState(false)

  // Deliberately after mount: `canRunWebGL` creates a probe context, and
  // doing that during render would run it twice under StrictMode.
  useEffect(() => setWebgl(canRunWebGL()), [])

  return (
    <div className="snow" aria-hidden="true">
      <div className="snow-static" />
      <div className="snow-static snow-static-far" />
      <Spotlight />
      {webgl ? (
        <Suspense fallback={null}>
          <SnowGL />
        </Suspense>
      ) : null}
    </div>
  )
}
