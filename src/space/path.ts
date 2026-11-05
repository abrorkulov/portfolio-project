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
import type { BodyId, Pose, Vec3, World } from './solar'

const DEG = Math.PI / 180
const NORTH: Vec3 = [0, 0, 1]

function upFrom(forward: Vec3, roll = 0): Vec3 {
  const side = norm(cross(forward, NORTH))
  const up = norm(cross(side, forward))
  return roll ? rotate(up, forward, roll * DEG) : up
}

type Framing = {
  dist: number
  /** Camera angle from the Sun, seen from the body. 0 is full, 180 is a new moon. */
  phase: number
  elev?: number
  shift: [number, number]
  mobileShift?: [number, number]
  mobileDist?: number
  fov?: number
  exposure?: number
  sky?: number
  roll?: number
}

function framed(world: World, id: BodyId, f: Framing, portrait: boolean): Pose {
  const center = world.positions[id]
  const body = BODIES[id]
  const toSun = norm(mul(center, -1))
  let dir = rotate(toSun, NORTH, f.phase * DEG)
  if (f.elev) dir = rotate(dir, norm(cross(dir, NORTH)), f.elev * DEG)
  const dist = portrait ? (f.mobileDist ?? f.dist * 1.5) : f.dist
  const position = add(center, mul(dir, dist * body.radius))
  const forward = mul(dir, -1)
  return {
    position,
    anchor: center,
    forward,
    up: upFrom(forward, f.roll),
    shift: portrait ? (f.mobileShift ?? [0, 0.34]) : f.shift,
    fov: f.fov ?? 30,
    exposure: f.exposure ?? 1,
    sky: f.sky ?? 1,
  }
}

function earthPose(world: World, portrait: boolean): Pose {
  const center = world.positions.earth
  const dir = orbitDirection(world)
  const dist = portrait ? 3.5 : 2.55
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
    shift: portrait ? [0.05, 0.3] : [0.32, 0.02],
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

export function solarPoses(world: World, portrait: boolean): Pose[] {
  return [
    earthPose(world, portrait),
    earthrisePose(world, portrait),
    framed(
      world,
      'mars',
      { dist: 4.9, phase: -62, elev: 10, shift: [0.42, 0.0], sky: 1, roll: -14 },
      portrait,
    ),
    framed(
      world,
      'jupiter',
      { dist: 4.4, phase: -66, elev: 3, shift: [0.42, 0.02], sky: 0.9, roll: 8 },
      portrait,
    ),
    framed(
      world,
      'saturn',
      {
        dist: 8.6,
        phase: -80,
        elev: 14,
        shift: [0.36, 0.02],
        mobileDist: 13,
        sky: 1,
        roll: 12,
        exposure: 1.2,
      },
      portrait,
    ),
    framed(
      world,
      'uranus',
      { dist: 5.4, phase: -70, elev: 12, shift: [0.42, 0.0], sky: 1.1, exposure: 1.15, roll: 10 },
      portrait,
    ),
    framed(
      world,
      'neptune',
      { dist: 5.4, phase: -76, elev: 6, shift: [0.42, 0.03], sky: 1.2, exposure: 1.55, roll: -10 },
      portrait,
    ),
    framed(
      world,
      'pluto',
      {
        dist: 7.5,
        phase: -64,
        elev: 12,
        shift: [0.68, 0.44],
        mobileShift: [0.5, 0.68],
        mobileDist: 8,
        sky: 1.3,
        exposure: 1.25,
        roll: 18,
      },
      portrait,
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
export function blendPose(a: Pose, b: Pose, u: number): Pose {
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
  const forward = norm(mix3(a.forward, b.forward, turn))
  let up = mix3(a.up, b.up, turn)
  up = norm(sub(up, mul(forward, dot(up, forward))))
  return {
    position,
    anchor: turn < 0.5 ? a.anchor : b.anchor,
    forward,
    up: len(up) > 0 ? up : a.up,
    shift: [
      a.shift[0] + (b.shift[0] - a.shift[0]) * turn,
      a.shift[1] + (b.shift[1] - a.shift[1]) * turn,
    ],
    fov: a.fov + (b.fov - a.fov) * turn,
    exposure: a.exposure * Math.pow(b.exposure / a.exposure, turn),
    sky: a.sky + (b.sky - a.sky) * turn,
  }
}
