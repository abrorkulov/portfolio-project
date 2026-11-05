/**
 * The name, in raw WebGL2.
 *
 * Solid letters on black, with a screen of hex under them. A low-resolution
 * feedback buffer remembers where the pointer has been, and every character
 * cell decides from that buffer whether to show the solid letter or the bytes
 * underneath it. Sampling at the cell centre is what makes the edge break up
 * character by character rather than fade like a soft brush.
 *
 * No three.js: this is two small shaders and a quad, and leaving a 118 kB
 * renderer out is most of why the first paint is as light as it is.
 */

const VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const NOISE = `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}`

/** One channel of "how recently was the pointer here", decaying every frame. */
const TRAIL = `#version 300 es
precision highp float;
uniform sampler2D uPrev;
uniform vec2 uRes;
uniform vec2 uA;
uniform vec2 uB;
uniform float uRadius;
uniform float uStrength;
uniform float uDecay;
uniform vec3 uShock;
uniform float uTime;
out vec4 color;
${NOISE}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  // A slow curl, so a stroke drifts and frays instead of shrinking in place.
  vec2 curl = vec2(noise(uv * 6.0 + uTime * 0.2), noise(uv * 6.0 - uTime * 0.17)) - 0.5;
  float prev = texture(uPrev, uv - vec2(0.0, 0.0009) + curl * 0.0022).r;
  prev = max(prev * uDecay - 0.0022, 0.0);

  vec2 p = gl_FragCoord.xy;
  vec2 ab = uB - uA;
  float h = clamp(dot(p - uA, ab) / max(dot(ab, ab), 1e-3), 0.0, 1.0);
  float d = length(p - uA - ab * h);
  float brush = smoothstep(uRadius, uRadius * 0.25, d) * uStrength;

  float ring = 0.0;
  if (uShock.z < 1.0) {
    float r = uShock.z * length(uRes) * 0.8;
    float width = uRes.y * 0.035;
    ring = smoothstep(width, 0.0, abs(length(p - uShock.xy) - r)) * (1.0 - uShock.z);
  }
  color = vec4(max(prev, max(brush, ring)), 0.0, 0.0, 1.0);
}`

