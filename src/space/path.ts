import {
  BODIES,
  TASHKENT,
  cross,
  dot,
  earthPoint,
  len,
  mix3,
  mul,
  norm,
  orbitDirection,
  rotate,
  sub,
  add,
} from './solar'
import { eclipticToGalactic } from './starfield'
import type { BodyId, Pose, Vec3, World } from './solar'

const DEG = Math.PI / 180
const NORTH: Vec3 = [0, 0, 1]

/** Up, chosen so the Sun is to the right of frame: the dark limb always faces the words. */
function litFromRight(forward: Vec3, toSun: Vec3, roll = 0): Vec3 {
  const right = norm(sub(toSun, mul(forward, dot(toSun, forward))))
  const up = norm(cross(right, forward))
  return roll ? rotate(up, forward, roll * DEG) : up
}

const GALACTIC = eclipticToGalactic()

/** How much Milky Way lies along this direction: near the plane, best toward the core. */
function skyScore(d: Vec3) {
  const g = GALACTIC
  const x = g[0] * d[0] + g[3] * d[1] + g[6] * d[2]
  const z = g[2] * d[0] + g[5] * d[1] + g[8] * d[2]
  return Math.exp(-((z / 0.3) * (z / 0.3))) * (0.3 + 0.7 * (0.5 + 0.5 * x))
}

/** A body's north pole in ecliptic space. */
function bodyPole(tiltDeg: number): Vec3 {
  const t = tiltDeg * DEG
  return [0, Math.sin(t), Math.cos(t)]
}

type Framing = {
  dist: number
  /** Camera angle from the Sun, seen from the body. 0 is full, 180 is a new moon. */
  phase: number
  elev?: number
  shift: [number, number]
  /** How much of the screen's width the planet fills on a phone, and how far past its
      radius it reaches. Saturn's reach is its rings. */
  mobileFill?: number
  mobileReach?: number
  fov?: number
  exposure?: number
  sky?: number
  roll?: number
}

type Lens = { portrait: boolean; aspect: number }

/**
 * The distance at which a body fills this much of a narrow screen. Backing off by a
 * fixed factor is not enough: a phone sees 14 degrees across where a laptop sees 48,
 * so a planet framed for one runs off both sides of the other.
 */
function fittedDistance(fov: number, aspect: number, fill: number, reach: number) {
  const half = Math.tan((fov * Math.PI) / 360)
  const t = Math.min(half * aspect * fill, half * 0.44)
  return reach / Math.sin(Math.atan(t))
}

function framed(world: World, id: BodyId, f: Framing, lens: Lens): Pose {
  const { portrait, aspect } = lens
  const center = world.positions[id]
  const body = BODIES[id]
  const toSun = norm(mul(center, -1))
  // Fuller on a phone: with the dark side barely wider than the gutter, a half-lit
  // planet reads as a planet pushed off to one side of the screen.
  let dir = rotate(toSun, NORTH, (portrait ? f.phase * 0.62 : f.phase) * DEG)
  if (f.elev) dir = rotate(dir, norm(cross(dir, NORTH)), f.elev * DEG)
  const pole = bodyPole(body.tilt)
  const first = dir
  let bestScore = -1
  // Every spot on this circle around the planet-Sun line has the same lighting, so the
  // camera is free to stand wherever it likes on it. It takes the one that puts the
  // Milky Way behind the planet, on any date, while the planet stays upright and any
  // rings stay open. The sky itself is never moved.
  for (let deg = 0; deg < 360; deg += 6) {
    const candidate = rotate(first, toSun, deg * DEG)
    const look = mul(candidate, -1)
    const right = norm(sub(toSun, mul(look, dot(toSun, look))))
    const up = norm(cross(right, look))
    if (Math.abs(dot(up, pole)) < 0.72) continue
    if (body.id === 'saturn' && Math.abs(dot(candidate, pole)) < 0.3) continue
    const score = skyScore(look) + (deg === 0 ? 0.02 : 0)
    if (score > bestScore) {
      bestScore = score
      dir = candidate
    }
  }
  const dist = portrait
    ? fittedDistance(f.fov ?? 30, aspect, f.mobileFill ?? 0.8, f.mobileReach ?? 1)
    : f.dist
  const position = add(center, mul(dir, dist * body.radius))
  const forward = mul(dir, -1)
  return {
    position,
    anchor: center,
    forward,
    up: litFromRight(forward, toSun, f.roll),
    shift: portrait ? [0, 0.43] : f.shift,
    fov: f.fov ?? 30,
    exposure: f.exposure ?? 1,
    sky: f.sky ?? 1,
  }
}

