/**
 * The Milky Way and the galaxies around it, as point clouds in kiloparsecs.
 * Seeded, so the same galaxy appears for everyone and on every load.
 */

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type PointCloud = {
  positions: Float32Array
  colors: Float32Array
  extra: Float32Array
  count: number
}

const WARM: [number, number, number] = [1, 0.79, 0.58]
const PALE: [number, number, number] = [0.92, 0.88, 0.82]
const COOL: [number, number, number] = [0.66, 0.77, 1]
const DUSTY: [number, number, number] = [0.86, 0.52, 0.44]

const PITCH = Math.tan((17 * Math.PI) / 180)
const BAR = 0.45

/** Four logarithmic arms, a bar, a warm old bulge and a cool young disc. */
export function makeMilkyWay(count: number): PointCloud {
  const rand = rng(1977)
  const gauss = () => {
    let u = 0
    let v = 0
    while (u === 0) u = rand()
    while (v === 0) v = rand()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const extra = new Float32Array(count)
  const hazeShare = 0.16

  for (let i = 0; i < count; i++) {
    const haze = i < count * hazeShare
    const kind = rand()
    let x = 0
    let y = 0
    let z = 0
    let c = PALE
    let energy = 0.05
    let size = 0.05 + rand() * rand() * 0.16

    if (!haze && kind < 0.17) {
      // Bulge and bar: old stars, so warm, and squashed along the bar's axis.
      const a = gauss() * 1.55
      const b = gauss() * 0.72
      x = a * Math.cos(BAR) - b * Math.sin(BAR)
      y = a * Math.sin(BAR) + b * Math.cos(BAR)
      z = gauss() * 0.5
      c = rand() < 0.75 ? WARM : PALE
      energy = 0.042 + rand() * 0.034
    } else {
      const r = Math.min(19, 1.5 - Math.log(1 - rand() * 0.995) * 3.3)
      const inArm = rand() < 0.62
      const arm = Math.floor(rand() * 4)
      let theta: number
      let offset = 0
      if (inArm) {
        // Clumpy along its length, or an arm reads as a groove in a vinyl record.
        const clump = 0.7 + 0.6 * Math.sin(r * 2.3 + arm * 1.7) * Math.sin(r * 0.9 + arm)
        const width = (0.14 + 0.14 * Math.min(1, r / 11)) * clump
        offset = gauss() * width
        theta = Math.log(r / 2.1) / PITCH + (arm * Math.PI) / 2 + BAR + offset
      } else {
        theta = rand() * Math.PI * 2
      }
      x = Math.cos(theta) * r
      y = Math.sin(theta) * r
      z = gauss() * (0.09 + 0.012 * r)

      const young = inArm && Math.abs(offset) < 0.16
      const pick = rand()
      if (young) {
        c = pick < 0.68 ? COOL : pick < 0.93 ? PALE : DUSTY
        energy = 0.06 + rand() * 0.05
      } else {
        c = pick < 0.5 ? PALE : pick < 0.86 ? WARM : COOL
        energy = 0.026 + rand() * 0.025
      }
      // Dust lanes hug the inner edge of each arm and swallow the light behind them.
      if (inArm && offset < -0.02 && offset > -0.16 && r > 2.5) energy *= 0.3
      if (rand() < 0.007) {
        size *= 3
        energy *= 2.5
      }
      energy *= 0.55 + 0.45 * Math.exp(-r / 9)
    }

    if (haze) {
      // A low wash of unresolved light for the stars no point cloud can afford: many
      // and faint, because any one bright enough to count shows as a soft blob.
      const rr = Math.hypot(x, y)
      size = 0.5 + rand() * 0.8
      energy = 0.0035 * Math.exp(-rr / 6)
      c = rr < 5 ? WARM : PALE
    }

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    colors[i * 3] = c[0] * energy
    colors[i * 3 + 1] = c[1] * energy
    colors[i * 3 + 2] = c[2] * energy
    extra[i] = size
  }
  return { positions, colors, extra, count }
}

/** Clustered, because galaxies are: thousands of them along strands, not a fog. */
export function makeDeepField(count: number): PointCloud {
  const rand = rng(90125)
  const gauss = () =>
    Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-6))) * Math.cos(2 * Math.PI * rand())
  const unit = (): [number, number, number] => {
    const z = rand() * 2 - 1
    const a = rand() * Math.PI * 2
    const s = Math.sqrt(1 - z * z)
    return [Math.cos(a) * s, Math.sin(a) * s, z]
  }

  const clusters: { c: [number, number, number]; spread: number }[] = []
  for (let i = 0; i < 70; i++) {
    const d = 600 * Math.pow(45, rand())
    const u = unit()
    clusters.push({ c: [u[0] * d, u[1] * d, u[2] * d], spread: 100 + d * (0.03 + rand() * 0.06) })
  }

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const extra = new Float32Array(count * 4)
  for (let i = 0; i < count; i++) {
    let p: [number, number, number]
    if (rand() < 0.68) {
      const k = clusters[Math.floor(rand() * clusters.length)]
      p = [k.c[0] + gauss() * k.spread, k.c[1] + gauss() * k.spread, k.c[2] + gauss() * k.spread]
    } else {
      const d = 500 * Math.pow(55, rand())
      const u = unit()
      p = [u[0] * d, u[1] * d, u[2] * d]
    }
    positions.set(p, i * 3)
    const spiral = rand() < 0.62
    const c = spiral ? (rand() < 0.65 ? COOL : PALE) : rand() < 0.75 ? WARM : PALE
    const energy = 0.32 + rand() * 0.7
    colors[i * 3] = c[0] * energy
    colors[i * 3 + 1] = c[1] * energy
    colors[i * 3 + 2] = c[2] * energy
    extra[i * 4] = rand() * Math.PI
    extra[i * 4 + 1] = 0.22 + rand() * 0.78
    extra[i * 4 + 2] = (30 + rand() * rand() * 230) * (spiral ? 1 : 0.7)
    extra[i * 4 + 3] = spiral ? 0.5 + rand() * 0.5 : 0
  }
  return { positions, colors, extra, count }
}