const MAIN = `#version 300 es
precision highp float;
uniform sampler2D uMask;
uniform sampler2D uAtlas;
uniform sampler2D uTrail;
uniform sampler2D uBytes;
uniform vec2 uRes;
uniform float uCell;
uniform float uLod;
uniform float uTime;
uniform float uIntro;
uniform float uScroll;
uniform int uLen;
out vec4 color;
${NOISE}

const vec3 BASE = vec3(0.0196);
const vec3 BONE = vec3(0.925, 0.906, 0.863);
const vec3 EMBER = vec3(1.0, 0.29, 0.11);

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 cs = vec2(uCell, floor(uCell * 1.7));
  vec2 cell = floor(px / cs);
  vec2 f = fract(px / cs);
  vec2 centre = (cell + 0.5) * cs / uRes;
  float j = hash(cell * 0.77);

  // On the way down the columns let go at their own rates. The drop snaps to
  // whole rows so the glyphs stay on the grid while the letters run off it.
  float colRate = 0.3 + hash(vec2(cell.x, 3.1)) * 1.5;
  float fall = floor(uScroll * uScroll * colRate * uRes.y / cs.y) * cs.y;
  vec2 fallen = px - vec2(0.0, fall);
  vec2 fallenCentre = (floor(fallen / cs) + 0.5) * cs / uRes;

  float trail = texture(uTrail, vec2(centre.x, 1.0 - centre.y)).r;
  float intro = 1.0 - smoothstep(0.0, 0.16, uIntro * 1.2 - (centre.x * 0.72 + j * 0.28));
  float scrolled = smoothstep(0.0, 0.3, uScroll * 2.6 - (centre.y * 0.55 + j * 0.3));
  float reveal = max(max(trail * 1.3, intro), scrolled);
  float on = smoothstep(0.42, 0.5, reveal + (j - 0.5) * 0.2);
  // The band where a cell has only just let go runs hot.
  float hot = on * (1.0 - smoothstep(0.5, 0.86, reveal));

  // A hex dump: two digits and a gap, reading the real bytes of the sentence.
  float glyph = 0.0;
  int col = int(cell.x);
  int m = col % 3;
  if (m < 2) {
    int index = (col / 3 + int(cell.y) * 37) % uLen;
    int byteValue = int(texelFetch(uBytes, ivec2(index, 0), 0).r * 255.0 + 0.5);
    int nib = m == 0 ? byteValue >> 4 : byteValue & 15;
    float tick = floor(uTime * (0.6 + j * 2.5));
    if (hash(cell + tick * 0.37) > 0.975) nib = int(hash(cell.yx + tick) * 15.99);
    glyph = textureLod(uAtlas, vec2((float(nib) + f.x) / 16.0, f.y), uLod).r;
  }

  vec2 suv = px / uRes;
  float fine = texture(uTrail, vec2(suv.x, 1.0 - suv.y)).r;
  // Where the stroke is thinning an ember copy slips out from behind the letter.
  // The site has one accent, and a red-green-blue split would bring in three.
  float split = fine * (1.0 - fine) * 4.0 * uCell * 0.8 / uRes.x;
  float solid = texture(uMask, suv).r;
  float ghost = texture(uMask, suv + vec2(split, 0.0)).r;
  float inLetter = texture(uMask, fallenCentre).r;

  float wave = smoothstep(0.56, 0.86, noise(suv * vec2(3.2, 5.0) + vec2(uTime * 0.035, -uTime * 0.05)));
  float field = glyph * (0.03 + wave * 0.1 + trail * 0.5);
  vec3 back = BONE * field;

  vec3 asBytes = mix(BONE, EMBER, hot) * glyph * inLetter + BONE * 0.05 * inLetter + back * (1.0 - inLetter);
  float rim = max(ghost - solid, 0.0);
  vec3 asSolid = back * (1.0 - max(solid, rim)) + EMBER * rim + BONE * solid;
  vec3 c = mix(asSolid, asBytes, on);

  // Everything is gone by the end of the hero, so the section under it can
  // arrive on plain black with no seam.
  c *= 1.0 - smoothstep(0.72, 1.0, uScroll);

  // A breath of grain, or the black bands on a cheap panel.
  float grain = (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.006;
  color = vec4(BASE + c + grain, 1.0);
}`

export type HeroGL = {
  /** Re-rasterise the letters. Call after anything moves them. */
  layout: () => void
  setScroll: (value: number) => void
  setVisible: (visible: boolean) => void
  dispose: () => void
}

type Line = { el: HTMLElement; text: string }

function shader(gl: WebGL2RenderingContext, type: number, source: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, source)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) ?? 'shader failed')
  }
  return s
}

function program(gl: WebGL2RenderingContext, fragment: string) {
  const p = gl.createProgram()!
  gl.attachShader(p, shader(gl, gl.VERTEX_SHADER, VERT))
  gl.attachShader(p, shader(gl, gl.FRAGMENT_SHADER, fragment))
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) ?? 'link failed')
  }
  const cache = new Map<string, WebGLUniformLocation | null>()
  return {
    p,
    u: (name: string) => {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(p, name))
      return cache.get(name)!
    },
  }
}

function texture(gl: WebGL2RenderingContext, filter: number, wrap = gl.CLAMP_TO_EDGE) {
  const t = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, t)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter === gl.NEAREST ? gl.NEAREST : gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap)
  return t
}

const ATLAS_W = 48
const ATLAS_H = 82

function drawAtlas() {
  const c = document.createElement('canvas')
  c.width = ATLAS_W * 16
  c.height = ATLAS_H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.fillStyle = '#fff'
  ctx.font = '400 56px "Martian Mono", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  '0123456789ABCDEF'.split('').forEach((ch, i) => {
    ctx.fillText(ch, ATLAS_W * i + ATLAS_W / 2, ATLAS_H / 2 + 2)
  })
  return c
}

