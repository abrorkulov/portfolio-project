import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { isCompact } from '../lib/env'
import { hasFinePointer } from '../lib/pointer'
import { pointer, ripple, setEmitter, spark, trail } from '../lib/snowfx'
import type { Burst } from '../lib/snowfx'
import { pulseWarp, warp } from '../lib/warp'

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uFall;
  uniform float uDepth;
  uniform float uSpan;
  uniform float uPixelRatio;
  uniform float uAspect;
  uniform vec2 uParallax;
  uniform vec2 uPointer;
  uniform float uPointerOn;
  uniform vec3 uRipple;

  attribute float aSize;
  attribute float aPhase;
  attribute float aDrift;

  varying float vAlpha;

  void main() {
    // Both wraps happen on the GPU. Doing them in JavaScript would mean
    // touching ten thousand floats and re-uploading the position buffer on
    // every single frame.
    float z = mod(position.z + uTime, uDepth) - uDepth;

    // Snow, not stars: each flake falls at its own rate and sways as it goes,
    // so the field never reads as a rigid grid sliding past.
    float fall = uFall * aDrift;
    float y = mod(position.y - fall + uSpan, uSpan * 2.0) - uSpan;
    float sway = sin(uTime * 0.35 + aPhase) * 6.0;

    vec3 p = vec3(
      position.x + sway + uParallax.x * (1.0 - z / uDepth),
      y + uParallax.y * (1.0 - z / uDepth),
      z
    );

    vec4 view = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * view;

    // The field answers the hand. Both pushes are done on the screen, after
    // projection, so a flake ten metres back and one right at the glass are
    // moved by the same pointer — the near ones a little more, which is what
    // makes it read as depth rather than as a flat decal.
    float near = 1.0 - (-z / uDepth);
    vec2 ndc = gl_Position.xy / gl_Position.w;

    vec2 d = (ndc - uPointer) * vec2(uAspect, 1.0);
    float r = length(d) + 0.0001;
    float reach = smoothstep(0.34, 0.0, r) * uPointerOn;
    float push = reach * 0.15 * (0.35 + 0.65 * near);

    // One ring per tap, running outward and fading as it goes.
    vec2 dr = (ndc - uRipple.xy) * vec2(uAspect, 1.0);
    float rr = length(dr) + 0.0001;
    float age = uRipple.z;
    float ring = exp(-pow((rr - age * 1.4) * 3.5, 2.0)) * max(0.0, 1.0 - age / 1.2);

    ndc += (d / r) * push + (dr / rr) * ring * 0.26;
    gl_Position.xy = ndc * gl_Position.w;

    // Two fades, and both matter. Far flakes sink into the black instead of
    // ending on a hard plane; near ones dissolve before perspective blows
    // them up into a grey disc a couple of hundred pixels across.
    float far = smoothstep(uDepth, uDepth * 0.5, -z);
    float nearFade = smoothstep(0.0, uDepth * 0.1, -z);
    float twinkle = 0.55 + 0.45 * sin(uTime * 1.4 + aPhase);

    // The flakes the hand is moving also catch the light: the push alone is
    // easy to miss in a field this sparse, the glow is not.
    vAlpha = far * nearFade * (twinkle + reach * 1.6 + ring * 2.2);
    gl_PointSize = aSize * uPixelRatio * (240.0 / max(-view.z, 1.0)) * (1.0 + reach * 0.6);
  }
`

const FRAGMENT = /* glsl */ `
  varying float vAlpha;

  void main() {
    // A point sprite is a square. Without this it looks like one.
    float d = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.08, d);
    float core = pow(disc, 5.0);

    float alpha = (disc * 0.3 + core) * vAlpha;
    if (alpha < 0.01) discard;

    // Milky white, never pure white: the same off-white the type is set in,
    // so the snow belongs to the page rather than sitting on top of it.
    gl_FragColor = vec4(0.97, 0.96, 0.93, alpha);
  }
`

/* Flakes thrown by the page: a word coming apart, a letter landing. Each one
   is born at a moment on the field's clock and integrates its own path from
   there, so the buffer is written once per burst and never again. */
const BURST_VERTEX = /* glsl */ `
  uniform float uNow;
  uniform float uPixelRatio;
  uniform float uWarp;

  attribute vec3 aVel;
  attribute float aBorn;
  attribute float aLife;
  attribute float aSize;
  attribute float aSeed;

  varying float vAlpha;

  void main() {
    float t = uNow - aBorn;
    float k = t / aLife;

    // The sideways throw spends itself; the rush toward the camera does not,
    // so the flakes slow into snow across the screen and then keep coming
    // until they pass the glass. A little sway on top, so a burst settles
    // instead of freezing into a diagram of its own velocities.
    float ease = 1.0 - exp(-t * 2.2);
    vec3 p = position + vec3(aVel.xy * ease / 2.2, aVel.z * t);
    p.x += sin(t * 2.0 + aSeed * 6.28) * 4.0 * k;
    p.y -= 18.0 * k * k;
    // A page change pulls the burst along with the field.
    p.z += uWarp * 220.0 * t;

    vec4 view = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * view;

    float alive = step(0.0, t) * step(t, aLife);
    float nearFade = smoothstep(0.0, 40.0, -p.z);
    vAlpha = alive * nearFade * smoothstep(0.0, 0.06, k) * (1.0 - k * k);
    gl_PointSize = aSize * uPixelRatio * (240.0 / max(-view.z, 1.0));
  }
