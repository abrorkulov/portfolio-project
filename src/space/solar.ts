/**
 * Where everything is, today.
 *
 * Units are Earth radii in doubles. Nothing this big fits in a float, so the
 * shaders only ever see positions relative to the camera, worked out here.
 *
 * The planets sit at their real heliocentric longitudes for the visitor's date
 * (mean elements on circular orbits, good to a few degrees), and Earth's spin
 * is real to the minute: its night side is where night actually is. The one
 * deliberate lie is the Moon, which is held at a fixed angle to the Sun.
 * Earthrise over a new-phase Earth is a black disc, three days out of ten.
 */

export type Vec3 = [number, number, number]

export const AU = 23481
const DEG = Math.PI / 180

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s]
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2])
export const norm = (a: Vec3): Vec3 => mul(a, 1 / (len(a) || 1))
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
export const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

export type BodyId =
  'earth' | 'moon' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'clauding' | 'pluto'

export type Body = {
  id: BodyId
  radius: number
  /** Heliocentric distance in AU, and longitude at J2000 + degrees per day. */
  au: number
  lon0: number
  rate: number
  /** Axial tilt in degrees, and a display spin in radians per second. */
  tilt: number
  spin: number
  /** Linear albedo used when the map has not arrived, and for the far-off dot. */
  tint: Vec3
  /** Rim haze colour and strength. Zero for an airless body. */
  haze: Vec3
  hazeAmount: number
}

export const BODIES: Record<BodyId, Body> = {
  earth: {
    id: 'earth',
    radius: 1,
    au: 1,
    lon0: 100.46,
    rate: 0.98561,
    tilt: 23.44,
    spin: 0,
    tint: [0.2, 0.3, 0.45],
    haze: [0.3, 0.5, 1],
    hazeAmount: 0,
  },
  moon: {
    id: 'moon',
    radius: 0.2727,
    au: 1,
    lon0: 0,
    rate: 0,
    tilt: 6.7,
    spin: 0.0006,
    tint: [0.2, 0.19, 0.18],
    haze: [0, 0, 0],
    hazeAmount: 0,
  },
  mars: {
    id: 'mars',
    radius: 0.532,
    au: 1.524,
    lon0: 355.45,
    rate: 0.524,
    tilt: 25.2,
    spin: 0.012,
    tint: [0.45, 0.25, 0.14],
    haze: [0.8, 0.55, 0.4],
    hazeAmount: 0.16,
  },
  jupiter: {
    id: 'jupiter',
    radius: 10.97,
    au: 5.203,
    lon0: 34.4,
    rate: 0.08309,
    tilt: 3.1,
    spin: 0.016,
    tint: [0.55, 0.47, 0.37],
    haze: [0.75, 0.7, 0.6],
    hazeAmount: 0.14,
  },
  saturn: {
    id: 'saturn',
    radius: 9.14,
    au: 9.537,
    lon0: 49.94,
    rate: 0.03346,
    tilt: 26.7,
    spin: 0.012,
    tint: [0.6, 0.53, 0.4],
    haze: [0.8, 0.72, 0.55],
    hazeAmount: 0.12,
  },
  uranus: {
    id: 'uranus',
    radius: 3.98,
    au: 19.19,
    lon0: 313.23,
    rate: 0.01173,
    tilt: 97.8,
    spin: 0.006,
    tint: [0.56, 0.72, 0.76],
    haze: [0.62, 0.82, 0.86],
    hazeAmount: 0.26,
  },
  neptune: {
    id: 'neptune',
    radius: 3.86,
    au: 30.07,
    lon0: 304.88,
    rate: 0.00598,
    tilt: 28.3,
    spin: 0.008,
    tint: [0.22, 0.34, 0.62],
    haze: [0.35, 0.5, 0.85],
    hazeAmount: 0.3,
  },
  // Made up, and the page says so. The orbit and the map are invented; the sky behind it is not.
  clauding: {
    id: 'clauding',
    radius: 5.2,
    au: 34.6,
    lon0: 275,
    rate: 0.00484,
    tilt: 18,
    spin: 0.01,
    tint: [0.6, 0.3, 0.18],
    haze: [0.92, 0.58, 0.4],
    hazeAmount: 0.2,
  },
  pluto: {
    id: 'pluto',
    radius: 0.186,
    au: 39.48,
    lon0: 238.93,
    rate: 0.00397,
    tilt: 15,
    spin: 0.004,
    tint: [0.42, 0.36, 0.3],
    haze: [0.5, 0.6, 0.85],
    hazeAmount: 0.42,
  },
}

const J2000 = Date.UTC(2000, 0, 1, 12)
const MS_PER_DAY = 86_400_000

export const daysSinceJ2000 = (date: Date) => (date.getTime() - J2000) / MS_PER_DAY