function earthPose(world: World, portrait: boolean): Pose {
  const center = world.positions.earth
  const dir = orbitDirection(world)
  const dist = portrait ? 4.5 : 2.55
  const position = add(center, mul(dir, dist))
  const tashkent = add(center, earthPoint(TASHKENT.lat, TASHKENT.lon, world.spin))
  const forward = norm(sub(tashkent, position))
  // Earth's own north, so the planet is the right way up for anyone who knows the map.
  const pole = earthPoint(90, 0, world.spin)
  const side = norm(cross(forward, pole))
  return {
    position,
    anchor: center,
    forward,
    up: norm(cross(side, forward)),
    shift: portrait ? [0.06, 0.36] : [0.32, 0.02],
    fov: 30,
    exposure: 1,
    sky: 0.8,
  }
}

/**
 * Earth over the lunar horizon. The camera hangs just above the surface with
 * Earth a few degrees up, close enough to the horizon that the two share a frame.
 */
function earthrisePose(world: World, portrait: boolean): Pose {
  const moon = world.positions.moon
  const earth = world.positions.earth
  const r = BODIES.moon.radius
  const u = norm(sub(earth, moon))
  const altitude = 0.1
  const dip = Math.acos(1 / (1 + altitude))
  const above = 8.5 * DEG
  // Of all the places on the Moon with Earth at this height over the horizon, take
  // the one where the Sun is about twenty degrees up: low enough for long shadows
  // across the ground, and high enough that the ground is not just a black field.
  const toSun = norm(mul(moon, -1))
  const axis0 = norm(cross(u, NORTH))
  const polar = Math.PI / 2 + dip - above
  let n = rotate(u, axis0, -polar)
  let bestSun = Infinity
  for (let deg = 0; deg < 360; deg += 4) {
    const candidate = rotate(rotate(u, axis0, -polar), u, deg * DEG)
    const score = Math.abs(dot(candidate, toSun) - 0.34)
    if (score < bestSun) {
      bestSun = score
      n = candidate
    }
  }
  const position = add(moon, mul(n, r * (1 + altitude)))
  const toEarth = norm(sub(earth, position))
  const forward = toEarth
  const side = norm(cross(forward, n))
  return {
    position,
    anchor: moon,
    forward,
    up: rotate(norm(cross(side, forward)), forward, -5 * DEG),
    shift: portrait ? [0, 0.36] : [0.3, 0.34],
    fov: portrait ? 26 : 18,
    exposure: 1.05,
    sky: 0.5,
  }
}

export const LAST_SOLAR = 7

export function solarPoses(world: World, portrait: boolean, aspect: number): Pose[] {
  const lens: Lens = { portrait, aspect }
  return [
    earthPose(world, portrait),
    earthrisePose(world, portrait),
    framed(
      world,
      'mars',
      { dist: 4.9, phase: -62, elev: 10, shift: [0.42, 0.0], sky: 1, roll: -14 },
      lens,
    ),
    framed(
      world,
      'jupiter',
      { dist: 4.4, phase: -66, elev: 3, shift: [0.42, 0.02], sky: 0.9, roll: 8 },
      lens,
    ),
    framed(
      world,
      'saturn',
      {
        dist: 8.6,
        phase: -80,
        elev: 14,
        shift: [0.36, 0.02],
        mobileFill: 0.97,
        mobileReach: 2.27,
        sky: 1,
        roll: 12,
        exposure: 1.2,
      },
      lens,
    ),
    framed(
      world,
      'uranus',
      {
        dist: 7.4,
        phase: -70,
        elev: 12,
        shift: [0.48, 0.0],
        sky: 1.1,
        exposure: 1.15,
        roll: 10,
        mobileFill: 0.95,
        mobileReach: 2.05,
      },
      lens,
    ),
    framed(
      world,
      'neptune',
      { dist: 5.4, phase: -76, elev: 6, shift: [0.42, 0.03], sky: 1.2, exposure: 1.55, roll: -10 },
      lens,
    ),
    framed(
      world,
      'pluto',
      {
        dist: 7.5,
        phase: -64,
        elev: 12,
        shift: [0.68, 0.44],
        mobileFill: 0.62,
        sky: 1.3,
        exposure: 1.25,
        roll: 18,
      },
      lens,
    ),
  ]
}

/** Gentle at both ends. */
export const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * A flight is two zooms, not a straight line.
 *
 * Distance from the planet being left grows exponentially, and so does closeness to
 * the one ahead, so the disc shrinks and grows at a constant rate on screen, the way
 * it does in Powers of Ten. Interpolating position linearly instead keeps the next
 * planet an invisible dot until the last few percent of the scroll, then slams it in.
 *
 * Each zoom runs along the shot's own axis, camera straight back from the planet. A
 * direct path from a sunward camera to an outer planet goes through the planet.
 */
