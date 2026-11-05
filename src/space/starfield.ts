/**
 * The night sky, built from two sources.
 *
 * The 9,096 brightest stars come from the Yale Bright Star Catalog, in their real
 * positions and with their real brightness and colour, so Orion is Orion. Everything
 * fainter is generated, thickening toward the true galactic plane the way the real
 * sky does, because a catalog of every star an eye can see still leaves most of a
 * telescope's frame empty.
 *
 * One record per star, seven floats: direction in ecliptic space, linear colour, size.
 */

export const STAR_STRIDE = 7

const DEG = Math.PI / 180
const OBLIQUITY = 23.44 * DEG
const CE = Math.cos(OBLIQUITY)
const SE = Math.sin(OBLIQUITY)

/** Standard J2000 equatorial to galactic rotation. Rows map equatorial to galactic. */
const EQ_TO_GAL = [
  [-0.0548755604, -0.87343709, -0.4838350155],
  [0.4941094279, -0.44482963, 0.7469822445],
  [-0.867666149, -0.1980763734, 0.4559837762],
]

type V3 = [number, number, number]

const eqToEcliptic = (v: V3): V3 => [v[0], v[1] * CE + v[2] * SE, -v[1] * SE + v[2] * CE]
const eclipticToEq = (v: V3): V3 => [v[0], v[1] * CE - v[2] * SE, v[1] * SE + v[2] * CE]

/** Column-major mat3 taking an ecliptic direction to galactic coordinates. */
export function eclipticToGalactic(): number[] {
  const column = (v: V3) => {
    const e = eclipticToEq(v)
    return EQ_TO_GAL.map((row) => row[0] * e[0] + row[1] * e[1] + row[2] * e[2])
  }
  return [...column([1, 0, 0]), ...column([0, 1, 0]), ...column([0, 0, 1])]
}

function galacticToEcliptic(g: V3): V3 {
  // The rotation is orthonormal, so its transpose is its inverse.
  const m = EQ_TO_GAL
  const eq: V3 = [
    m[0][0] * g[0] + m[1][0] * g[1] + m[2][0] * g[2],
    m[0][1] * g[0] + m[1][1] * g[1] + m[2][1] * g[2],
    m[0][2] * g[0] + m[1][2] * g[1] + m[2][2] * g[2],
  ]
  return eqToEcliptic(eq)
}

/** Blackbody colour, linear, and pulled toward white: the eye barely sees star colour. */
function starColor(kelvin: number): V3 {
  const t = Math.min(40000, Math.max(1500, kelvin)) / 100
  const r = t <= 66 ? 1 : Math.min(1, 1.2929 * Math.pow(t - 60, -0.1332))
  const g =
    t <= 66
      ? Math.min(1, Math.max(0, 0.39 * Math.log(t) - 0.6318))
      : Math.min(1, 1.1299 * Math.pow(t - 60, -0.0755))
  const b = t >= 66 ? 1 : t <= 19 ? 0 : Math.min(1, Math.max(0, 0.5432 * Math.log(t - 10) - 1.1963))
  const toLinear = (c: number) => Math.pow(c, 2.2)
  const mix = 0.62
  return [
    toLinear(r) * mix + (1 - mix),
    toLinear(g) * mix + (1 - mix),
    toLinear(b) * mix + (1 - mix),
  ]
}

/** How bright a star of this magnitude reads. Compressed, as any camera would. */
const brightness = (magnitude: number) => 3.4 * Math.pow(Math.pow(10, -0.4 * magnitude), 0.5)

function write(out: Float32Array, i: number, dir: V3, kelvin: number, magnitude: number) {
  const e = brightness(magnitude)
  const c = starColor(kelvin)
  const o = i * STAR_STRIDE
  out[o] = dir[0]
  out[o + 1] = dir[1]
  out[o + 2] = dir[2]
  out[o + 3] = c[0] * e
  out[o + 4] = c[1] * e
  out[o + 5] = c[2] * e
  out[o + 6] = e
}

/** Decodes `stars.bin`: Int16 RA, Int16 Dec, Uint8 magnitude, Uint8 temperature. */
export function parseCatalog(buffer: ArrayBuffer): { data: Float32Array; count: number } {
  const view = new DataView(buffer)
  const count = Math.floor(buffer.byteLength / 6)
  const data = new Float32Array(count * STAR_STRIDE)
  for (let i = 0; i < count; i++) {
    const ra = ((view.getInt16(i * 6, true) + 32768) / 65535) * 2 * Math.PI
    const dec = (view.getInt16(i * 6 + 2, true) / 32767) * (Math.PI / 2)
    const magnitude = view.getUint8(i * 6 + 4) / 20 - 2
    const kelvin = (view.getUint8(i * 6 + 5) / 255) * 40000
    const cd = Math.cos(dec)
    write(
      data,
      i,
      eqToEcliptic([cd * Math.cos(ra), cd * Math.sin(ra), Math.sin(dec)]),
      kelvin,
      magnitude,
    )
  }
  return { data, count }
}

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

/** Cheap smooth noise, for star clouds: stars gather in drifts, not an even dust. */
function clump(x: number, y: number, z: number) {
  const f = 5.3
  return (
    0.5 +
    0.5 *
      Math.sin(x * f + 1.3 + Math.sin(y * f * 1.7)) *
      Math.sin(y * f * 1.3 + 0.7 + Math.sin(z * f * 2.1)) *
      Math.sin(z * f * 1.1 + 2.1 + Math.sin(x * f * 1.3))
  )
}

export function makeFaintStars(count: number): Float32Array {
  const rand = rng(2718)
  const data = new Float32Array(count * STAR_STRIDE)
  let i = 0
  while (i < count) {
    const inPlane = rand() < 0.62
    const lon = rand() * Math.PI * 2
    let sinB: number
    if (inPlane) {
      // Exponential in height over the plane, and thicker toward the galactic centre.
      const toCentre = Math.pow(0.5 + 0.5 * Math.cos(lon), 2)
      const scale = 0.09 + 0.16 * toCentre
      const sign = rand() < 0.5 ? -1 : 1
      sinB = sign * Math.min(1, -Math.log(1 - rand() * 0.999) * scale)
    } else {
      sinB = rand() * 2 - 1
    }
    const cosB = Math.sqrt(Math.max(0, 1 - sinB * sinB))
    const g: V3 = [cosB * Math.cos(lon), cosB * Math.sin(lon), sinB]
    if (inPlane && rand() > 0.25 + 0.75 * clump(g[0], g[1], g[2])) continue
    // Each magnitude down there are about twice as many stars.
    const magnitude = Math.min(11, 6.4 + -Math.log(1 - rand() * 0.98) * 0.9 + rand() * 2.6)
    const warmth = rand()
    const kelvin =
      warmth < 0.55
        ? 3200 + rand() * 2600
        : warmth < 0.88
          ? 5800 + rand() * 2500
          : 8500 + rand() * 11000
    write(data, i, galacticToEcliptic(g), kelvin, magnitude)
    i++
  }
  return data
}
