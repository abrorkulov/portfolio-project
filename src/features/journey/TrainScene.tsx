import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { JourneyStep } from '@/data/content'

/**
 * The learning journey as a train you drive by scrolling.
 *
 * This replaces an isometric staircase, and the reason is worth writing down:
 * the staircase was a diagram. It showed the same four facts the cards showed,
 * in a second notation, and the only thing that responded to the reader was a
 * step changing colour. Nothing about it made you want to keep scrolling.
 *
 * A train is a story. The track exists before you get there and continues after
 * you leave, the scroll wheel is the throttle, and arriving somewhere is an
 * event — the platform lights come up, the sign brightens, the carriage settles.
 * That is the difference between a chart and a journey.
 *
 * Everything here is desktop-and-WebGL only. `RouteMap` is what a phone gets:
 * the same five stations as a still diagram, with no canvas and nothing fetched.
 */

const SIGNAL = '#5EEAD4'
const PULSE = '#A78BFA'
const EMBER = '#FDBA74'

/** Half the distance between the rails. */
const GAUGE = 0.34
/** How far the platform sits from the centre line. */
const PLATFORM_OFFSET = 1.15

/**
 * The line, as control points.
 *
 * It climbs left to right (time going up) and weaves in Z so the camera sees
 * the track bend rather than a flat ribbon — a straight line read as a ruler in
 * early drafts and gave the scene no depth at all.
 */
const CONTROL_POINTS: [number, number, number][] = [
  [-7.2, -1.5, 0.9],
  [-3.6, -0.75, -1.0],
  [0, 0.05, 0.9],
  [3.6, 0.85, -0.9],
  [7.2, 1.7, 0.7],
]

type Progress = MutableRefObject<number>

/* ── station signage ───────────────────────────────────────────────────────
   Canvas textures rather than drei's <Text>: three characters on a small
   square do not justify pulling troika-three-text into the bundle.        */
function makeSignTexture(year: string, station: string, upcoming: boolean) {
  const w = 256
  const h = 128
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = upcoming ? 'rgba(253,186,116,0.10)' : 'rgba(94,234,212,0.12)'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = upcoming ? 'rgba(253,186,116,0.55)' : 'rgba(94,234,212,0.6)'
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, w - 4, h - 4)

  ctx.textAlign = 'center'
  ctx.fillStyle = upcoming ? '#FDBA74' : '#99F6E4'
  ctx.font = '700 54px "Space Grotesk", system-ui, sans-serif'
  ctx.fillText(year, w / 2, 62)

  ctx.font = '500 22px "JetBrains Mono", monospace'
  ctx.fillStyle = upcoming ? 'rgba(253,186,116,0.75)' : 'rgba(153,246,228,0.75)'
  ctx.fillText(station, w / 2, 96)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/* ── the track ─────────────────────────────────────────────────────────── */