export function blendPose(a: Pose, b: Pose, u: number, viaSun = false): Pose {
  const span = len(sub(a.anchor, b.anchor))
  const fromA = sub(a.position, a.anchor)
  const fromB = sub(b.position, b.anchor)
  const startA = len(fromA)
  const startB = len(fromB)
  const leave = Math.pow(Math.min(1, u / 0.5), 1.35)
  const arrive = Math.pow(Math.min(1, (1 - u) / 0.5), 1.35)
  const outA = add(a.anchor, mul(norm(fromA), startA * Math.pow(span / startA, leave)))
  const inB = add(b.anchor, mul(norm(fromB), startB * Math.pow(span / startB, arrive)))
  const position = mix3(outA, inB, smoothstep(0.32, 0.68, u))

  // The turn happens in the empty middle of the leg. Until then the planet is watched
  // shrinking, and from then on the next one is already dead ahead when it appears.
  const turn = ease(Math.min(1, Math.max(0, (u - 0.28) / 0.44)))
  let forward = norm(mix3(a.forward, b.forward, turn))
  let shiftX = a.shift[0] + (b.shift[0] - a.shift[0]) * turn
  let shiftY = a.shift[1] + (b.shift[1] - a.shift[1]) * turn
  if (viaSun) {
    // On some legs the camera looks back over its shoulder at where all this light is
    // coming from, in the empty stretch where nothing else needs watching.
    const look =
      ease(Math.min(1, Math.max(0, (u - 0.2) / 0.2))) *
      (1 - ease(Math.min(1, Math.max(0, (u - 0.6) / 0.2))))
    const toSun = norm(mul(position, -1))
    forward = norm(mix3(forward, toSun, look))
    shiftX = shiftX + (0.3 - shiftX) * look
    shiftY = shiftY + (0.3 - shiftY) * look
  }
  let up = mix3(a.up, b.up, turn)
  up = norm(sub(up, mul(forward, dot(up, forward))))
  return {
    position,
    anchor: turn < 0.5 ? a.anchor : b.anchor,
    forward,
    up: len(up) > 0 ? up : a.up,
    shift: [shiftX, shiftY],
    fov: a.fov + (b.fov - a.fov) * turn,
    exposure: a.exposure * Math.pow(b.exposure / a.exposure, turn),
    sky: a.sky + (b.sky - a.sky) * turn,
  }
}

/**
 * Moons, placed where they make the shot. Their orbits are real distances, in host
 * radii, but where each one is along its orbit is chosen: most of the way behind the
 * planet, at a set offset beside it, which is somewhere it genuinely passes through.
 */
const MOONS: { stop: number; radius: number; orbit: number; x: number; y: number; tint: Vec3 }[] = [
  { stop: 3, radius: 0.286, orbit: 5.9, x: -1.62, y: 0.42, tint: [0.72, 0.6, 0.3] },
  { stop: 3, radius: 0.245, orbit: 9.4, x: -2.15, y: -0.72, tint: [0.72, 0.68, 0.6] },
  { stop: 3, radius: 0.413, orbit: 15, x: -2.7, y: 0.96, tint: [0.42, 0.38, 0.33] },
  { stop: 4, radius: 0.404, orbit: 20.3, x: -3.3, y: -1.1, tint: [0.72, 0.5, 0.24] },
  { stop: 6, radius: 0.212, orbit: 14.3, x: -1.85, y: 0.9, tint: [0.6, 0.55, 0.52] },
  { stop: 7, radius: 0.51, orbit: 16.5, x: -2.1, y: -1.2, tint: [0.3, 0.28, 0.27] },
]

export type Moon = { stop: number; position: Vec3; radius: number; tint: Vec3 }

export function placeMoons(poses: Pose[], portrait: boolean): Moon[] {
  return MOONS.map((m) => {
    const pose = poses[m.stop]
    const hostRadius = BODIES[STOP_BODIES[m.stop]].radius
    const right = norm(cross(pose.forward, pose.up))
    const up = norm(cross(right, pose.forward))
    const x = portrait ? m.x * 0.62 : m.x
    const y = portrait ? m.y * 0.8 : m.y
    const behind = Math.sqrt(Math.max(1, m.orbit * m.orbit - x * x - y * y))
    const position = add(
      pose.anchor,
      mul(add(add(mul(right, x), mul(up, y)), mul(pose.forward, behind)), hostRadius),
    )
    return { stop: m.stop, position, radius: m.radius * hostRadius, tint: m.tint }
  })
}

const STOP_BODIES: BodyId[] = [
  'earth',
  'moon',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
]
