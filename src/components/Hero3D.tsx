import { Suspense, useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Points, PointMaterial, Line } from '@react-three/drei'
import * as THREE from 'three'

const SIGNAL = '#5EEAD4'
const SIGNAL_BRIGHT = '#99F6E4'
const PULSE = '#A78BFA'

/**
 * The wireframe core: a slowly rotating icosahedral shell with a
 * counter-rotating inner solid, lit from within. Reads as "systems
 * architecture" without tipping into screensaver territory.
 */
function CoreMesh({
  pointer,
}: {
  pointer: React.MutableRefObject<{ x: number; y: number }>
}) {
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Mesh>(null)
  const glow = useRef<THREE.Mesh>(null)

  const shell = useMemo(() => new THREE.IcosahedronGeometry(1.6, 1), [])
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
      group.current.rotation.y += step * 0.12
      // Damped follow rather than a hard set: the core leans toward the
      // cursor and eases back instead of snapping to it.
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        pointer.current.y * 0.28,
        0.045,
      )
      group.current.rotation.z = THREE.MathUtils.lerp(
        group.current.rotation.z,
        pointer.current.x * 0.16,
        0.045,
      )
      // Slow breathing scale keeps it alive when the pointer is still.
      const breathe = 1 + Math.sin(elapsed * 0.6) * 0.02
      group.current.scale.setScalar(breathe)
    }

    if (inner.current) {
      inner.current.rotation.y -= step * 0.22
      inner.current.rotation.x += step * 0.09
    }

    if (glow.current) {
      const pulse = 1 + Math.sin(elapsed * 1.1) * 0.06
      glow.current.scale.setScalar(pulse)
      const material = glow.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.07 + Math.sin(elapsed * 1.1) * 0.025
    }
  })

  return (
    <group ref={group}>
      {/* Soft volumetric halo behind the core. */}
      <mesh ref={glow}>
        <sphereGeometry args={[1.9, 32, 32]} />
        <meshBasicMaterial
          color={SIGNAL}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer wireframe shell */}
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={SIGNAL} transparent opacity={0.6} />
      </lineSegments>

      {/* Nodes at vertices */}
      <points geometry={shell}>
        <PointMaterial
          color={SIGNAL_BRIGHT}
          size={0.05}
          sizeAttenuation
          transparent
          opacity={0.95}
        />
      </points>

      {/* Inner counter-rotating core */}
      <mesh ref={inner}>
        <icosahedronGeometry args={[0.78, 0]} />
        <meshBasicMaterial color={PULSE} wireframe transparent opacity={0.55} />
      </mesh>

      {/* Solid centre so the middle doesn't read as hollow */}
      <mesh>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshBasicMaterial color={SIGNAL_BRIGHT} transparent opacity={0.22} />
      </mesh>
    </group>
  )
}

/**
 * Satellites tracing the orbit rings. Small moving points give the eye
 * something to follow and make the whole composition feel like a system
 * rather than a static prop.
 */
function Satellites() {
  const group = useRef<THREE.Group>(null)

  const orbits = useMemo(
    () => [
      { radius: 2.6, speed: 0.32, offset: 0, color: SIGNAL },
      { radius: 2.6, speed: 0.32, offset: Math.PI, color: SIGNAL },
      { radius: 3.2, speed: -0.22, offset: Math.PI / 2, color: PULSE },
    ],
    [],
  )

  useFrame((state) => {
    if (!group.current) return
    const elapsed = state.clock.elapsedTime

    group.current.children.forEach((child, i) => {
      const orbit = orbits[i]
      const angle = elapsed * orbit.speed + orbit.offset
      child.position.set(
        Math.cos(angle) * orbit.radius,
        0,
        Math.sin(angle) * orbit.radius,
      )
    })
  })

  return (
    <group ref={group} rotation={[0.4, 0, 0.15]}>
      {orbits.map((orbit, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color={orbit.color} />
        </mesh>
      ))}
    </group>
  )
}

/** Ambient drifting particle field for depth. */
function ParticleField() {
  const ref = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const count = 380
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 4
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += Math.min(delta, 0.05) * 0.022
      ref.current.rotation.x += Math.min(delta, 0.05) * 0.008
    }
  })

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        color="#2DD4BF"
        size={0.016}
        sizeAttenuation
        transparent
        opacity={0.45}
      />
    </Points>
  )
}

/** Static orbit rings for a "systems diagram" feel. */
function OrbitRings() {
  const rings = useMemo(() => {
    const build = (radius: number, segments = 128) => {
      const pts: [number, number, number][] = []
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2
        pts.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius])
      }
      return pts
    }
    return [
      { points: build(2.6), color: SIGNAL },
      { points: build(3.2), color: PULSE },
      { points: build(3.9), color: SIGNAL },
    ]
  }, [])

  return (
    <group rotation={[0.4, 0, 0.15]}>
      {rings.map((ring, i) => (
        <Line
          key={i}
          points={ring.points}
          color={ring.color}
          transparent
          opacity={0.2 - i * 0.05}
          lineWidth={1}
        />
      ))}
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
      0.06,
    )
    pointer.current.y = THREE.MathUtils.lerp(
      pointer.current.y,
      state.pointer.y,
      0.06,
    )
  })

  // Scale the whole rig down on narrow viewports so it never crops.
  const scale = Math.min(1, viewport.width / 9)

  return (
    <group scale={scale}>
      <ambientLight intensity={0.6} />
      <CoreMesh pointer={pointer} />
      <Satellites />
      <ParticleField />
      <OrbitRings />
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
        // Cap DPR: retina panels would otherwise render 4x the pixels for a
        // background decoration.
        dpr={[1, 1.75]}
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