function Track({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const { rails, sleepers } = useMemo(() => {
    const samples = 240
    const left: THREE.Vector3[] = []
    const right: THREE.Vector3[] = []
    const ties: { position: THREE.Vector3; quaternion: THREE.Quaternion }[] = []

    const up = new THREE.Vector3(0, 1, 0)
    const matrix = new THREE.Matrix4()

    for (let i = 0; i <= samples; i++) {
      const t = i / samples
      const point = curve.getPointAt(t)
      const tangent = curve.getTangentAt(t).normalize()
      // Sideways vector for this point on the line. Crossing the tangent with
      // world-up gives the rail offset without needing a full Frenet frame,
      // which on a gently curving track would only add torsion wobble.
      const side = new THREE.Vector3().crossVectors(tangent, up).normalize()

      left.push(point.clone().addScaledVector(side, GAUGE))
      right.push(point.clone().addScaledVector(side, -GAUGE))

      if (i % 6 === 0) {
        matrix.lookAt(new THREE.Vector3(0, 0, 0), tangent, up)
        ties.push({
          position: point.clone().addScaledVector(up, -0.045),
          quaternion: new THREE.Quaternion().setFromRotationMatrix(matrix),
        })
      }
    }

    const railGeometry = (points: THREE.Vector3[]) =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        samples,
        0.035,
        6,
        false,
      )

    return {
      rails: [railGeometry(left), railGeometry(right)],
      sleepers: ties,
    }
  }, [curve])

  const tieGeometry = useMemo(
    () => new THREE.BoxGeometry(0.9, 0.05, 0.16),
    [],
  )

  useEffect(
    () => () => {
      rails.forEach((geometry) => geometry.dispose())
      tieGeometry.dispose()
    },
    [rails, tieGeometry],
  )

  return (
    <group>
      {rails.map((geometry, i) => (
        <mesh key={i} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial
            color="#8fa3b8"
            roughness={0.35}
            metalness={0.85}
          />
        </mesh>
      ))}

      {/* Sleepers as individual meshes rather than instanced: forty boxes is
          well under the point where instancing pays for its own complexity. */}
      {sleepers.map((tie, i) => (
        <mesh
          key={i}
          geometry={tieGeometry}
          position={tie.position}
          quaternion={tie.quaternion}
          receiveShadow
        >
          <meshStandardMaterial color="#2a3140" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/* ── a station ─────────────────────────────────────────────────────────── */
function Station({
  step,
  curve,
  t,
  reached,
}: {
  step: JourneyStep
  curve: THREE.CatmullRomCurve3
  t: number
  reached: boolean
}) {
  const signMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const lamp = useRef<THREE.Mesh>(null)
  const platform = useRef<THREE.MeshStandardMaterial>(null)

  const texture = useMemo(
    () => makeSignTexture(step.year, step.station, Boolean(step.upcoming)),
    [step.year, step.station, step.upcoming],
  )
  useEffect(() => () => texture.dispose(), [texture])

  const { position, quaternion } = useMemo(() => {
    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t).normalize()
    const up = new THREE.Vector3(0, 1, 0)
    const side = new THREE.Vector3().crossVectors(tangent, up).normalize()
    const matrix = new THREE.Matrix4().lookAt(
      new THREE.Vector3(0, 0, 0),
      tangent,
      up,
    )
    return {
      position: point.clone().addScaledVector(side, -PLATFORM_OFFSET),
      quaternion: new THREE.Quaternion().setFromRotationMatrix(matrix),
    }
  }, [curve, t])

  const accent = step.upcoming ? EMBER : SIGNAL

  useFrame((state, delta) => {
    const damp = Math.min(delta, 0.05) * 4
    const target = reached ? 1 : 0

    if (signMaterial.current) {
      signMaterial.current.opacity = THREE.MathUtils.lerp(
        signMaterial.current.opacity,
        0.3 + target * 0.7,
        damp,
      )
    }
    if (platform.current) {
      // Low: emissive is added after lighting, so on a dark material it stops
      // being a tint and becomes the colour. At 0.12 the platforms read as
      // glowing green ramps rather than lit concrete.
      platform.current.emissiveIntensity = THREE.MathUtils.lerp(
        platform.current.emissiveIntensity,
        0.012 + target * 0.05,
        damp,
      )
    }
    if (lamp.current) {
      const material = lamp.current.material as THREE.MeshBasicMaterial
      // A lamp that has been reached breathes; one that has not is dark. It is
      // the cheapest possible "this platform is alive" signal.
      const pulse = reached
        ? 0.75 + Math.sin(state.clock.elapsedTime * 2 + t * 9) * 0.2
        : 0.12
      material.opacity = THREE.MathUtils.lerp(material.opacity, pulse, damp)
    }
  })

  return (
    <group position={position} quaternion={quaternion}>
      {/* Platform slab, running along the track. */}
      <mesh position={[0, -0.16, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.95, 0.18, 2.6]} />
        <meshStandardMaterial
          ref={platform}
          color="#333c4a"
          roughness={0.82}
          metalness={0.1}
          emissive={accent}
          emissiveIntensity={0.012}
        />
      </mesh>

      {/* Sign, standing on a post and facing the camera side. */}
      <mesh position={[0, 0.52, 0]}>
        <boxGeometry args={[0.05, 0.72, 0.05]} />
        <meshStandardMaterial color="#39424f" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.02, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.92, 0.46]} />
        <meshBasicMaterial
          ref={signMaterial}
          map={texture}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Lamp head. */}
      <mesh ref={lamp} position={[0, 1.38, 0]}>
        <sphereGeometry args={[0.075, 12, 12]} />
        <meshBasicMaterial color={accent} transparent opacity={0.12} />
      </mesh>
    </group>
  )
}

/* ── the train ─────────────────────────────────────────────────────────── */
function Train({ curve, progress }: { curve: THREE.CatmullRomCurve3; progress: Progress }) {
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const eased = useRef(0)

  useFrame((state, delta) => {
    const node = group.current
    if (!node) return
    const step = Math.min(delta, 0.05)

    // Ease toward the scroll position rather than snapping to it. Scroll input
    // is jumpy — a wheel notch is a discrete jump — and a train that teleports
    // between positions stops reading as a physical object.
    eased.current = THREE.MathUtils.lerp(
      eased.current,
      THREE.MathUtils.clamp(progress.current, 0, 1),
      step * 3.2,
    )

    // Leave a margin at both ends so the train starts *at* the first platform
    // and finishes at the last, rather than running off the end of the track.
    const t = THREE.MathUtils.clamp(0.04 + eased.current * 0.92, 0.001, 0.999)

    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t).normalize()

    node.position.copy(point)
    node.position.y += 0.11

    // The tangent is negated, and that is not a fudge.
    //
    // `Matrix4.lookAt(eye, target, up)` builds a rotation whose **-Z** axis
    // points from eye to target. The locomotive is modelled nose-forward along
    // **+Z** (headlight at z = +0.84), so feeding the raw tangent in aims its
    // -Z down the track and drives the train backwards along its own route —
    // headlight trailing, cab leading. Negating the target flips which end
    // leads without mirroring the model.
    node.quaternion.setFromRotationMatrix(
      new THREE.Matrix4().lookAt(
        new THREE.Vector3(0, 0, 0),
        tangent.clone().negate(),
        new THREE.Vector3(0, 1, 0),
      ),
    )

    // A little sway, scaled by how fast the reader is actually moving it.
    if (body.current) {
      const speed = Math.abs(progress.current - eased.current)
      body.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 7) * (0.012 + speed * 0.5)
      body.current.position.y = Math.sin(state.clock.elapsedTime * 9) * 0.006
    }
  })

  return (
    <group ref={group}>
      <group ref={body}>
        {/* Locomotive body. Rounded rather than a bare box — at this size the
            silhouette is most of what reads, and a sharp box reads as a crate. */}
        <RoundedBox args={[0.78, 0.46, 1.65]} radius={0.14} smoothness={4} castShadow>
          {/* Light enough to read as a lit object. At #161b23 the locomotive
              was a dark shape on a dark track and simply disappeared — the one
              thing in the scene the reader is meant to follow. */}
          <meshStandardMaterial
            color="#46536a"
            roughness={0.3}
            metalness={0.78}
          />
        </RoundedBox>

        {/* Cab, set back and slightly narrower. */}
        <RoundedBox
          args={[0.6, 0.34, 0.62]}
          radius={0.1}
          smoothness={4}
          position={[0, 0.33, -0.36]}
          castShadow
        >
          <meshStandardMaterial color="#596882" roughness={0.36} metalness={0.66} />
        </RoundedBox>

        {/* Window bands, emissive so the carriage looks occupied. */}
        <mesh position={[0, 0.1, 0.2]}>
          <boxGeometry args={[0.8, 0.12, 1.0]} />
          <meshBasicMaterial color={SIGNAL} transparent opacity={0.5} />
        </mesh>

        {/* Accent stripe along the flank. */}
        <mesh position={[0, -0.13, 0.1]}>
          <boxGeometry args={[0.8, 0.045, 1.3]} />
          <meshBasicMaterial color={PULSE} transparent opacity={0.62} />
        </mesh>

        {/* Headlight: a bright lens plus a short cone of light in front of it,
            which is what actually makes the direction of travel readable. */}
        <mesh position={[0, 0.02, 0.84]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshBasicMaterial color="#FFF7E6" />
        </mesh>
        <mesh position={[0, 0.02, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.32, 1.3, 16, 1, true]} />
          <meshBasicMaterial
            color="#FFE9C2"
            transparent
            opacity={0.09}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Under-glow, so the train sits in light rather than on top of it. */}
        <pointLight
          position={[0, -0.1, 0.3]}
          intensity={1.8}
          distance={3}
          color={SIGNAL}
        />
      </group>
    </group>
  )
}

