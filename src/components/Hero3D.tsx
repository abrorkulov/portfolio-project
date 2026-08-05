import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Line } from '@react-three/drei'
import * as THREE from 'three'

/**
 * CoreMesh — an icosahedral "network core" that represents systems
 * architecture: a wireframe shell of nodes and edges, slowly rotating,
 * with a secondary particle shell drifting around it. Reacts gently to
 * pointer movement to feel alive without being distracting.
 */
function CoreMesh() {
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Mesh>(null)
  const pointer = useRef({ x: 0, y: 0 })

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1.6, 1), [])
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry])

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.12
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        pointer.current.y * 0.25,
        0.04,
      )
      group.current.rotation.z = THREE.MathUtils.lerp(
        group.current.rotation.z,
        pointer.current.x * 0.15,
        0.04,
      )
    }
    if (inner.current) {
      inner.current.rotation.y -= delta * 0.2
      inner.current.rotation.x += delta * 0.08
    }

    pointer.current.x = state.pointer.x
    pointer.current.y = state.pointer.y
  })

  return (
    <group ref={group}>
      {/* Outer wireframe shell */}
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#5EEAD4" transparent opacity={0.55} />
      </lineSegments>

      {/* Nodes at vertices */}
      <points geometry={geometry}>
        <PointMaterial color="#99F6E4" size={0.045} sizeAttenuation transparent opacity={0.9} />
      </points>

      {/* Inner rotating core */}
      <mesh ref={inner}>
        <icosahedronGeometry args={[0.75, 0]} />
        <meshBasicMaterial color="#A78BFA" wireframe transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

/** Ambient drifting particle field for depth. */
function ParticleField() {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const count = 400
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
    if (ref.current) ref.current.rotation.y += delta * 0.02
  })

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial color="#2DD4BF" size={0.015} sizeAttenuation transparent opacity={0.4} />
    </Points>
  )
}

/** Static orbit rings for a "systems diagram" feel. */
function OrbitRings() {
  const ring = (radius: number, color: string, segments = 96) => {
    const pts: [number, number, number][] = []
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      pts.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius])
    }
    return <Line points={pts} color={color} transparent opacity={0.18} lineWidth={1} />
  }

  return (
    <group rotation={[0.4, 0, 0.15]}>
      {ring(2.6, '#5EEAD4')}
      {ring(3.2, '#A78BFA')}
    </group>
  )
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <CoreMesh />
          <ParticleField />
          <OrbitRings />
        </Suspense>
      </Canvas>
    </div>
  )
}
