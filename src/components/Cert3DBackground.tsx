import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useCanSupport3D } from '../lib/useCanSupport3D'

function FloatingCoreMesh() {
  const meshRef = useRef<THREE.Mesh>(null!)
  const wireframeRef = useRef<THREE.Mesh>(null!)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2
      meshRef.current.rotation.y += delta * 0.3
    }
    if (wireframeRef.current) {
      wireframeRef.current.rotation.x -= delta * 0.15
      wireframeRef.current.rotation.y -= delta * 0.25
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.8} floatIntensity={1.2}>
      <group scale={1.8}>
        {/* Inner distorted solid core */}
        <mesh ref={meshRef}>
          <octahedronGeometry args={[1.2, 2]} />
          <MeshDistortMaterial
            color="#5EEAD4"
            emissive="#14b8a6"
            emissiveIntensity={0.3}
            roughness={0.2}
            metalness={0.8}
            distort={0.3}
            speed={2}
            wireframe={false}
            transparent
            opacity={0.35}
          />
        </mesh>

        {/* Outer wireframe shield */}
        <mesh ref={wireframeRef}>
          <icosahedronGeometry args={[1.6, 1]} />
          <meshBasicMaterial
            color="#A78BFA"
            wireframe
            transparent
            opacity={0.25}
          />
        </mesh>
      </group>
    </Float>
  )
}

export default function Cert3DBackground() {
  const canSupport3D = useCanSupport3D()

  if (!canSupport3D) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#5EEAD4" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#A78BFA" />
        <FloatingCoreMesh />
      </Canvas>
    </div>
  )
}
