import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { isCompact } from '../lib/env'
import { warp } from '../lib/warp'

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uFall;
  uniform float uDepth;
  uniform float uSpan;
  uniform float uPixelRatio;
  uniform vec2 uParallax;

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

    // Two fades, and both matter. Far flakes sink into the black instead of
    // ending on a hard plane; near ones dissolve before perspective blows
    // them up into a grey disc a couple of hundred pixels across.
    float far = smoothstep(uDepth, uDepth * 0.5, -z);
    float near = smoothstep(0.0, uDepth * 0.1, -z);
    float twinkle = 0.55 + 0.45 * sin(uTime * 1.4 + aPhase);

    vAlpha = far * near * twinkle;
    gl_PointSize = aSize * uPixelRatio * (240.0 / max(-view.z, 1.0));
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

const DEPTH = 900
const SPAN = 520
const BASE_SPEED = 5.5
const WARP_SPEED = 150

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
      uParallax: { value: new THREE.Vector2(0, 0) },
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

    // Pointer position lives in a local, never in React state: this fires on
    // every mousemove, and a state write would re-run the effect and re-seed
    // the entire field dozens of times a second.
    const target = new THREE.Vector2(0, 0)
    const onPointerMove = (event: PointerEvent) => {
      target.set(
        (event.clientX / window.innerWidth - 0.5) * 40,
        -(event.clientY / window.innerHeight - 0.5) * 40,
      )
    }
    if (!compact) window.addEventListener('pointermove', onPointerMove, { passive: true })

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      uniforms.uPixelRatio.value = renderer.getPixelRatio()
    }
    window.addEventListener('resize', onResize)

    const clock = new THREE.Clock()

    const frame = () => {
      const delta = Math.min(clock.getDelta(), 0.05)
      // One eased number turns a page change into a surge through the field.
      // `warp.value` is driven by a tween in lib/warp.
      const rush = warp.value * warp.value
      uniforms.uTime.value += delta * (BASE_SPEED + WARP_SPEED * rush)
      uniforms.uFall.value += delta * (14 + 90 * rush)
      uniforms.uParallax.value.lerp(target, 0.04)
      renderer.render(scene, camera)
    }

    renderer.setAnimationLoop(frame)

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
      renderer.setAnimationLoop(null)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={host} className="snow-gl" aria-hidden="true" />
}