export function heliocentric(body: Body, days: number): Vec3 {
  const lon = (body.lon0 + body.rate * days) * DEG
  return [Math.cos(lon) * body.au * AU, Math.sin(lon) * body.au * AU, 0]
}

/** Column-major mat3 taking ecliptic directions into a body's own frame. */
export type Mat3 = number[]

export function bodyFrame(tiltDeg: number, spin: number): Mat3 {
  const t = tiltDeg * DEG
  const ct = Math.cos(t)
  const st = Math.sin(t)
  const cs = Math.cos(spin)
  const ss = Math.sin(spin)
  // Ecliptic to equatorial about x, then the day's rotation about the pole.
  const r00 = cs
  const r01 = ss * ct
  const r02 = -ss * st
  const r10 = -ss
  const r11 = cs * ct
  const r12 = -cs * st
  const r20 = 0
  const r21 = st
  const r22 = ct
  return [r00, r10, r20, r01, r11, r21, r02, r12, r22]
}

/** Greenwich sidereal angle in radians: what puts Tashkent under the right sky. */
export function earthSpin(days: number): number {
  return ((280.46061837 + 360.98564736629 * days) % 360) * DEG
}

/** A latitude and longitude on Earth, as a unit vector in ecliptic space. */
export function earthPoint(latDeg: number, lonDeg: number, spin: number): Vec3 {
  const lat = latDeg * DEG
  const lon = lonDeg * DEG
  const b: Vec3 = [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)]
  const m = bodyFrame(BODIES.earth.tilt, spin)
  // The transpose of an orthonormal matrix is its inverse: body back to ecliptic.
  return [
    m[0] * b[0] + m[1] * b[1] + m[2] * b[2],
    m[3] * b[0] + m[4] * b[1] + m[5] * b[2],
    m[6] * b[0] + m[7] * b[1] + m[8] * b[2],
  ]
}

export const TASHKENT = { lat: 41.31, lon: 69.28 }

/** Rotate `v` about unit `axis` by `angle`. */
export function rotate(v: Vec3, axis: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return add(add(mul(v, c), mul(cross(axis, v), s)), mul(axis, dot(axis, v) * (1 - c)))
}

export type Pose = {
  /** Heliocentric camera position. */
  position: Vec3
  /** The body this shot is of. Flights zoom out of it and into the next one. */
  anchor: Vec3
  /** Unit view direction. */
  forward: Vec3
  up: Vec3
  /** Lens shift in NDC: moves the subject off-centre with no perspective skew. */
  shift: [number, number]
  fov: number
  /** Scene exposure at this stop. */
  exposure: number
  /** Live stars and sky brightness. */
  sky: number
}

export type World = {
  days: number
  spin: number
  sunDirAtEarth: Vec3
  positions: Record<BodyId, Vec3>
}

export function makeWorld(date: Date): World {
  const days = daysSinceJ2000(date)
  const spin = earthSpin(days)
  const earth = heliocentric(BODIES.earth, days)
  const toSun = norm(mul(earth, -1))
  // A little over a quarter-turn from the Sun as seen from Earth, so Earth seen from
  // the Moon is always gibbous. And at half its real distance: a true-scale Earth
  // is two degrees wide, and Earthrise wants it filling the sky over the horizon.
  const north: Vec3 = [0, 0, 1]
  const moonDir = norm(rotate(mul(toSun, -1), north, 118 * DEG))
  const positions = {} as Record<BodyId, Vec3>
  for (const id of Object.keys(BODIES) as BodyId[]) {
    positions[id] = heliocentric(BODIES[id], days)
  }
  positions.moon = add(earth, mul(add(moonDir, [0, 0, 0.06]), 30))
  return { days, spin, sunDirAtEarth: toSun, positions }
}

/**
 * The opening shot: Tashkent in view, and the terminator in view, always.
 *
 * Over Tashkent at noon the Sun is behind the camera and Earth is a flat lit
 * plate. So the camera slides along Tashkent's own latitude toward the terminator
 * and stops before Tashkent would leave the frame. Along the latitude, because the
 * obvious great-circle slide ends up over the Arctic looking down at the pole,
 * where north-up no longer means anything and the map stops looking like Earth.
 */
export function orbitDirection(world: World): Vec3 {
  const pole = earthPoint(90, 0, world.spin)
  const t = earthPoint(TASHKENT.lat, TASHKENT.lon, world.spin)
  const s = world.sunDirAtEarth
  const wanted = 100 * DEG
  let best: Vec3 = t
  let bestScore = Infinity
  for (let deg = -46; deg <= 46; deg += 2) {
    const c = rotate(t, pole, deg * DEG)
    const angle = Math.acos(Math.max(-1, Math.min(1, dot(c, s))))
    const score = Math.abs(angle - wanted) + Math.abs(deg) * 0.0005
    if (score < bestScore) {
      bestScore = score
      best = c
    }
  }
  return norm(best)
}
