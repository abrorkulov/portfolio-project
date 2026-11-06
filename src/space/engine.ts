import {
  BODIES,
  TASHKENT,
  add,
  bodyFrame,
  cross,
  dot,
  earthPoint,
  len,
  makeWorld,
  mul,
  norm,
  sub,
} from './solar'
import type { Body, BodyId, Pose, Vec3, World } from './solar'
import { LAST_SOLAR, blendPose, ease, placeMoons, solarPoses } from './path'
import type { Moon } from './path'
import { STAR_STRIDE, eclipticToGalactic, makeFaintStars, parseCatalog } from './starfield'
import { makeDeepField, makeMilkyWay } from './galaxy'
import type { PointCloud } from './galaxy'
import {
  BODY,
  COMPOSITE,
  ROCK_FRAG,
  ROCK_VERT,
  DEEP_FRAG,
  DEEP_VERT,
  DOWN,
  EARTH,
  FULLSCREEN,
  GALAXY_FRAG,
  GALAXY_VERT,
  SKY,
  STAR_FRAG,
  STAR_VERT,
  SUN,
  UP,
} from './shaders'

export type Telemetry = {
  /** Continuous position along the route. 0 is Earth; integers are the stops. */
  at: number
  /** Kilometres from Earth. */
  km: number
  lightYears: number
}

export type SpaceOptions = {
  canvas: HTMLCanvasElement
  /** Where the page says the route is; the engine eases toward it. */
  progress: () => number
  onTelemetry: (t: Telemetry) => void
  /** Screen position of Tashkent in CSS px, or null while it is out of sight. */
  onPin: (p: { x: number; y: number } | null) => void
  onReady: () => void
  onLost: () => void
  base?: string
}

export type Space = {
  pulse: () => void
  dispose: () => void
}

type Program = { p: WebGLProgram; u: (name: string) => WebGLUniformLocation | null }

const MAPS: Record<string, string> = {
  stars: 'stars.webp',
  'earth-day': 'earth-day.webp',
  'earth-night': 'earth-night.webp',
  'earth-clouds': 'earth-clouds.webp',
  moon: 'moon.webp',
  mars: 'mars.webp',
  jupiter: 'jupiter.webp',
  saturn: 'saturn.webp',
  'saturn-ring': 'saturn-ring.webp',
  uranus: 'uranus.webp',
  neptune: 'neptune.webp',
  clauding: 'clauding.webp',
  pluto: 'pluto.webp',
}

/** What each stop needs, loaded as the camera nears it rather than all up front. */
const NEEDS: string[][] = [
  ['stars', 'earth-day', 'earth-night', 'earth-clouds'],
  ['moon'],
  ['mars'],
  ['jupiter'],
  ['saturn', 'saturn-ring'],
  ['uranus'],
  ['neptune'],
  ['clauding'],
  ['pluto'],
]

const BODY_LOOK: Partial<
  Record<BodyId, { relief: number; detail: number; flat: number; banded: number }>
> = {
  moon: { relief: 0.5, detail: 0.3, flat: 0.75, banded: 0 },
  mars: { relief: 1.8, detail: 0.2, flat: 0.25, banded: 0 },
  jupiter: { relief: 0, detail: 0, flat: 0, banded: 1 },
  saturn: { relief: 0, detail: 0, flat: 0, banded: 1 },
  uranus: { relief: 0, detail: 0, flat: 0, banded: 0.4 },
  neptune: { relief: 0, detail: 0, flat: 0, banded: 0.4 },
  clauding: { relief: 0, detail: 0, flat: 0, banded: 1 },
  pluto: { relief: 1.4, detail: 0.2, flat: 0.55, banded: 0 },
}

