import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Gamepad2,
  Zap,
  RotateCcw,
  Flag,
  Volume2,
  VolumeX,
  ChevronUp,
} from 'lucide-react'
import Panel from '@/shared/ui/Panel'

interface Obstacle {
  x: number
  width: number
  height: number
  y: number
  type: 'spike' | 'block' | 'double-spike'
  passed: boolean
}

interface TrailParticle {
  x: number
  y: number
  size: number
  life: number
  maxLife: number
}

interface BurstParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

interface SparkText {
  x: number
  y: number
  life: number
  text: string
  color: string
}

interface Theme {
  accent: string
  accent2: string
  name: string
}

const THEMES: Theme[] = [
  { accent: '#5eead4', accent2: '#a78bfa', name: 'signal' },
  { accent: '#ff8fab', accent2: '#ffd166', name: 'ember' },
  { accent: '#60a5fa', accent2: '#34d399', name: 'deep' },
  { accent: '#f472b6', accent2: '#818cf8', name: 'nova' },
]

const BG_DARK = '#09090b'
const BG_PANEL = '#101018'
const CHECKPOINT_INTERVAL = 400 // score points per theme/checkpoint tier

interface GameState {
  running: boolean
  gameOver: boolean
  score: number
  speed: number
  backgroundShift: number
  spawnTimer: number
  shake: number
  zoom: number
  combo: number
  bestCombo: number
  checkpointScore: number
  checkpointObstacles: Obstacle[]
  player: {
    x: number
    y: number
    size: number
    velocityY: number
    jumpPower: number
    onGround: boolean
    rotation: number
  }
  obstacles: Obstacle[]
  trail: TrailParticle[]
  burst: BurstParticle[]
  sparks: SparkText[]
}