export function createHeroGL(
  canvas: HTMLCanvasElement,
  lines: () => Line[],
  bytes: string,
  onLost: () => void,
): HeroGL | null {
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
  })
  if (!gl) return null

  const main = program(gl, MAIN)
  const trailProgram = program(gl, TRAIL)
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  const coarse = window.matchMedia('(pointer: coarse)').matches
  let dprCap = coarse ? 1.25 : 1.5
  let width = 0
  let height = 0
  let dpr = 1
  let cell = 10

  // --- static textures ---------------------------------------------------
  const maskTex = texture(gl, gl.LINEAR)
  const maskCanvas = document.createElement('canvas')

  const atlasTex = texture(gl, gl.LINEAR_MIPMAP_LINEAR)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, drawAtlas())
  gl.generateMipmap(gl.TEXTURE_2D)

  const data = new TextEncoder().encode(bytes)
  const bytesTex = texture(gl, gl.NEAREST)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, data.length, 1, 0, gl.RED, gl.UNSIGNED_BYTE, data)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4)

  // --- feedback buffers --------------------------------------------------
  type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer }
  let trails: [Target, Target] | null = null
  let trailW = 0
  let trailH = 0

  const makeTarget = (): Target => {
    const tex = texture(gl, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, trailW, trailH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    const fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    return { tex, fbo }
  }

  const freeTrails = () => {
    if (!trails) return
    for (const t of trails) {
      gl.deleteTexture(t.tex)
      gl.deleteFramebuffer(t.fbo)
    }
    trails = null
  }

  // --- pointer -----------------------------------------------------------
  const pointer = { x: -1, y: -1, lastX: -1, lastY: -1, moved: -1e9 }
  let shock = { x: 0, y: 0, born: -1e9 }

  const toLocal = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top, height: rect.height }
  }
  const onMove = (event: PointerEvent) => {
    const p = toLocal(event.clientX, event.clientY)
    if (p.y < 0 || p.y > p.height) return
    pointer.x = p.x
    pointer.y = p.y
    pointer.moved = performance.now()
  }
  const onDown = (event: PointerEvent) => {
    const p = toLocal(event.clientX, event.clientY)
    if (p.y < 0 || p.y > p.height) return
    shock = { x: p.x, y: p.y, born: performance.now() }
    onMove(event)
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerdown', onDown, { passive: true })

  // --- layout ------------------------------------------------------------
  const rasterise = () => {
    const ctx = maskCanvas.getContext('2d')!
    maskCanvas.width = width
    maskCanvas.height = height
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#fff'
    ctx.textBaseline = 'alphabetic'
    const origin = canvas.getBoundingClientRect()
    for (const line of lines()) {
      const size = parseFloat(getComputedStyle(line.el).fontSize) * dpr
      // The keyword form is the only way to reach the width axis from a canvas.
      ctx.font = `900 extra-condensed ${size}px Archivo, Impact, sans-serif`
      const rect = line.el.getBoundingClientRect()
      const m = ctx.measureText(line.text)
      const middle = (rect.top + rect.height / 2 - origin.top) * dpr
      const baseline = middle + (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2
      ctx.fillText(line.text, (rect.left - origin.left) * dpr, baseline)
    }
    gl.bindTexture(gl.TEXTURE_2D, maskTex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maskCanvas)
  }

  const layout = () => {
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    dpr = Math.min(window.devicePixelRatio || 1, dprCap)
    width = Math.round(rect.width * dpr)
    height = Math.round(rect.height * dpr)
    canvas.width = width
    canvas.height = height
    cell = Math.round((rect.width < 720 ? 8 : 10) * dpr)

    freeTrails()
    trailW = Math.max(64, Math.round(width / 5))
    trailH = Math.max(64, Math.round(height / 5))
    trails = [makeTarget(), makeTarget()]
    rasterise()
  }

  // --- frame -------------------------------------------------------------
  let raf = 0
  let visible = true
  let scroll = 0
  let disposed = false
  const start = performance.now()
  let last = start
  let slowFrames = 0
  let countedFrames = 0

  const frame = (now: number) => {
    raf = 0
    if (disposed || !visible || document.hidden || !trails) return
    raf = requestAnimationFrame(frame)
    const dt = Math.min(now - last, 100)
    last = now
    const time = (now - start) / 1000

    // A machine that cannot hold the frame rate loses pixels before it loses
    // the effect. Once, not continuously, so the picture never pulses.
    countedFrames++
    if (dt > 30) slowFrames++
    if (countedFrames === 90) {
      if (slowFrames > 45 && dprCap > 1) {
        dprCap = 1
        layout()
      }
      countedFrames = 0
      slowFrames = 0
    }

    // Until someone touches it the name shows what it does by itself, so the
    // effect is found on a phone, and by anyone who never moves the mouse.
    let px = pointer.x
    let py = pointer.y
    let strength = 1
    const rect = { w: width / dpr, h: height / dpr }
    if (now - pointer.moved > 2600) {
      if (time < 2.4) strength = 0
      else {
        px = rect.w * (0.5 + 0.42 * Math.sin(time * 0.43))
        py = rect.h * (0.68 + 0.2 * Math.sin(time * 0.71 + 1.3))
        strength = 0.85
      }
    }
    if (pointer.lastX < 0) {
      pointer.lastX = px
      pointer.lastY = py
    }

    const scale = dpr * (trailW / width)
    const [read, write] = trails

    gl.useProgram(trailProgram.p)
    gl.bindFramebuffer(gl.FRAMEBUFFER, write.fbo)
    gl.viewport(0, 0, trailW, trailH)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, read.tex)
    gl.uniform1i(trailProgram.u('uPrev'), 0)
    gl.uniform2f(trailProgram.u('uRes'), trailW, trailH)
    gl.uniform2f(trailProgram.u('uA'), pointer.lastX * scale, trailH - pointer.lastY * scale)
    gl.uniform2f(trailProgram.u('uB'), px * scale, trailH - py * scale)
    gl.uniform1f(trailProgram.u('uRadius'), Math.min(rect.w, rect.h) * 0.13 * scale)
    gl.uniform1f(trailProgram.u('uStrength'), px < 0 ? 0 : strength)
    gl.uniform1f(trailProgram.u('uDecay'), Math.pow(0.982, dt / 16.67))
    gl.uniform1f(trailProgram.u('uTime'), time)
    const age = (now - shock.born) / 1400
    gl.uniform3f(trailProgram.u('uShock'), shock.x * scale, trailH - shock.y * scale, Math.min(age, 1))
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    trails = [write, read]
    pointer.lastX = px
    pointer.lastY = py

    gl.useProgram(main.p)
    gl.viewport(0, 0, width, height)
    const bind = (slot: number, tex: WebGLTexture, name: string) => {
      gl.activeTexture(gl.TEXTURE0 + slot)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.uniform1i(main.u(name), slot)
    }
    bind(0, maskTex, 'uMask')
    bind(1, atlasTex, 'uAtlas')
    bind(2, write.tex, 'uTrail')
    bind(3, bytesTex, 'uBytes')
    gl.uniform2f(main.u('uRes'), width, height)
    gl.uniform1f(main.u('uCell'), cell)
    gl.uniform1f(main.u('uLod'), Math.max(0, Math.log2(ATLAS_W / cell)))
    gl.uniform1f(main.u('uTime'), time)
    // The name compiles itself from bytes on arrival, left to right.
    gl.uniform1f(main.u('uIntro'), Math.min(time / 2, 1))
    gl.uniform1f(main.u('uScroll'), scroll)
    gl.uniform1i(main.u('uLen'), data.length)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  const wake = () => {
    if (!raf && !disposed && visible && !document.hidden) {
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
  }

  const onContextLost = (event: Event) => {
    event.preventDefault()
    onLost()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)
  document.addEventListener('visibilitychange', wake)

  layout()
  wake()

  return {
    layout,
    setScroll: (value) => {
      scroll = value
    },
    setVisible: (value) => {
      visible = value
      wake()
    },
    dispose: () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      document.removeEventListener('visibilitychange', wake)
      freeTrails()
      gl.deleteTexture(maskTex)
      gl.deleteTexture(atlasTex)
      gl.deleteTexture(bytesTex)
      gl.deleteProgram(main.p)
      gl.deleteProgram(trailProgram.p)
      gl.deleteVertexArray(vao)
    },
  }
}
