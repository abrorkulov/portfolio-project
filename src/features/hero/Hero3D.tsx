import { Suspense, useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointMaterial, Line, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'

const SIGNAL = '#5EEAD4'
const SIGNAL_BRIGHT = '#99F6E4'
const PULSE = '#A78BFA'

/**
 * Shared per-frame state, in a ref.
 *
 * `energy` is how hard the visitor is currently moving the pointer, decayed
 * over about a second. Position alone made the core a weathervane — it leaned
 * where you pointed and did nothing else, so moving the mouse quickly and
 * moving it slowly looked identical. Energy is what makes it feel like the
 * thing is reacting to *you* rather than merely tracking a coordinate.
 *
 * A ref, never state: this is written every frame, and putting it in state
 * would re-render the whole scene graph at pointer frequency.
 */
type SceneState = React.MutableRefObject<{ x: number; y: number; energy: number }>

/**
 * A soft radial falloff, drawn once into a 128px canvas and reused by both
 * glow sprites. Painting it here rather than shipping a PNG keeps it out of
 * the network entirely, and 128px is plenty — it is only ever seen blurred.
 */
function useGlowTexture() {
  const texture = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const half = size / 2
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.18, 'rgba(255,255,255,0.55)')
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.12)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    return new THREE.CanvasTexture(canvas)
  }, [])

  useEffect(() => () => texture?.dispose(), [texture])

  return texture
}

/**
 * The core: one wireframe icosahedron, its vertices lit, around a single
 * glowing heart.
 *
 * This used to be four nested objects — the shell, a counter-rotating inner
 * wireframe, a solid centre and a halo — inside a field of 380 drifting
 * particles, under three coplanar rings. Every piece was individually fine and
 * together they read as noise; there was no focal point because six things
 * were moving at six different speeds. What is left is one silhouette that
 * holds still enough to look at.
 */
function Core({ pointer }: { pointer: SceneState }) {
  const group = useRef<THREE.Group>(null)
  const halo = useRef<THREE.Sprite>(null)
  const glow = useGlowTexture()

  const shell = useMemo(() => new THREE.IcosahedronGeometry(1.5, 1), [])
  const edges = useMemo(() => new THREE.EdgesGeometry(shell), [shell])

  // Dispose GPU buffers on unmount — these are created outside R3F's
  // automatic lifecycle, so nothing else would free them.
  useEffect(() => {
    return () => {
      shell.dispose()
      edges.dispose()
    }
  }, [shell, edges])

  useFrame((state, delta) => {
    // Clamp delta so a backgrounded tab returning to focus doesn't jump.
    const step = Math.min(delta, 0.05)
    const elapsed = state.clock.elapsedTime

    if (group.current) {
      group.current.rotation.y += step * 0.1
      // Damped follow rather than a hard set: the core leans toward the
      // cursor and eases back instead of snapping to it.
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        pointer.current.y * 0.24,
        0.05,
      )
      group.current.rotation.z = THREE.MathUtils.lerp(
        group.current.rotation.z,
        pointer.current.x * 0.13,
        0.05,
      )
      // Slow breathing scale keeps it alive when the pointer is still, and
      // energy adds a swell on top of it when the visitor is moving.
      const breath = Math.sin(elapsed * 0.55) * 0.016
      group.current.scale.setScalar(1 + breath + pointer.current.energy * 0.07)

      // A little extra spin while the pointer is active. Small on purpose:
      // enough to notice, not enough to make the silhouette hard to read.
      group.current.rotation.y += step * pointer.current.energy * 0.5
    }

    if (halo.current) {
      const material = halo.current.material as THREE.SpriteMaterial
      material.opacity =
        0.5 + Math.sin(elapsed * 0.9) * 0.1 + pointer.current.energy * 0.35
    }
  })

  return (
    <group ref={group}>
      {/* Halo and heart are both sprites carrying a radial-gradient texture,
          not spheres.

          A sphere made of an unlit material has the same colour at every
          pixel, so no matter what you do with opacity or blending it comes out
          as a flat disc — which is exactly how the old halo and centre read:
          two grey balls, the second one sitting in the middle of the lattice
          looking like a bearing. A gradient has the falloff that makes light
          look like light, and a sprite always faces the camera, so it never
          betrays that it is geometry. */}
      <sprite ref={halo} scale={[4.4, 4.4, 1]}>
        <spriteMaterial
          map={glow}
          color={SIGNAL}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          // Transparent sprites must not write depth, or they punch holes in
          // whatever is drawn behind them depending on draw order.
          depthWrite={false}
        />
      </sprite>

      <lineSegments geometry={edges}>
        <lineBasicMaterial color={SIGNAL} transparent opacity={0.4} />
      </lineSegments>

      {/* A node at every vertex — the detail that makes it read as a lattice
          rather than as a faceted ball. */}
      <points geometry={shell}>
        <PointMaterial
          color={SIGNAL_BRIGHT}
          size={0.045}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </points>

      <sprite scale={[1.25, 1.25, 1]}>
        <spriteMaterial
          map={glow}
          color={SIGNAL_BRIGHT}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
    </group>
  )
}