`

const DEPTH = 900
const SPAN = 520
const BASE_SPEED = 5.5
const WARP_SPEED = 150
/** The plane the page's bursts are born on. Past the near fade, close enough
    that the flakes fly by the camera within their life. */
const BURST_Z = 240
const BURST_POOL = 4096

/**
 * The snow: thousands of additive point sprites falling and drifting toward
 * the camera, each on its own phase.
 *
 * Lazy-loaded and only mounted where `canRunWebGL()` said yes, so three.js
 * never reaches a device that cannot paint it.
 */
export default function StarfieldGL() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = host.current
    if (!mount) return

    const compact = isCompact()
    const fine = hasFinePointer()
    const count = compact ? 2400 : 6000

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      })
    } catch {
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.style.display = 'block'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      64,
      window.innerWidth / window.innerHeight,
      1,
      DEPTH * 1.4,
    )

    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const drifts = new Float32Array(count)

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * SPAN * 2.6
      positions[i * 3 + 1] = (Math.random() - 0.5) * SPAN * 2
      positions[i * 3 + 2] = Math.random() * DEPTH

      // Mostly fine dust with a handful of bright flakes. A uniform size
      // makes the field read as noise rather than as weather.
      const roll = Math.random()
      sizes[i] = roll > 0.975 ? 3.2 + Math.random() * 2.4 : 0.8 + roll * 1.6
      phases[i] = Math.random() * Math.PI * 2
      drifts[i] = 0.45 + Math.random() * 1.1
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    geometry.setAttribute('aDrift', new THREE.BufferAttribute(drifts, 1))

    const uniforms = {
      uTime: { value: 0 },
      uFall: { value: 0 },
      uDepth: { value: DEPTH },
      uSpan: { value: SPAN },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uAspect: { value: camera.aspect },
      uParallax: { value: new THREE.Vector2(0, 0) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerOn: { value: 0 },
      // x, y in NDC; z is the ring's age in seconds. A huge age is no ring.
      uRipple: { value: new THREE.Vector3(0, 0, 100) },
    }

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const points = new THREE.Points(geometry, material)
    // The bounding sphere is computed from the untouched positions and the
    // shader moves every one of them, so culling would blink the whole field
    // out the moment the drift carried it past the computed radius.
    points.frustumCulled = false
    scene.add(points)

    // --- the burst pool -------------------------------------------------

    const bPos = new Float32Array(BURST_POOL * 3)
    const bVel = new Float32Array(BURST_POOL * 3)
    const bBorn = new Float32Array(BURST_POOL).fill(-100)
    const bLife = new Float32Array(BURST_POOL).fill(1)
    const bSize = new Float32Array(BURST_POOL)
    const bSeed = new Float32Array(BURST_POOL)

    const bGeometry = new THREE.BufferGeometry()
    const bAttrs = {
      position: new THREE.BufferAttribute(bPos, 3),
      aVel: new THREE.BufferAttribute(bVel, 3),
      aBorn: new THREE.BufferAttribute(bBorn, 1),
      aLife: new THREE.BufferAttribute(bLife, 1),
      aSize: new THREE.BufferAttribute(bSize, 1),
      aSeed: new THREE.BufferAttribute(bSeed, 1),
    }
    Object.entries(bAttrs).forEach(([name, attr]) => {
      attr.setUsage(THREE.DynamicDrawUsage)
      bGeometry.setAttribute(name, attr)
    })

    const bUniforms = {
      uNow: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uWarp: { value: 0 },
    }
    const bMaterial = new THREE.ShaderMaterial({
      uniforms: bUniforms,
      vertexShader: BURST_VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const bursts = new THREE.Points(bGeometry, bMaterial)
    bursts.frustumCulled = false
    scene.add(bursts)

    // The field's own clock, in seconds, unaffected by the warp. Bursts are
    // stamped with it at birth.
    let now = 0
    let cursor = 0

    // How many world units one CSS pixel covers on the burst plane. The
    // camera's vertical field of view is what fixes it; the aspect takes
    // care of x for free because the pixels are square.
    const unitsPerPx = () =>
      (2 * BURST_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / window.innerHeight

    const emit = (burst: Burst) => {
      const s = unitsPerPx()
      const w = window.innerWidth / 2
      const h = window.innerHeight / 2
      const total = burst.points.length / 2
      // A burst bigger than the pool is thinned rather than truncated, so a
      // long word still comes apart evenly instead of losing its last letters.
      const stride = Math.max(1, Math.ceil(total / BURST_POOL))
      const ox = burst.origin?.x
      const oy = burst.origin?.y

      for (let i = 0; i < total; i += stride) {
        const px = burst.points[i * 2]
        const py = burst.points[i * 2 + 1]
        const j = cursor
        cursor = (cursor + 1) % BURST_POOL

        bPos[j * 3] = (px - w) * s
        bPos[j * 3 + 1] = -(py - h) * s
        bPos[j * 3 + 2] = -BURST_Z

        const angle = Math.random() * Math.PI * 2
        const jitter = burst.jitter * Math.sqrt(Math.random())
        let vx = Math.cos(angle) * jitter
        let vy = Math.sin(angle) * jitter
        if (ox !== undefined && oy !== undefined) {
          vx += (px - ox) * burst.scatter
          vy -= (py - oy) * burst.scatter
        }
        bVel[j * 3] = vx * s
        bVel[j * 3 + 1] = vy * s
        bVel[j * 3 + 2] = burst.rush[0] + Math.random() * (burst.rush[1] - burst.rush[0])

        bBorn[j] = now
        bLife[j] = burst.life * (0.7 + Math.random() * 0.5)
        bSize[j] = burst.size[0] + Math.random() * (burst.size[1] - burst.size[0])
        bSeed[j] = Math.random()
      }
      Object.values(bAttrs).forEach((attr) => {
        attr.needsUpdate = true
      })
    }
    setEmitter(emit)

    // --- the pointer ----------------------------------------------------

    // Pointer position lives in a local, never in React state: this fires on
    // every mousemove, and a state write would re-run the effect and re-seed
    // the entire field dozens of times a second.
    const target = new THREE.Vector2(0, 0)
    let lastX = -1
    let lastY = -1
    const onPointerMove = (event: PointerEvent) => {
      target.set(
        (event.clientX / window.innerWidth - 0.5) * 40,
        -(event.clientY / window.innerHeight - 0.5) * 40,
      )
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = -((event.clientY / window.innerHeight) * 2 - 1)
      pointer.on = true
      // The wake is left only by a hand that is actually moving; a pointer
      // twitching in place would pile snow on one spot.
      if (Math.hypot(event.clientX - lastX, event.clientY - lastY) > 7) {
        lastX = event.clientX
        lastY = event.clientY
        trail(event.clientX, event.clientY)
      }
    }
    const onPointerLeave = () => {
      pointer.on = false
    }
    // A tap sends a ring through the field and knocks a few flakes loose
    // under the finger. Any pointer, including a finger.
    const onPointerDown = (event: PointerEvent) => {
      ripple.x = (event.clientX / window.innerWidth) * 2 - 1
      ripple.y = -((event.clientY / window.innerHeight) * 2 - 1)
      ripple.at = now
      spark(event.clientX, event.clientY, 18, 120)
    }
    if (fine) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', onPointerLeave)
    }
    window.addEventListener('pointerdown', onPointerDown, { passive: true })

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      uniforms.uPixelRatio.value = renderer.getPixelRatio()
      uniforms.uAspect.value = camera.aspect
      bUniforms.uPixelRatio.value = renderer.getPixelRatio()
    }
    window.addEventListener('resize', onResize)

    const clock = new THREE.Clock()

    const frame = () => {
      const delta = Math.min(clock.getDelta(), 0.05)
      now += delta
      // One eased number turns a page change into a surge through the field.
      // `warp.value` is driven by a tween in lib/warp.
      const rush = warp.value * warp.value
      uniforms.uTime.value += delta * (BASE_SPEED + WARP_SPEED * rush)
      uniforms.uFall.value += delta * (14 + 90 * rush)
      uniforms.uParallax.value.lerp(target, 0.04)

      const p = uniforms.uPointer.value
      p.x += (pointer.x - p.x) * 0.18
      p.y += (pointer.y - p.y) * 0.18
      const on = pointer.on ? 1 : 0
      uniforms.uPointerOn.value += (on - uniforms.uPointerOn.value) * 0.08
      uniforms.uRipple.value.set(ripple.x, ripple.y, ripple.at < 0 ? 100 : now - ripple.at)

      bUniforms.uNow.value = now
      bUniforms.uWarp.value = rush

      renderer.render(scene, camera)
    }

    renderer.setAnimationLoop(frame)

    // The arrival: the field rushes past the camera and settles while the
    // first word is still being written. Longer than a page change, because
    // there is nothing else on screen yet to compete with it.
    pulseWarp(2.8)

    // A hidden tab already throttles rAF, but the clock keeps running — so
    // without this the field jumps forward by however long the visitor was
    // away the moment they come back.
    const onVisibility = () => {
      if (document.hidden) {
        renderer.setAnimationLoop(null)
      } else {
        clock.getDelta()
        renderer.setAnimationLoop(frame)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      setEmitter(null)
      renderer.setAnimationLoop(null)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      geometry.dispose()
      material.dispose()
      bGeometry.dispose()
      bMaterial.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={host} className="snow-gl" aria-hidden="true" />
}