function compile(gl: WebGL2RenderingContext, vert: string, frag: string, defines = ''): Program {
  const make = (type: number, src: string) => {
    const s = gl.createShader(type)!
    const final = defines
      ? src.replace('precision highp float;', `precision highp float;\n${defines}`)
      : src
    gl.shaderSource(s, final)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
    }
    return s
  }
  const p = gl.createProgram()!
  gl.attachShader(p, make(gl.VERTEX_SHADER, vert))
  gl.attachShader(p, make(gl.FRAGMENT_SHADER, frag))
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link')
  const cache = new Map<string, WebGLUniformLocation | null>()
  return {
    p,
    u: (name) => {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(p, name))
      return cache.get(name) ?? null
    },
  }
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export function createSpace(options: SpaceOptions): Space | null {
  const { canvas } = options
  const base = options.base ?? '/space/'
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  })
  if (!gl) return null

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = window.matchMedia('(max-width: 820px)').matches
  const compact = coarse || small

  const hdr =
    !!gl.getExtension('EXT_color_buffer_float') || !!gl.getExtension('EXT_color_buffer_half_float')
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic')
  const earthDefines = compact ? '#define VIEW_STEPS 7' : ''

  const programs = {
    sky: compile(gl, FULLSCREEN, SKY),
    stars: compile(gl, STAR_VERT, STAR_FRAG),
    sun: compile(gl, FULLSCREEN, SUN),
    earth: compile(gl, FULLSCREEN, EARTH, earthDefines),
    body: compile(gl, FULLSCREEN, BODY),
    galaxy: compile(gl, GALAXY_VERT, GALAXY_FRAG),
    deep: compile(gl, DEEP_VERT, DEEP_FRAG),
    rock: compile(gl, ROCK_VERT, ROCK_FRAG),
    down: compile(gl, FULLSCREEN, DOWN),
    up: compile(gl, FULLSCREEN, UP),
    composite: compile(gl, FULLSCREEN, COMPOSITE),
  }

  const emptyVao = gl.createVertexArray()
  let disposed = false

  // --- stars: at these distances nothing moves with parallax, so each sky is one
  // static buffer of directions, drawn as instanced quads --------------------------------
  const corner = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, corner)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const makeStarVao = (data: Float32Array) => {
    const vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, corner)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    const stride = STAR_STRIDE * 4
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 0)
    gl.vertexAttribDivisor(1, 1)
    gl.enableVertexAttribArray(2)
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 12)
    gl.vertexAttribDivisor(2, 1)
    gl.enableVertexAttribArray(3)
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 24)
    gl.vertexAttribDivisor(3, 1)
    gl.bindVertexArray(null)
    return vao
  }
  const FAINT_COUNT = compact ? 30000 : 70000
  const faintVao = makeStarVao(makeFaintStars(FAINT_COUNT))
  let catalog: { vao: WebGLVertexArrayObject; count: number } | null = null
  void fetch(base + 'stars.bin')
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('stars'))))
    .then((buffer) => {
      if (disposed) return
      const parsed = parseCatalog(buffer)
      catalog = { vao: makeStarVao(parsed.data), count: parsed.count }
    })
    .catch(() => {
      /* the generated stars carry the sky by themselves */
    })
  const galactic = eclipticToGalactic()

  // Rocks for the asteroid belt: seeds only, the shader decides where they are.
  const ROCK_COUNT = compact ? 700 : 1600
  const rockVao = gl.createVertexArray()!
  gl.bindVertexArray(rockVao)
  {
    const seeds = new Float32Array(ROCK_COUNT * 4)
    let s = 7
    const r = () => {
      s = (s * 1664525 + 1013904223) >>> 0
      return s / 4294967296
    }
    for (let i = 0; i < ROCK_COUNT * 4; i++) seeds[i] = r()
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0)
  }
  gl.bindVertexArray(null)

  // --- maps --------------------------------------------------------------------
  const textures = new Map<string, WebGLTexture>()
  const loading = new Set<string>()

  const loadMap = (name: string) => {
    if (textures.has(name) || loading.has(name) || !MAPS[name]) return
    loading.add(name)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = async () => {
      try {
        await img.decode()
      } catch {
        /* onload already says it is usable */
      }
      if (disposed) return
      const tex = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      if (aniso) {
        const max = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number
        gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max))
      }
      textures.set(name, tex)
      loading.delete(name)
    }
    img.onerror = () => loading.delete(name)
    img.src = base + MAPS[name]
  }

  const black = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, black)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 255]),
  )

  const bind = (slot: number, tex: WebGLTexture | undefined, loc: WebGLUniformLocation | null) => {
    gl.activeTexture(gl.TEXTURE0 + slot)
    gl.bindTexture(gl.TEXTURE_2D, tex ?? black)
    gl.uniform1i(loc, slot)
  }

  // --- render targets ----------------------------------------------------------
  type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number }
  const makeTarget = (w: number, h: number): Target => {
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    if (hdr) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    const fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    return { tex, fbo, w, h }
  }
  const freeTarget = (t: Target) => {
    gl.deleteTexture(t.tex)
    gl.deleteFramebuffer(t.fbo)
  }

  let scene: Target | null = null
  let chain: Target[] = []
  let width = 0
  let height = 0
  let cssW = 1
  let cssH = 1
  let quality = 1
  let portrait = false
  const maxDpr = compact ? 1.75 : 1.5

  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    cssW = rect.width
    cssH = rect.height
    portrait = cssW / cssH < 0.95
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr) * quality
    const w = Math.max(2, Math.round(cssW * dpr))
    const h = Math.max(2, Math.round(cssH * dpr))
    if (w === width && h === height) {
      rebuildPoses()
      return
    }
    width = w
    height = h
    canvas.width = w
    canvas.height = h
    if (scene) freeTarget(scene)
    chain.forEach(freeTarget)
    scene = makeTarget(w, h)
    chain = []
    let cw = w
    let ch = h
    for (let i = 0; i < 6; i++) {
      cw = Math.max(2, cw >> 1)
      ch = Math.max(2, ch >> 1)
      chain.push(makeTarget(cw, ch))
    }
    rebuildPoses()
  }

  // --- the route ---------------------------------------------------------------
  let world: World = makeWorld(new Date())
  let poses: Pose[] = []
  let moons: Moon[] = []
  // Pluto is turned so its heart faces the camera at the moment we get there.
  let plutoSpin = 0
  // Uranus's rings are threads: edge-on they vanish, so its axis is set from the shot.
  let uranusFrame: number[] = bodyFrame(BODIES.uranus.tilt, 0)
  const rebuildPoses = () => {
    poses = solarPoses(world, portrait, cssW / cssH)
    moons = placeMoons(poses, portrait)
    const c = norm(sub(poses[LAST_SOLAR].position, poses[LAST_SOLAR].anchor))
    const t = (BODIES.pluto.tilt * Math.PI) / 180
    plutoSpin = Math.atan2(c[1] * Math.cos(t) - c[2] * Math.sin(t), c[0]) + 0.1
    const shot = poses[5]
    const shotRight = norm(cross(shot.forward, shot.up))
    const pole = norm(add(add(mul(shot.forward, -0.46), mul(shot.up, 0.74)), mul(shotRight, 0.5)))
    const axisX = norm(cross(pole, [0, 0, 1]))
    const axisY = cross(pole, axisX)
    uranusFrame = [
      axisX[0],
      axisY[0],
      pole[0],
      axisX[1],
      axisY[1],
      pole[1],
      axisX[2],
      axisY[2],
      pole[2],
    ]
  }

  const milky = { cloud: null as PointCloud | null, vao: null as WebGLVertexArrayObject | null }
  const deep = { cloud: null as PointCloud | null, vao: null as WebGLVertexArrayObject | null }

  const buildGalaxies = () => {
    if (milky.vao) return
    const upload = (cloud: PointCloud, extraSize: number) => {
      const vao = gl.createVertexArray()!
      gl.bindVertexArray(vao)
      const attr = (loc: number, data: Float32Array, size: number) => {
        const b = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, b)
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0)
      }
      attr(0, cloud.positions, 3)
      attr(1, cloud.colors, 3)
      attr(2, cloud.extra, extraSize)
      gl.bindVertexArray(null)
      return vao
    }
    milky.cloud = makeMilkyWay(compact ? 90000 : 280000)
    milky.vao = upload(milky.cloud, 1)
    deep.cloud = makeDeepField(compact ? 3500 : 8000)
    deep.vao = upload(deep.cloud, 4)
  }

  // --- pointer: a few pixels of parallax, the difference between a picture and a place
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, moved: 0 }
  const onPointer = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    pointer.moved = performance.now()
  }
  if (!coarse) window.addEventListener('pointermove', onPointer, { passive: true })

  // --- frame state -------------------------------------------------------------
  let raf = 0
  let frameIndex = 0
  let start = 0
  let last = 0
  let at = -1
  let warp = 0
  let pulse = 0
  let ready = false
  let readyAt = 0
  let slow = 0
  let frames = 0
  let lastTelemetry = 0
  let worldStamp = performance.now()

  const setRay = (
    prog: Program,
    pose: { forward: Vec3; right: Vec3; up: Vec3; shift: [number, number]; tan: number },
  ) => {
    gl.uniform2f(prog.u('uRes'), width, height)
    gl.uniform3fv(prog.u('uF'), pose.forward)
    gl.uniform3fv(prog.u('uR'), pose.right)
    gl.uniform3fv(prog.u('uU'), pose.up)
    gl.uniform2f(prog.u('uShift'), pose.shift[0], pose.shift[1])
    gl.uniform1f(prog.u('uTan'), pose.tan)
  }

  const fullscreen = () => gl.drawArrays(gl.TRIANGLES, 0, 3)

  const render = (now: number) => {
    raf = requestAnimationFrame(render)
    if (document.hidden || !scene) return

    // Holding still, half the frames can go: the only motion left is a planet turning
    // a fraction of a degree. A laptop should not spin its fans for that.
    frameIndex++
    const holding =
      ready &&
      now - readyAt > 6500 &&
      now - pointer.moved > 1500 &&
      pulse === 0 &&
      Math.abs(options.progress() - at) < 0.0005
    if (holding && frameIndex % 2) return
    const dt = Math.min((now - last) / 1000, 0.25)
    last = now
    if (!start) start = now
    const time = (now - start) / 1000

    // Once a minute Earth is re-posed against the real clock.
    if (now - worldStamp > 60000) {
      worldStamp = now
      world = makeWorld(new Date())
      rebuildPoses()
    }

    if (!ready && textures.has('earth-day') && textures.has('earth-night')) {
      ready = true
      readyAt = now
      options.onReady()
    }
    if (!ready && time > 12) {
      // A very slow connection still gets a flight, over a plain blue marble.
      ready = true
      readyAt = now
      options.onReady()
    }

    // Quality falls before frame rate does. One-way, so the picture never pulses.
    // Only while moving. Holding still is deliberately half rate, and counting that as
    // slow would drop every machine to minimum resolution just for standing still.
    if (!holding) {
      frames++
      if (dt > 0.03) slow++
    }
    if (frames === 80) {
      if (slow > 44 && quality > 0.6) {
        quality = Math.max(0.6, quality - 0.2)
        width = 0
        resize()
      }
      frames = 0
      slow = 0
    }

    const target = options.progress()
    if (at < 0) at = target
    const before = at
    at += (target - at) * (1 - Math.exp(-dt * 4.5))
    if (Math.abs(target - at) < 0.0002) at = target
    const speed = Math.abs(at - before) / Math.max(dt, 1e-3)
    warp += (Math.min(1, speed * 1.5) - warp) * (1 - Math.exp(-dt * 6))
    pulse = Math.max(0, pulse - dt * 0.8)
    const warpNow = Math.min(1.6, warp + pulse * 1.6)

    // Load what is coming, a stop ahead of arrival.
    if (ready) {
      const next = Math.floor(at)
      for (let i = next; i <= Math.min(next + 2, NEEDS.length - 1); i++) NEEDS[i]?.forEach(loadMap)
      if (at > LAST_SOLAR - 2) buildGalaxies()
    }

    pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 2.5))
    pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 2.5))

    // --- camera in the solar system ------------------------------------------
    const stopFloat = Math.min(at, LAST_SOLAR)
    const i0 = Math.floor(stopFloat)
    const i1 = Math.min(i0 + 1, LAST_SOLAR)
    let pose =
      i0 === i1 ? poses[i0] : blendPose(poses[i0], poses[i1], stopFloat - i0, i0 === 1 || i0 === 7)

    // Arrival: falling toward orbit from further out, the only unscrolled move.
    const sinceReady = ready ? (now - readyAt) / 1000 : 0
    const arrival = ease(clamp(sinceReady / 5.2))
    if (at < 0.5) {
      const earth = world.positions.earth
      const off = sub(pose.position, earth)
      const stretch = 1 + (1 - arrival) * 3.2
      pose = { ...pose, position: add(earth, mul(off, stretch)) }
    }

    // Past Pluto the solar camera keeps backing away while the galaxy scene
    // fades in around it. Beyond that point only the second camera matters.
    const gal = clamp(at - LAST_SOLAR)
    const deepT = clamp(at - LAST_SOLAR - 1)
    const solarFade = 1 - smooth(0.05, 0.42, gal)

    const parallax = 0.012
    const forward = norm(pose.forward)
    const right = norm(cross(forward, pose.up))
    const up = norm(cross(right, forward))
    const tan = Math.tan((pose.fov * Math.PI) / 360)
    const shift: [number, number] = [
      pose.shift[0] - pointer.sx * parallax,
      pose.shift[1] + pointer.sy * parallax,
    ]
    const view = { forward, right, up, shift, tan }
    const aspect = width / height

    gl.bindVertexArray(emptyVao)
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fbo)
    gl.viewport(0, 0, width, height)
    gl.disable(gl.SCISSOR_TEST)
    gl.disable(gl.BLEND)

    // Sky, always, and first.
    gl.useProgram(programs.sky.p)
    setRay(programs.sky, view)
    bind(0, textures.get('stars'), programs.sky.u('uMap'))
    gl.uniform1f(programs.sky.u('uReady'), textures.has('stars') ? 1 : 0)
    gl.uniformMatrix3fv(programs.sky.u('uGal'), false, galactic)
    const skyLevel = pose.sky * (1 - smooth(0.1, 0.55, gal))
    gl.uniform1f(programs.sky.u('uSky'), skyLevel)
    fullscreen()

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    // Stars, which outlast the sky a little: they are what the galaxy grows from.
    const starsLevel = pose.sky * (1 - smooth(0.2, 0.7, gal))
    if (starsLevel > 0.002) {
      gl.useProgram(programs.stars.p)
      setRay(programs.stars, view)
      gl.uniform1f(programs.stars.u('uSky'), starsLevel)
      gl.uniform1f(programs.stars.u('uWarp'), warpNow)
      gl.uniform1f(programs.stars.u('uDpr'), height / cssH)
      gl.bindVertexArray(faintVao)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, FAINT_COUNT)
      if (catalog) {
        gl.bindVertexArray(catalog.vao)
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, catalog.count)
      }
      gl.bindVertexArray(emptyVao)
    }

    if (solarFade > 0.002) {
      // The Sun: a real angular size, so it visibly shrinks on the way out.
      const toSun = mul(pose.position, -1)
      const sunDist = len(toSun)
      gl.useProgram(programs.sun.p)
      setRay(programs.sun, view)
      gl.uniform3fv(programs.sun.u('uSun'), norm(toSun))
      gl.uniform1f(programs.sun.u('uAngular'), Math.asin(Math.min(1, 109 / sunDist)))
      gl.uniform1f(programs.sun.u('uPower'), solarFade)
      fullscreen()

      // Far to near, each scissored to its own disc so a distant planet costs
      // a few pixels and only the one filling the screen costs a full screen.
      const order: { id: string; body: Body; at: Vec3; d: number }[] = (
        Object.keys(BODIES) as BodyId[]
      ).map((id) => ({
        id,
        body: BODIES[id],
        at: world.positions[id],
        d: len(sub(world.positions[id], pose.position)),
      }))
      for (const m of moons) {
        if (m.stop !== i0 && m.stop !== i1) continue
        order.push({
          id: 'moonlet',
          body: { ...BODIES.moon, radius: m.radius, tint: m.tint, tilt: 0, spin: 0 },
          at: m.position,
          d: len(sub(m.position, pose.position)),
        })
      }
      order.sort((a, b) => b.d - a.d)
      const pixel = (2 * tan) / height
      gl.enable(gl.SCISSOR_TEST)
      for (const { id, body, at: where, d } of order) {
        const rel = sub(where, pose.position)
        const z = dot(rel, forward)
        const outer = id === 'saturn' ? 2.4 : id === 'uranus' ? 2.15 : id === 'earth' ? 1.05 : 1.14
        const reach = body.radius * outer
        const inside = d < reach * 1.6
        if (z <= 0 && !inside) continue
        let sx = 0
        let sy = 0
        let sw = width
        let sh = height
        if (!inside && z > 0) {
          const ndcX = dot(rel, right) / (z * tan * aspect) + shift[0]
          const ndcY = dot(rel, up) / (z * tan) + shift[1]
          const rN =
            (Math.tan(Math.asin(Math.min(0.999, reach / d))) / tan) *
            (1.25 + 0.4 * (ndcX * ndcX + ndcY * ndcY))
          const hw = Math.max(rN / aspect, 0) * 0.5 * width + 10
          const hh = rN * 0.5 * height + 10
          const cx = (ndcX * 0.5 + 0.5) * width
          const cy = (ndcY * 0.5 + 0.5) * height
          if (cx + hw < 0 || cx - hw > width || cy + hh < 0 || cy - hh > height) continue
          sx = Math.max(0, Math.floor(cx - hw))
          sy = Math.max(0, Math.floor(cy - hh))
          sw = Math.min(width - sx, Math.ceil(hw * 2))
          sh = Math.min(height - sy, Math.ceil(hh * 2))
        }
        gl.scissor(sx, sy, sw, sh)

        const sun = norm(mul(where, -1))
        const isNearEarth = id === 'earth' && d < 1800
        const prog = isNearEarth ? programs.earth : programs.body
        gl.useProgram(prog.p)
        setRay(prog, view)
        gl.uniform3fv(prog.u('uC'), rel)
        gl.uniform1f(prog.u('uRadius'), body.radius)
        gl.uniform3fv(prog.u('uSun'), sun)
        // Angular size of a pixel. Times the distance in radii, it is a pixel's
        // width on the body, which is what decides disc versus point of light.
        gl.uniform1f(prog.u('uPixel'), pixel)
        gl.uniform1f(prog.u('uLit'), solarFade)

        if (id === 'earth') {
          const m = bodyFrame(body.tilt, world.spin)
          gl.uniformMatrix3fv(prog.u('uM'), false, m)
          if (isNearEarth) {
            // Clouds slip slowly against the surface: enough to feel alive, not a claim.
            gl.uniformMatrix3fv(
              prog.u('uCloudM'),
              false,
              bodyFrame(body.tilt, world.spin - time * 0.0012),
            )
            bind(0, textures.get('earth-day'), prog.u('uDay'))
            bind(1, textures.get('earth-night'), prog.u('uNight'))
            bind(2, textures.get('earth-clouds'), prog.u('uClouds'))
            gl.uniform1f(
              prog.u('uReady'),
              textures.has('earth-day') && textures.has('earth-night') ? 1 : 0,
            )
            fullscreen()
            continue
          }
        } else {
          const spin = id === 'pluto' ? plutoSpin + time * 0.0004 : time * body.spin + 1.7
          gl.uniformMatrix3fv(
            prog.u('uM'),
            false,
            id === 'uranus' ? uranusFrame : bodyFrame(body.tilt, spin),
          )
        }

        const look = BODY_LOOK[id as BodyId] ?? { relief: 0, detail: 0, flat: 0.7, banded: 0 }
        const map = textures.get(id)
        bind(0, map, prog.u('uMap'))
        bind(1, textures.get('saturn-ring'), prog.u('uRing'))
        gl.uniform1f(prog.u('uHasMap'), map ? 1 : 0)
        const ringKind =
          id === 'saturn' && textures.has('saturn-ring') ? 1 : id === 'uranus' ? 2 : 0
        gl.uniform1f(prog.u('uHasRing'), ringKind > 0 ? 1 : 0)
        gl.uniform1f(prog.u('uRingKind'), ringKind)
        gl.uniform3fv(prog.u('uTint'), body.tint)
        gl.uniform3fv(prog.u('uHaze'), body.haze)
        gl.uniform1f(prog.u('uHazeAmount'), body.hazeAmount)
        gl.uniform1f(prog.u('uRelief'), look.relief)
        gl.uniform1f(prog.u('uDetail'), look.detail)
        gl.uniform1f(prog.u('uFlat'), look.flat)
        gl.uniform1f(prog.u('uBanded'), look.banded)
        fullscreen()
      }
      gl.disable(gl.SCISSOR_TEST)
    }

    // The asteroid belt, in the middle of the flight from Mars to Jupiter.
    const belt = smooth(2.1, 2.3, at) * (1 - smooth(2.7, 2.9, at))
    if (belt > 0.002) {
      gl.useProgram(programs.rock.p)
      gl.uniform2f(programs.rock.u('uRes'), width, height)
      gl.uniform1f(programs.rock.u('uTan'), tan)
      gl.uniform2f(programs.rock.u('uShift'), shift[0], shift[1])
      gl.uniform1f(programs.rock.u('uTravel'), at * 6)
      gl.uniform1f(programs.rock.u('uLevel'), belt)
      gl.uniform1f(programs.rock.u('uDpr'), height / cssH)
      const toSun = norm(mul(pose.position, -1))
      gl.uniform3f(
        programs.rock.u('uSunView'),
        dot(toSun, right),
        dot(toSun, up),
        -dot(toSun, forward),
      )
      gl.bindVertexArray(rockVao)
      gl.drawArrays(gl.POINTS, 0, ROCK_COUNT)
      gl.bindVertexArray(emptyVao)
    }

    // --- the second camera: kiloparsecs ---------------------------------------
    let lightYears = NaN
    if (gal > 0.001 && milky.vao && milky.cloud && deep.vao && deep.cloud) {
      // From inside the disc, where the Sun is, up and out; then straight away.
      const sunSpot: Vec3 = [8.2 * Math.cos(1.9), 8.2 * Math.sin(1.9), 0.02]
      const e = ease(gal)
      const pullOut = portrait ? 86 : 62
      const distance = 0.04 * Math.pow(pullOut / 0.04, e)
      const lookFrom: Vec3 = norm([
        Math.cos(1.9 + 0.55 * e),
        Math.sin(1.9 + 0.55 * e),
        0.25 + 0.95 * e,
      ])
      let eye: Vec3 = add(mul(sunSpot, 1 - e), mul(lookFrom, distance))
      let fwd: Vec3
      const towards = norm(sub([0, 0, 0], eye))
      if (e < 0.5) {
        const initial = norm(sub(mul(sunSpot, 0.2), eye))
        fwd = norm(add(mul(initial, 1 - e * 2), mul(towards, e * 2)))
      } else {
        fwd = towards
      }
      const dp = ease(deepT)
      if (deepT > 0) {
        const d = pullOut * Math.pow(16000 / pullOut, dp)
        eye = mul(norm(eye), d)
        fwd = norm(mul(eye, -1))
      }
      const gRight = norm(cross(fwd, [0, 0.35, 1]))
      const gUp = norm(cross(gRight, fwd))
      // The dense cluster at the end sits beside the words, not under them.
      const gShift: [number, number] = portrait
        ? [0, 0.32 * e * (1 - dp) + 0.44 * dp]
        : [0.38 * e * (1 - dp) + 0.82 * dp, 0.02 * e * (1 - dp) - 0.1 * dp]
      const gFov = 42 - 8 * e
      const gTan = Math.tan((gFov * Math.PI) / 360)
      const gView = { forward: fwd, right: gRight, up: gUp, shift: gShift, tan: gTan }
      const dpr = height / cssH

      lightYears = len(sub(eye, sunSpot)) * 3262

      gl.blendFunc(gl.ONE, gl.ONE)
      gl.useProgram(programs.galaxy.p)
      setRay(programs.galaxy, gView)
      gl.uniform3fv(programs.galaxy.u('uEye'), eye)
      gl.uniform1f(programs.galaxy.u('uDpr'), dpr)
      // By the deep field the Milky Way is one unresolved smudge among thousands.
      // Dim on the way out of the disc, where everything is stacked along the line of
      // sight, and dim again at the end, when it is one smudge among thousands.
      const inside = smooth(0.4, 0.97, e)
      gl.uniform1f(
        programs.galaxy.u('uBright'),
        smooth(0.02, 0.4, gal) * (0.1 + 0.85 * inside) * (1 - smooth(0.35, 0.8, deepT)),
      )
      gl.uniform1f(programs.galaxy.u('uMaxSize'), 2.4 + 70 * smooth(0.74, 1, e))
      gl.bindVertexArray(milky.vao)
      gl.drawArrays(gl.POINTS, 0, milky.cloud.count)

      const deepBright = smooth(0.06, 0.55, deepT)
      if (deepBright > 0.001) {
        gl.useProgram(programs.deep.p)
        setRay(programs.deep, gView)
        gl.uniform3fv(programs.deep.u('uEye'), eye)
        gl.uniform1f(programs.deep.u('uDpr'), dpr)
        gl.uniform1f(programs.deep.u('uBright'), deepBright * 0.85)
        gl.bindVertexArray(deep.vao)
        gl.drawArrays(gl.POINTS, 0, deep.cloud.count)
      }
      gl.bindVertexArray(emptyVao)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    }

    gl.disable(gl.BLEND)

    // --- bloom: down the chain, then back up it ---------------------------------
    gl.useProgram(programs.down.p)
    let source = scene
    chain.forEach((t, i) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo)
      gl.viewport(0, 0, t.w, t.h)
      bind(0, source.tex, programs.down.u('uTex'))
      gl.uniform2f(programs.down.u('uTexel'), 1 / t.w, 1 / t.h)
      gl.uniform1f(programs.down.u('uFirst'), i === 0 ? 1 : 0)
      fullscreen()
      source = t
    })
    gl.useProgram(programs.up.p)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)
    for (let i = chain.length - 1; i > 0; i--) {
      const from = chain[i]
      const to = chain[i - 1]
      gl.bindFramebuffer(gl.FRAMEBUFFER, to.fbo)
      gl.viewport(0, 0, to.w, to.h)
      bind(0, from.tex, programs.up.u('uTex'))
      gl.uniform2f(programs.up.u('uTexel'), 1 / to.w, 1 / to.h)
      gl.uniform1f(programs.up.u('uWeight'), 0.72)
      fullscreen()
    }
    gl.disable(gl.BLEND)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, width, height)
    gl.useProgram(programs.composite.p)
    bind(0, scene.tex, programs.composite.u('uScene'))
    bind(1, chain[0].tex, programs.composite.u('uBloom'))
    gl.uniform2f(programs.composite.u('uRes'), width, height)
    gl.uniform1f(programs.composite.u('uBloomAmount'), hdr ? 0.028 : 0)
    gl.uniform1f(programs.composite.u('uExposure'), pose.exposure * (1 - gal) + gal * 1)
    gl.uniform1f(programs.composite.u('uTime'), time)
    gl.uniform1f(programs.composite.u('uFade'), ready ? clamp(sinceReady / 1.6) : 0)
    fullscreen()

    // --- what the page needs to know --------------------------------------------
    if (now - lastTelemetry > 90) {
      lastTelemetry = now
      const earth = world.positions.earth
      options.onTelemetry({
        at,
        km: len(sub(pose.position, earth)) * 6371,
        lightYears,
      })
    }

    // Hidden from the page as soon as the camera starts to leave: past that Earth
    // shrinks away and a label floating over it is just in the way.
    const t = earthPoint(TASHKENT.lat, TASHKENT.lon, world.spin)
    const rel = sub(add(world.positions.earth, mul(t, 1.001)), pose.position)
    const z = dot(rel, forward)
    const facing = dot(t, norm(sub(pose.position, world.positions.earth))) > 0.22
    if (z > 0 && facing && arrival > 0.92 && at < 0.12) {
      const nx = dot(rel, right) / (z * tan * aspect) + shift[0]
      const ny = dot(rel, up) / (z * tan) + shift[1]
      options.onPin({ x: (nx * 0.5 + 0.5) * cssW, y: (0.5 - ny * 0.5) * cssH })
    } else {
      options.onPin(null)
    }
  }

  const onContextLost = (e: Event) => {
    e.preventDefault()
    options.onLost()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  let resizeTimer = 0
  let lastWidth = window.innerWidth
  const onResize = () => {
    // A phone's address bar sliding away reports as a resize, once per scroll. Rebuilding
    // every buffer for that hitches the page and jumps the planet, so a finger only
    // counts a change of width. The canvas is sized to the largest viewport to match.
    if (coarse && window.innerWidth === lastWidth) return
    lastWidth = window.innerWidth
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      width = 0
      resize()
    }, 120)
  }
  window.addEventListener('resize', onResize, { passive: true })

  resize()
  NEEDS[0].forEach(loadMap)
  last = performance.now()
  raf = requestAnimationFrame(render)

  return {
    pulse: () => {
      pulse = 1
    },
    dispose: () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointer)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      textures.forEach((t) => gl.deleteTexture(t))
      if (scene) freeTarget(scene)
      chain.forEach(freeTarget)
    },
  }
}