/**
 * One orbit: a ring and the satellite riding it.
 *
 * Keeping both in the same tilted group is the point — the satellite inherits
 * the tilt, so it visibly travels *along* the ring. The old version put three
 * rings at one shared tilt and the satellites in a separate group, so they
 * only lined up by coincidence and drifted off the rings as they moved.
 */
function Orbit({
  radius,
  tilt,
  color,
  speed,
  satellite = 0.05,
}: {
  radius: number
  tilt: [number, number, number]
  color: string
  speed: number
  satellite?: number
}) {
  const mesh = useRef<THREE.Mesh>(null)

  const points = useMemo(() => {
    const segments = 160
    const result: [number, number, number][] = []
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      result.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius])
    }
    return result
  }, [radius])

  useFrame((state) => {
    if (!mesh.current) return
    const angle = state.clock.elapsedTime * speed
    mesh.current.position.set(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius,
    )
  })

  return (
    <group rotation={tilt}>
      <Line
        points={points}
        color={color}
        transparent
        opacity={0.2}
        lineWidth={1}
      />
      <mesh ref={mesh}>
        <sphereGeometry args={[satellite, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

/**
 * Tracks the pointer in a ref and gently re-centres when it leaves.
 * A ref, not state — this updates every frame and must never re-render React.
 */
function Scene() {
  const pointer = useRef({ x: 0, y: 0, energy: 0 })
  const previous = useRef({ x: 0, y: 0 })
  const { viewport } = useThree()

  useFrame((state, delta) => {
    const step = Math.min(delta, 0.05)

    // Raw pointer travel this frame, before the damping below smooths it away.
    const moved = Math.hypot(
      state.pointer.x - previous.current.x,
      state.pointer.y - previous.current.y,
    )
    previous.current.x = state.pointer.x
    previous.current.y = state.pointer.y

    // Charge fast, bleed off slowly, and clamp — a fast flick across the
    // canvas should not send the halo to full brightness and hold it there.
    pointer.current.energy = Math.min(
      1,
      pointer.current.energy * Math.exp(-step * 1.6) + moved * 2.2,
    )

    pointer.current.x = THREE.MathUtils.lerp(
      pointer.current.x,
      state.pointer.x,
      0.05,
    )
    pointer.current.y = THREE.MathUtils.lerp(
      pointer.current.y,
      state.pointer.y,
      0.05,
    )
  })

  // Scale the whole rig down on narrow viewports so it never crops.
  const scale = Math.min(1, viewport.width / 9)

  return (
    <group scale={scale}>
      {/* No lights: every material here is unlit (MeshBasicMaterial), so the
          ambientLight that used to sit here was contributing nothing. */}
      <Core pointer={pointer} />

      {/* Two rings, crossed. Three at a shared tilt read as a flat diagram;
          two at different angles give the composition depth. */}
      <Orbit radius={2.5} tilt={[0.42, 0, 0.14]} color={SIGNAL} speed={0.3} />
      <Orbit
        radius={3.25}
        tilt={[-0.55, 0.5, -0.3]}
        color={PULSE}
        speed={-0.2}
        satellite={0.042}
      />
    </group>
  )
}

export default function Hero3D() {
  const wrapper = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(true)

  // Resolution is negotiated with the machine rather than assumed.
  //
  // A fixed `dpr={[1, 1.5]}` asks every device for the same pixel count, which
  // is fine on the desktop GPUs this canvas is gated to and not fine on an
  // integrated chip driving a 4K panel. `PerformanceMonitor` samples the real
  // frame rate and steps the buffer down when it sags — the scene gets
  // slightly softer instead of dropping frames, which nobody notices and
  // everybody feels.
  const [dpr, setDpr] = useState(1.5)
  const decline = useCallback(() => setDpr(1), [])
  const incline = useCallback(() => setDpr(1.5), [])

  // Stop rendering entirely once the hero scrolls away. A WebGL canvas
  // painting 60fps behind five screens of content is pure battery burn.
  useEffect(() => {
    const element = wrapper.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={wrapper} className="absolute inset-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        // Cap DPR: retina panels would otherwise render four times the pixels
        // for a background decoration.
        dpr={dpr}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        frameloop={active ? 'always' : 'never'}
      >
        {/* `flipflops` gives up after two oscillations and pins the lower
            setting, so a machine sitting exactly on the threshold cannot
            thrash between resolutions for the life of the page. */}
        <PerformanceMonitor
          onDecline={decline}
          onIncline={incline}
          flipflops={2}
          onFallback={decline}
        />

        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