export default function PacketRunner() {
  const [highScore, setHighScore] = useState(() =>
    parseInt(localStorage.getItem('packet-runner-best') || '0'),
  )
  const [attempts, setAttempts] = useState(0)
  const [displayScore, setDisplayScore] = useState(0)
  const [displayCombo, setDisplayCombo] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [hasCheckpoint, setHasCheckpoint] = useState(false)
  const [soundOn, setSoundOn] = useState(true)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  const lastTimeRef = useRef(0)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const soundOnRef = useRef(true)

  const GROUND_Y = 250
  const GRAVITY = 0.85

  const gameRef = useRef<GameState>({
    running: false,
    gameOver: false,
    score: 0,
    speed: 7,
    backgroundShift: 0,
    spawnTimer: 0,
    shake: 0,
    zoom: 0,
    combo: 0,
    bestCombo: 0,
    checkpointScore: 0,
    checkpointObstacles: [],
    player: {
      x: 100,
      y: GROUND_Y - 36,
      size: 36,
      velocityY: 0,
      jumpPower: -16.5,
      onGround: true,
      rotation: 0,
    },
    obstacles: [],
    trail: [],
    burst: [],
    sparks: [],
  })

  const playTone = (
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
  ) => {
    if (!soundOnRef.current) return
    try {
      if (!audioCtxRef.current) {
        const AudioCtor =
          window.AudioContext ??
          (
            window as typeof window & {
              webkitAudioContext?: typeof AudioContext
            }
          ).webkitAudioContext
        if (!AudioCtor) return
        audioCtxRef.current = new AudioCtor()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {
      // ignore audio errors (autoplay restrictions etc)
    }
  }

  const resetGame = useCallback((toCheckpoint = false) => {
    const g = gameRef.current
    g.running = false
    g.gameOver = false
    g.shake = 0
    g.zoom = 0
    g.combo = 0
    g.player.velocityY = 0
    g.player.onGround = true
    g.player.rotation = 0
    g.trail = []
    g.burst = []
    g.sparks = []

    if (toCheckpoint && g.checkpointScore > 0) {
      g.score = g.checkpointScore
      g.speed = Math.min(17, 7 + g.score * 0.014)
      g.obstacles = g.checkpointObstacles.map((o) => ({ ...o }))
      g.backgroundShift = g.score * 40
      g.spawnTimer = 300
      g.player.y = GROUND_Y - g.player.size
    } else {
      g.score = 0
      g.speed = 7
      g.backgroundShift = 0
      g.spawnTimer = 0
      g.obstacles = []
      g.player.y = GROUND_Y - g.player.size
    }

    setDisplayScore(Math.floor(g.score))
    setDisplayCombo(0)
    setIsGameOver(false)
  }, [])

  const startGame = useCallback(
    (fromCheckpoint = false) => {
      const g = gameRef.current
      if (g.running) return
      if (g.gameOver) resetGame(fromCheckpoint)
      g.running = true
      setAttempts((a) => a + 1)
      setIsGameOver(false)
      lastTimeRef.current = 0
      gameLoopRef.current = requestAnimationFrame(loop)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resetGame],
  )

  const jump = useCallback(() => {
    const g = gameRef.current
    if (!g.running) {
      startGame(false)
      return
    }
    if (g.player.onGround) {
      g.player.velocityY = g.player.jumpPower
      g.player.onGround = false
      g.zoom = 6
      playTone(520, 0.09, 'square')
    }
  }, [startGame])

  const placeCheckpoint = useCallback(() => {
    const g = gameRef.current
    if (!g.running) return
    g.checkpointScore = g.score
    g.checkpointObstacles = g.obstacles.map((o) => ({ ...o }))
    setHasCheckpoint(true)
    playTone(880, 0.12, 'sine')
  }, [])

  const respawnAtCheckpoint = useCallback(() => {
    startGame(true)
  }, [startGame])

  const spawnObstacle = (canvasWidth: number) => {
    const g = gameRef.current
    const roll = Math.random()
    let obstacle: Obstacle

    if (roll < 0.42) {
      obstacle = {
        x: canvasWidth + 40,
        width: 34,
        height: 34,
        y: GROUND_Y - 34,
        type: 'spike',
        passed: false,
      }
    } else if (roll < 0.68) {
      obstacle = {
        x: canvasWidth + 40,
        width: 56,
        height: 34,
        y: GROUND_Y - 34,
        type: 'double-spike',
        passed: false,
      }
    } else {
      const h = 44 + Math.random() * 20
      obstacle = {
        x: canvasWidth + 40,
        width: 38,
        height: h,
        y: GROUND_Y - h,
        type: 'block',
        passed: false,
      }
    }
    g.obstacles.push(obstacle)
  }

  const getTheme = (score: number): Theme => {
    const tier = Math.floor(score / CHECKPOINT_INTERVAL) % THEMES.length
    return THEMES[tier]
  }

  const update = (delta: number, canvasWidth: number) => {
    const g = gameRef.current
    const normalized = delta / 16.6667
    const prevScore = g.score

    g.score += normalized * 0.15
    g.speed = Math.min(17, 7 + g.score * 0.014)
    g.backgroundShift += g.speed * normalized
    g.spawnTimer -= delta
    g.zoom = Math.max(0, g.zoom - normalized * 0.6)

    // milestone chime
    if (
      Math.floor(prevScore / CHECKPOINT_INTERVAL) !==
      Math.floor(g.score / CHECKPOINT_INTERVAL)
    ) {
      playTone(660, 0.15, 'triangle')
      g.sparks.push({
        x: canvasWidth / 2,
        y: 60,
        life: 60,
        text: 'NEW ZONE',
        color: getTheme(g.score).accent,
      })
    }

    if (g.spawnTimer <= 0) {
      spawnObstacle(canvasWidth)
      const nextDelay = Math.max(480, 1150 - g.score * 4)
      g.spawnTimer = nextDelay + Math.random() * 300
    }

    g.player.velocityY += GRAVITY * normalized
    g.player.y += g.player.velocityY * normalized

    if (g.player.y >= GROUND_Y - g.player.size) {
      g.player.y = GROUND_Y - g.player.size
      g.player.velocityY = 0
      if (!g.player.onGround)
        g.player.rotation = Math.round(g.player.rotation / 90) * 90
      g.player.onGround = true
    } else {
      g.player.rotation += 6 * normalized
    }

    g.trail.push({
      x: g.player.x + g.player.size / 2,
      y: g.player.y + g.player.size / 2,
      size: g.player.size * 0.4,
      life: 18,
      maxLife: 18,
    })
    g.trail = g.trail
      .map((t) => ({ ...t, life: t.life - normalized }))
      .filter((t) => t.life > 0)

    g.obstacles.forEach((o) => {
      o.x -= g.speed * normalized
      if (!o.passed && o.x + o.width < g.player.x) {
        o.passed = true
        g.combo += 1
        g.bestCombo = Math.max(g.bestCombo, g.combo)
        if (g.combo > 0 && g.combo % 5 === 0) {
          playTone(760 + g.combo * 4, 0.1, 'triangle')
          g.sparks.push({
            x: g.player.x + 20,
            y: g.player.y - 10,
            life: 40,
            text: `${g.combo}x COMBO`,
            color: getTheme(g.score).accent2,
          })
        }
      }
    })
    g.obstacles = g.obstacles.filter((o) => o.x + o.width > -10)

    g.burst = g.burst
      .map((p) => ({
        ...p,
        x: p.x + p.vx * normalized,
        y: p.y + p.vy * normalized,
        life: p.life - normalized,
      }))
      .filter((p) => p.life > 0)

    g.sparks = g.sparks
      .map((s) => ({
        ...s,
        y: s.y - normalized * 0.4,
        life: s.life - normalized,
      }))
      .filter((s) => s.life > 0)

    g.shake = Math.max(0, g.shake - normalized * 1.2)

    const hitbox = {
      x: g.player.x + 5,
      y: g.player.y + 5,
      width: g.player.size - 10,
      height: g.player.size - 10,
    }

    const hit = g.obstacles.some(
      (o) =>
        hitbox.x < o.x + o.width &&
        hitbox.x + hitbox.width > o.x &&
        hitbox.y < o.y + o.height &&
        hitbox.y + hitbox.height > o.y,
    )

    if (hit) {
      g.running = false
      g.gameOver = true
      g.shake = 18
      g.combo = 0
      playTone(120, 0.25, 'sawtooth')
      for (let i = 0; i < 24; i++) {
        const angle = (Math.PI * 2 * i) / 24
        const theme = getTheme(g.score)
        g.burst.push({
          x: g.player.x + g.player.size / 2,
          y: g.player.y + g.player.size / 2,
          vx: Math.cos(angle) * (2 + Math.random() * 3),
          vy: Math.sin(angle) * (2 + Math.random() * 3),
          life: 30 + Math.random() * 20,
          color: i % 2 === 0 ? theme.accent : theme.accent2,
        })
      }
      const finalScore = Math.floor(g.score)
      setHighScore((prev) => {
        const next = Math.max(prev, finalScore)
        localStorage.setItem('packet-runner-best', String(next))
        return next
      })
      setDisplayScore(finalScore)
      setDisplayCombo(0)
      setIsGameOver(true)
    } else {
      setDisplayScore(Math.floor(g.score))
      setDisplayCombo(g.combo)
    }
  }

  const drawSpike = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    theme: Theme,
  ) => {
    ctx.save()
    ctx.shadowColor = theme.accent2
    ctx.shadowBlur = 10
    ctx.fillStyle = '#0c0c14'
    ctx.beginPath()
    ctx.moveTo(x, y + height)
    ctx.lineTo(x + width / 2, y)
    ctx.lineTo(x + width, y + height)
    ctx.closePath()
    ctx.fill()

    ctx.shadowBlur = 0
    ctx.strokeStyle = theme.accent2
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x + 4, y + height - 2)
    ctx.lineTo(x + width / 2, y + 6)
    ctx.lineTo(x + width - 4, y + height - 2)
    ctx.stroke()
    ctx.restore()
  }

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const g = gameRef.current
    const theme = getTheme(g.score)

    ctx.save()

    const scale = 1 + g.zoom * 0.0015
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.scale(scale, scale)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)

    if (g.shake > 0) {
      const dx = (Math.random() - 0.5) * g.shake
      const dy = (Math.random() - 0.5) * g.shake
      ctx.translate(dx, dy)
    }

    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height)
    bg.addColorStop(0, '#0d0d16')
    bg.addColorStop(0.55, BG_PANEL)
    bg.addColorStop(1, BG_DARK)
    ctx.fillStyle = bg
    ctx.fillRect(-30, -30, canvas.width + 60, canvas.height + 60)

    ctx.strokeStyle = `${theme.accent}20`
    ctx.lineWidth = 1
    for (let i = 0; i < 20; i++) {
      const x = (i * 64 - g.backgroundShift) % (canvas.width + 64)
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x - 140, canvas.height)
      ctx.stroke()
    }

    const pulse = 0.5 + Math.sin(g.backgroundShift * 0.02) * 0.5
    ctx.fillStyle = `${theme.accent2}0d`
    ctx.beginPath()
    ctx.arc(canvas.width * 0.75, 60, 90, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `${theme.accent}0d`
    ctx.beginPath()
    ctx.arc(
      canvas.width * 0.2,
      canvas.height - 40,
      100 * (0.7 + pulse * 0.3),
      0,
      Math.PI * 2,
    )
    ctx.fill()

    ctx.fillStyle = '#050507'
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y)

    ctx.strokeStyle = theme.accent
    ctx.globalAlpha = 0.5
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, GROUND_Y)
    ctx.lineTo(canvas.width, GROUND_Y)
    ctx.stroke()
    ctx.globalAlpha = 1

    ctx.fillStyle = `${theme.accent}1f`
    for (let i = 0; i < 24; i++) {
      const blockX =
        ((i * 46 - g.backgroundShift * 1.1) % (canvas.width + 46)) - 46
      ctx.fillRect(blockX, GROUND_Y + 10, 26, 4)
    }

    g.trail.forEach((t) => {
      const alpha = t.life / t.maxLife
      ctx.fillStyle = `${theme.accent}59`
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(t.x, t.y, t.size * alpha, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1

    g.obstacles.forEach((o) => {
      if (o.type === 'spike') {
        drawSpike(ctx, o.x, o.y, o.width, o.height, theme)
      } else if (o.type === 'double-spike') {
        drawSpike(ctx, o.x, o.y, o.width / 2, o.height, theme)
        drawSpike(ctx, o.x + o.width / 2, o.y, o.width / 2, o.height, theme)
      } else {
        ctx.fillStyle = '#0c0c14'
        ctx.fillRect(o.x, o.y, o.width, o.height)
        ctx.strokeStyle = theme.accent2
        ctx.lineWidth = 2
        ctx.strokeRect(o.x + 2, o.y + 2, o.width - 4, o.height - 4)
        ctx.fillStyle = `${theme.accent2}26`
        ctx.fillRect(o.x + 4, o.y + 4, o.width - 8, o.height - 8)
      }
    })

    g.burst.forEach((p) => {
      ctx.fillStyle = p.color
      ctx.globalAlpha = Math.max(0, p.life / 40)
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6)
    })
    ctx.globalAlpha = 1

    // checkpoint flag marker
    if (g.checkpointScore > 0 && g.running) {
      // nothing drawn in-world; indicated via HUD instead
    }

    if (!g.gameOver || g.burst.length > 0) {
      const { x, y, size, rotation } = g.player
      ctx.save()
      ctx.translate(x + size / 2, y + size / 2)
      ctx.rotate((rotation * Math.PI) / 180)

      ctx.shadowColor = theme.accent
      ctx.shadowBlur = 16
      ctx.fillStyle = BG_DARK
      ctx.fillRect(-size / 2, -size / 2, size, size)

      ctx.shadowBlur = 0
      ctx.strokeStyle = theme.accent
      ctx.lineWidth = 3
      ctx.strokeRect(-size / 2 + 3, -size / 2 + 3, size - 6, size - 6)

      ctx.fillStyle = theme.accent2
      const innerSize = size * 0.34
      ctx.fillRect(-innerSize / 2, -innerSize / 2, innerSize, innerSize)

      ctx.restore()
    }

    g.sparks.forEach((s) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, s.life / 40))
      ctx.fillStyle = s.color
      ctx.textAlign = 'center'
      ctx.font = '700 16px "JetBrains Mono", monospace'
      ctx.fillText(s.text, s.x, s.y)
      ctx.textAlign = 'start'
    })
    ctx.globalAlpha = 1

    if (!g.running) {
      ctx.fillStyle = 'rgba(9, 9, 11, 0.55)'
      ctx.fillRect(-30, -30, canvas.width + 60, canvas.height + 60)
      ctx.fillStyle = '#e6edf3'
      ctx.textAlign = 'center'
      ctx.font = '700 32px "Space Grotesk", sans-serif'
      ctx.fillText(
        g.gameOver ? 'SIGNAL LOST' : 'PACKET RUNNER',
        canvas.width / 2,
        canvas.height / 2 - 10,
      )
      ctx.font = '500 15px "JetBrains Mono", monospace'
      ctx.fillStyle = '#94a3b8'
      ctx.fillText(
        g.gameOver
          ? 'Press Space or click to retry'
          : 'Press Space or click to start',
        canvas.width / 2,
        canvas.height / 2 + 20,
      )
      if (g.gameOver && g.checkpointScore > 0) {
        ctx.fillStyle = theme.accent
        ctx.font = '600 13px "JetBrains Mono", monospace'
        ctx.fillText(
          'Press V to respawn at checkpoint',
          canvas.width / 2,
          canvas.height / 2 + 46,
        )
      }
      ctx.textAlign = 'start'
    }

    ctx.restore()
  }

  const loop = (timestamp: number) => {
    const g = gameRef.current
    const canvas = canvasRef.current
    if (!canvas) return

    if (!g.running) {
      draw()
      return
    }

    if (!lastTimeRef.current) lastTimeRef.current = timestamp
    const delta = Math.min(32, timestamp - lastTimeRef.current)
    lastTimeRef.current = timestamp

    update(delta, canvas.width)
    draw()

    if (g.running) {
      gameLoopRef.current = requestAnimationFrame(loop)
    } else {
      draw()
    }
  }

  useEffect(() => {
    draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    soundOnRef.current = soundOn
  }, [soundOn])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault()
        jump()
      }
      if (e.code === 'KeyC') {
        e.preventDefault()
        placeCheckpoint()
      }
      if (e.code === 'KeyV') {
        e.preventDefault()
        respawnAtCheckpoint()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [jump, placeCheckpoint, respawnAtCheckpoint])

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
    }
  }, [])

  const theme = getTheme(gameRef.current.score)

  return (
    <Panel
      icon={Gamepad2}
      title="Packet Runner"
      subtitle="Tap or press Space to jump · C checkpoint · V respawn"
      meta={
        <>
          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-ink-muted">
            <Zap className="h-3.5 w-3.5 text-signal" aria-hidden="true" />
            Best {highScore}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-ink-muted">
            <RotateCcw className="h-3.5 w-3.5 text-pulse" aria-hidden="true" />
            Try #{attempts}
          </span>
        </>
      }
      actions={
        <button
          onClick={() => setSoundOn((s) => !s)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-void-surface text-ink-muted transition-colors hover:text-signal"
          aria-label={soundOn ? 'Mute sound effects' : 'Unmute sound effects'}
          aria-pressed={soundOn}
        >
          {soundOn ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </button>
      }
    >
      {/* Live HUD. Sits above the canvas rather than floating over it — the
          old absolute overlay covered the runner itself on narrow screens. */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="inset-surface rounded-xl px-3 py-2">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            Score
          </span>
          <span className="font-mono text-sm font-semibold text-signal">
            {displayScore}
          </span>
        </div>
        <div className="inset-surface rounded-xl px-3 py-2">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            Speed
          </span>
          <span className="font-mono text-sm font-semibold text-pulse">
            {(gameRef.current.speed / 7).toFixed(1)}x
          </span>
        </div>
        <div className="inset-surface rounded-xl px-3 py-2">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            Combo
          </span>
          <span
            className="font-mono text-sm font-semibold"
            style={{ color: displayCombo > 0 ? theme.accent2 : undefined }}
          >
            {displayCombo > 0 ? `${displayCombo}x` : '—'}
          </span>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={960}
          height={320}
          // aspect-ratio keeps the drawing buffer and the CSS box in step, so
          // the game never letterboxes or stretches as the column resizes.
          className="w-full cursor-pointer rounded-xl border border-white/5 bg-void"
          style={{ aspectRatio: '3 / 1' }}
          onClick={jump}
          aria-label="Packet Runner game area. Tap or press space to jump."
        />

        {isGameOver && (
          <div className="absolute bottom-3 right-3 flex flex-wrap justify-end gap-2">
            {hasCheckpoint && (
              <button
                onClick={respawnAtCheckpoint}
                className="glow-border rounded-full bg-void-surface border border-white/10 px-5 py-2.5 font-mono text-xs text-ink-muted flex items-center gap-2 hover:text-signal transition-colors"
              >
                <Flag className="h-3.5 w-3.5" />
                Respawn (V)
              </button>
            )}
            <button
              onClick={jump}
              className="glow-border flex items-center gap-2 rounded-full border border-signal/30 bg-signal/10 px-5 py-2.5 font-mono text-xs text-signal transition-colors hover:bg-signal/20"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Touch controls. The keyboard shortcuts are unreachable on a phone, so
          every action gets a real button sized for a thumb. */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={jump}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-signal/25 bg-signal/10 px-4 font-mono text-xs text-signal transition-colors hover:bg-signal/20 sm:flex-none sm:px-6"
        >
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
          Jump
        </button>
        <button
          onClick={placeCheckpoint}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 font-mono text-xs text-ink-muted transition-colors hover:border-white/25 hover:text-ink"
          title="Place checkpoint (C)"
        >
          <Flag className="h-4 w-4" aria-hidden="true" />
          {hasCheckpoint ? 'Checkpoint set' : 'Set checkpoint'}
        </button>
        {hasCheckpoint && (
          <button
            onClick={respawnAtCheckpoint}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 font-mono text-xs text-ink-muted transition-colors hover:border-white/25 hover:text-ink"
            title="Respawn at checkpoint (V)"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Respawn
          </button>
        )}
      </div>
    </Panel>
  )
}