/* ── scene ─────────────────────────────────────────────────────────────── */
function Scene({
  steps,
  active,
  progress,
}: {
  steps: readonly JourneyStep[]
  active: number
  progress: Progress
}) {
  const { viewport, camera } = useThree()

  const curve = useMemo(() => {
    const points = CONTROL_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z))
    const c = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4)
    return c
  }, [])

  /** Where each station sits along the curve, matched to the control points. */
  const stationT = useMemo(
    () => steps.map((_, i) => (i / (steps.length - 1)) * 0.92 + 0.04),
    [steps],
  )

  const scale = Math.min(1, viewport.width / 8.6)

  const focus = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05)
    const t = THREE.MathUtils.clamp(0.04 + progress.current * 0.92, 0, 1)

    // Scaled, because the camera lives *outside* the scaled group. Aiming at
    // raw curve coordinates pointed it at where the train would have been at
    // scale 1, which is subtly but permanently off-centre at any other scale.
    const point = curve.getPointAt(t).multiplyScalar(scale)

    // The camera travels with the train rather than watching the whole line
    // from one fixed seat, and it tracks x one-to-one so the locomotive stays
    // centred with track visible ahead of and behind it.
    focus.current.lerp(point, step * 2.4)
    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      focus.current.x,
      step * 2.4,
    )
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      focus.current.y + 2.15,
      step * 2.4,
    )
    camera.lookAt(focus.current.x, focus.current.y + 0.1, focus.current.z)
  })

  return (
    <group scale={scale}>
      <Track curve={curve} />

      {steps.map((step, i) => (
        <Station
          key={`${step.year}-${step.station}`}
          step={step}
          curve={curve}
          t={stationT[i]}
          reached={i <= active}
        />
      ))}

      <Train curve={curve} progress={progress} />

      {/* White key light does the modelling and casts the shadows; the tinted
          lights are rim accents only. Two strong coloured lights close in turn
          a dark scene into coloured plastic. */}
      <directionalLight
        position={[5, 10, 6]}
        intensity={2.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#7c8ba0', '#0a0c10', 0.7]} />
      <pointLight position={[-8, 3, 6]} intensity={6} color={PULSE} distance={18} />
      <pointLight position={[8, 1, 5]} intensity={2.6} color={SIGNAL} distance={18} />
    </group>
  )
}

export default function TrainScene({
  steps,
  active,
  progress,
}: {
  steps: readonly JourneyStep[]
  active: number
  progress: Progress
}) {
  const wrapper = useRef<HTMLDivElement>(null)
  // Starts enabled, matching the hero: mounting at `frameloop="never"` leaves
  // an empty canvas until the observer's first callback lands.
  const [onScreen, setOnScreen] = useState(true)

  useEffect(() => {
    const element = wrapper.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: '250px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={wrapper} className="aspect-[4/3] w-full" aria-hidden="true">
      <Canvas
        shadows
        camera={{ position: [0, 2.5, 8.2], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        frameloop={onScreen ? 'always' : 'never'}
      >
        <Suspense fallback={null}>
          <Scene steps={steps} active={active} progress={progress} />
        </Suspense>
      </Canvas>
    </div>
  )
}
