import { useEffect, useRef } from 'react'
import { onTelemetry } from '../lib/telemetry'
import { hud, nav, route } from '../data/site'

const LIGHT_KM_S = 299792

function formatKm(km: number) {
  if (km >= 1e9) return `${(km / 1e9).toFixed(2)} billion km`
  if (km >= 1e6) return `${(km / 1e6).toFixed(1)} million km`
  return `${Math.round(km).toLocaleString('en-US')} km`
}

function formatLight(km: number) {
  const s = km / LIGHT_KM_S
  if (s < 1) return `${Math.round(s * 1000)} ms`
  if (s < 60) return `${s.toFixed(1)} s`
  if (s < 3600) return `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`
  return `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`
}

function formatYears(ly: number) {
  if (ly >= 1e6) return `${(ly / 1e6).toFixed(1)} million light-years`
  return `${Math.round(ly).toLocaleString('en-US')} light-years`
}

/**
 * Real distances, live, and a route down the side of the screen. These are the
 * only always-visible instruments, and they are deliberately small: the thing to
 * look at is the planet.
 */
export default function Hud() {
  const distance = useRef<HTMLSpanElement>(null)
  const light = useRef<HTMLSpanElement>(null)
  const place = useRef<HTMLSpanElement>(null)
  const rail = useRef<HTMLOListElement>(null)
  const lastStop = useRef(-1)

  useEffect(
    () =>
      onTelemetry(({ at, km, lightYears }) => {
        const stop = Math.round(at)
        if (stop !== lastStop.current) {
          lastStop.current = stop
          if (place.current) place.current.textContent = route[Math.min(stop, route.length - 1)].name
          const items = rail.current?.children
          if (items) {
            for (let i = 0; i < items.length; i++) items[i].classList.toggle('is-on', i === stop)
          }
        }
        if (!distance.current || !light.current) return
        if (!Number.isNaN(lightYears)) {
          distance.current.textContent = formatYears(lightYears)
          light.current.textContent = ''
        } else if (!Number.isNaN(km)) {
          distance.current.textContent = formatKm(km)
          light.current.textContent = `${hud.light} ${formatLight(km)}`
        }
      }),
    [],
  )

  return (
    <>
      <header className="hud">
        <a className="hud-name" href="#top">
          abrorkulov.uz
        </a>
        <nav className="hud-nav" aria-label="Sections">
          {nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <ol ref={rail} className="rail" aria-label="Route">
        {route.map((stop, i) => (
          <li key={stop.id} className={i === 0 ? 'is-on' : undefined}>
            <a href={`#${stop.id}`} aria-label={stop.name}>
              <span>{stop.name}</span>
              <i />
            </a>
          </li>
        ))}
      </ol>

      <div className="readout" aria-hidden="true">
        <span ref={place} className="readout-place">
          {route[0].name}
        </span>
        <span className="readout-from">{hud.fromHome}</span>
        <span ref={distance}>0 km</span>
        <span ref={light} className="readout-light" />
      </div>
    </>
  )
}
