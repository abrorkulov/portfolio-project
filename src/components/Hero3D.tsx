import { Suspense, useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointMaterial, Line } from '@react-three/drei'
import * as THREE from 'three'

const SIGNAL = '#5EEAD4'
const SIGNAL_BRIGHT = '#99F6E4'
const PULSE = '#A78BFA'

type Pointer = React.MutableRefObject<{ x: number; y: number }>

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
function Core({ pointer }: { pointer: Pointer }) {
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
      // Slow breathing scale keeps it alive when the pointer is still.
      group.current.scale.setScalar(1 + Math.sin(elapsed * 0.55) * 0.016)
    }

    if (halo.current) {
      const material = halo.current.material as THREE.SpriteMaterial
      material.opacity = 0.5 + Math.sin(elapsed * 0.9) * 0.1
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
  const pointer = useRef({ x: 0, y: 0 })
  const { viewport } = useThree()

  useFrame((state) => {
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
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        frameloop={active ? 'always' : 'never'}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
