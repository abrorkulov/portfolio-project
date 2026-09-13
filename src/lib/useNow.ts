import { useEffect, useState } from 'react'

/** Tashkent, for the clock and the sky. */
const LAT = 41.3111
const LON = 69.2797
const ZONE = 'Asia/Tashkent'

/** WMO weather codes, folded into the handful of words worth saying. */
function describe(code: number): string {
  if (code === 0) return 'clear'
  if (code <= 2) return 'a few clouds'
  if (code === 3) return 'overcast'
  if (code <= 48) return 'fog'
  if (code <= 57) return 'drizzle'
  if (code <= 67) return 'rain'
  if (code <= 77) return 'snowing'
  if (code <= 82) return 'showers'
  if (code <= 86) return 'snow showers'
  return 'a thunderstorm'
}

export type Now = {
  /** "23:41" in Tashkent, whatever the visitor's own clock says. */
  time: string
  /** "−3°, snowing" — empty until the forecast has arrived, or if it never does. */
  sky: string
}

/**
 * The time and the weather where the author actually is.
 *
 * The clock ticks on the minute. The sky comes from Open-Meteo, which needs
 * no key and is asked once per visit; if the request fails the line simply
 * carries the time on its own. Nothing here is essential — it is a
 * sign that there is a real person, in a real city, on the other end.
 */
export function useNow(): Now {
  const [time, setTime] = useState('')
  const [sky, setSky] = useState('')

  useEffect(() => {
    const format = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: ZONE,
    })
    const tick = () => setTime(format.format(new Date()))
    tick()
    // Align the interval to the next minute so the clock never shows a
    // stale minute for up to sixty seconds.
    let interval = 0
    const align = window.setTimeout(
      () => {
        tick()
        interval = window.setInterval(tick, 60_000)
      },
      60_000 - (Date.now() % 60_000),
    )
    return () => {
      window.clearTimeout(align)
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,weather_code&timezone=${encodeURIComponent(ZONE)}`
    fetch(url, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const current = data?.current
        if (!current || typeof current.temperature_2m !== 'number') return
        const degrees = Math.round(current.temperature_2m)
        const sign = degrees < 0 ? '−' : ''
        setSky(`${sign}${Math.abs(degrees)}°, ${describe(Number(current.weather_code))}`)
      })
      .catch(() => {
        /* the line carries the time on its own */
      })
    return () => controller.abort()
  }, [])

  return { time, sky }
}
