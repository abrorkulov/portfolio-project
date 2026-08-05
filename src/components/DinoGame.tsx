import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, RotateCcw, Zap } from 'lucide-react'

interface DinoState {
  dinoY: number
  dinoVelocity: number
  obstacles: Array<{ x: number; type: 'cactus' | 'bird'; y: number; width: number; height: number }>
  isJumping: boolean
  isDucking: boolean
  gameOver: boolean
  score: number
  highScore: number
  gameSpeed: number
  frameCount: number
}

export default function DinoGame() {
  const [gameState, setGameState] = useState<DinoState>({
    dinoY: 0,
    dinoVelocity: 0,
    obstacles: [],
    isJumping: false,
    isDucking: false,
    gameOver: false,
    score: 0,
    highScore: parseInt(localStorage.getItem('dinoHighScore') || '0'),
    gameSpeed: 6,
    frameCount: 0,
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const gameLoopRef = useRef<number>()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const GRAVITY = 0.6
  const JUMP_FORCE = -12
  const GROUND_Y = 150
  const DINO_WIDTH = 40
  const DINO_HEIGHT = 44
  const DINO_DUCK_HEIGHT = 24

  const jump = useCallback(() => {
    if (!gameState.isJumping && !gameState.gameOver && isPlaying) {
      setGameState(prev => ({
        ...prev,
        dinoVelocity: JUMP_FORCE,
        isJumping: true,
        isDucking: false,
      }))
    }
  }, [gameState.isJumping, gameState.gameOver, isPlaying])

  const duck = useCallback((isDucking: boolean) => {
    if (!gameState.gameOver && isPlaying && !gameState.isJumping) {
      setGameState(prev => ({ ...prev, isDucking }))
    }
  }, [gameState.gameOver, gameState.isJumping, isPlaying])

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      dinoY: 0,
      dinoVelocity: 0,
      obstacles: [],
      isJumping: false,
      isDucking: false,
      gameOver: false,
      score: 0,
      highScore: prev.highScore,
      gameSpeed: 6,
      frameCount: 0,
    }))
    setIsPlaying(true)
  }, [])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        if (gameState.gameOver) {
          resetGame()
        } else {
          jump()
        }
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault()
        if (gameState.gameOver) {
          resetGame()
        } else {
          duck(true)
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        duck(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [jump, duck, gameState.gameOver, resetGame])

  useEffect(() => {
    if (!isPlaying || gameState.gameOver) return

    const gameLoop = () => {
      setGameState(prev => {
        // Apply gravity
        let newDinoY = prev.dinoY + prev.dinoVelocity
        let newDinoVelocity = prev.dinoVelocity + GRAVITY

        // Ground collision
        if (newDinoY >= 0) {
          newDinoY = 0
          newDinoVelocity = 0
        }

        // Spawn obstacles
        let newObstacles = [...prev.obstacles]
        const newFrameCount = prev.frameCount + 1
        
        // Spawn cactus or bird
        if (newFrameCount % Math.floor(80 + Math.random() * 50) === 0) {
          const isBird = prev.score > 500 && Math.random() > 0.7
          const obstacle = {
            x: 600,
            type: isBird ? 'bird' as const : 'cactus' as const,
            y: isBird ? GROUND_Y - 60 - Math.random() * 30 : GROUND_Y,
            width: isBird ? 36 : 16 + Math.random() * 12,
            height: isBird ? 24 : 32 + Math.random() * 16,
          }
          newObstacles.push(obstacle)
        }

        // Move obstacles
        newObstacles = newObstacles
          .map(obs => ({ ...obs, x: obs.x - prev.gameSpeed }))
          .filter(obs => obs.x > -40)

        // Collision detection
        const dinoHeight = prev.isDucking ? DINO_DUCK_HEIGHT : DINO_HEIGHT
        const dinoRect = {
          x: 50,
          y: GROUND_Y - dinoHeight + newDinoY,
          width: DINO_WIDTH - 8,
          height: dinoHeight - 4,
        }

        let collision = false
        for (const obs of newObstacles) {
          const obstacleRect = {
            x: obs.x + 4,
            y: obs.y - obs.height + 4,
            width: obs.width - 8,
            height: obs.height - 8,
          }

          if (
            dinoRect.x < obstacleRect.x + obstacleRect.width &&
            dinoRect.x + dinoRect.width > obstacleRect.x &&
            dinoRect.y < obstacleRect.y + obstacleRect.height &&
            dinoRect.y + dinoRect.height > obstacleRect.y
          ) {
            collision = true
            break
          }
        }

        // Update score and speed
        const newScore = collision ? prev.score : prev.score + 1
        const newGameSpeed = collision ? prev.gameSpeed : Math.min(prev.gameSpeed + 0.001, 12)

        // Update high score
        if (newScore > prev.highScore) {
          localStorage.setItem('dinoHighScore', newScore.toString())
        }

        return {
          ...prev,
          dinoY: newDinoY,
          dinoVelocity: newDinoVelocity,
          obstacles: newObstacles,
          isJumping: newDinoY < 0,
          gameOver: collision,
          score: newScore,
          highScore: Math.max(newScore, prev.highScore),
          gameSpeed: newGameSpeed,
          frameCount: newFrameCount,
        }
      })
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [isPlaying, gameState.gameOver])

  // Draw game with pixelated original-style graphics
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Disable anti-aliasing for pixelated look
    ctx.imageSmoothingEnabled = false

    // Clear canvas
    ctx.fillStyle = '#f7f7f7'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw ground
    ctx.fillStyle = '#535353'
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y)

    // Draw ground line
    ctx.fillStyle = '#535353'
    ctx.fillRect(0, GROUND_Y - 2, canvas.width, 2)

    // Draw obstacles with pixelated style
    gameState.obstacles.forEach(obs => {
      if (obs.type === 'cactus') {
        // Cactus body - pixelated style
        ctx.fillStyle = '#535353'
        ctx.fillRect(obs.x + obs.width / 3, obs.y - obs.height, obs.width / 3, obs.height)
        ctx.fillRect(obs.x, obs.y - obs.height + 8, obs.width, obs.height - 16)
        // Cactus arms
        ctx.fillRect(obs.x - 8, obs.y - obs.height + 12, 8, 4)
        ctx.fillRect(obs.x - 8, obs.y - obs.height + 8, 4, 8)
        ctx.fillRect(obs.x + obs.width, obs.y - obs.height + 12, 8, 4)
        ctx.fillRect(obs.x + obs.width + 4, obs.y - obs.height + 8, 4, 8)
      } else {
        // Bird with wing animation - pixelated style
        const wingOffset = Math.sin(gameState.frameCount * 0.4) * 6
        ctx.fillStyle = '#535353'
        ctx.fillRect(obs.x, obs.y - obs.height, obs.width, obs.height)
        // Wings
        ctx.fillRect(obs.x - 6 + wingOffset, obs.y - obs.height + 8, 8, 4)
        ctx.fillRect(obs.x + obs.width - 2 - wingOffset, obs.y - obs.height + 8, 8, 4)
        // Beak
        ctx.fillRect(obs.x + obs.width, obs.y - obs.height + 8, 6, 4)
      }
    })

    // Draw dino with pixelated original-style
    const dinoHeight = gameState.isDucking ? DINO_DUCK_HEIGHT : DINO_HEIGHT
    const dinoY = GROUND_Y - dinoHeight + gameState.dinoY
    
    ctx.fillStyle = '#535353'
    
    if (gameState.isDucking) {
      // Ducking dino - wider, shorter
      ctx.fillRect(50, dinoY, DINO_WIDTH + 8, dinoHeight)
      ctx.fillRect(50 + DINO_WIDTH + 4, dinoY + 4, 8, dinoHeight - 8)
    } else {
      // Standing/jumping dino
      ctx.fillRect(50 + 8, dinoY, DINO_WIDTH - 16, dinoHeight - 8)
      ctx.fillRect(50, dinoY + 8, DINO_WIDTH, dinoHeight - 16)
      // Head
      ctx.fillRect(50 + DINO_WIDTH - 8, dinoY, 12, 12)
      // Eye
      ctx.fillStyle = '#f7f7f7'
      ctx.fillRect(50 + DINO_WIDTH - 4, dinoY + 4, 4, 4)
      ctx.fillStyle = '#535353'
      ctx.fillRect(50 + DINO_WIDTH - 2, dinoY + 6, 2, 2)
    }
    
    // Legs with animation
    const legOffset = Math.sin(gameState.frameCount * 0.3) * 3
    ctx.fillStyle = '#535353'
    if (!gameState.isJumping) {
      ctx.fillRect(54 + legOffset, dinoY + dinoHeight, 6, 8)
      ctx.fillRect(74 - legOffset, dinoY + dinoHeight, 6, 8)
    } else {
      ctx.fillRect(54, dinoY + dinoHeight, 6, 4)
      ctx.fillRect(74, dinoY + dinoHeight, 6, 4)
    }

    // Draw score - original style
    ctx.fillStyle = '#535353'
    ctx.font = '16px monospace'
    ctx.fillText(`${Math.floor(gameState.score / 10).toString().padStart(5, '0')}`, canvas.width - 80, 25)
    
    // High score
    ctx.font = '12px monospace'
    ctx.fillText(`HI ${Math.floor(gameState.highScore / 10).toString().padStart(5, '0')}`, canvas.width - 80, 45)
  }, [gameState])

  return (
    <div className="glass-card glow-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-signal/20 to-pulse/20 p-2 border border-signal/30">
            <Gamepad2 className="h-5 w-5 text-signal" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-ink">Dino Runner</h3>
            <p className="font-mono text-xs text-ink-muted">Space/↑ Jump | ↓ Duck</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-signal" />
          <span className="font-mono text-sm text-ink-muted">
            Best: {Math.floor(gameState.highScore / 10)}
          </span>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full rounded-lg border border-white/5 bg-gray-100 cursor-crosshair image-pixelated"
          style={{ imageRendering: 'pixelated' }}
          onClick={() => {
            if (gameState.gameOver) {
              resetGame()
            } else {
              jump()
            }
          }}
        />

        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-void/80 backdrop-blur-sm rounded-lg"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPlaying(true)}
              className="glow-border rounded-full bg-signal/10 border border-signal/30 px-8 py-4 font-mono text-sm text-signal flex items-center gap-2"
            >
              <Gamepad2 className="h-4 w-4" />
              Start Game
            </motion.button>
          </motion.div>
        )}

        {gameState.gameOver && isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-void/80 backdrop-blur-sm rounded-lg"
          >
            <div className="text-center">
              <p className="font-display text-3xl font-semibold text-ink mb-2">Game Over</p>
              <p className="font-mono text-lg text-signal mb-1">
                Score: {Math.floor(gameState.score / 10)}
              </p>
              <p className="font-mono text-sm text-ink-muted mb-6">
                High Score: {Math.floor(gameState.highScore / 10)}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGame}
                className="glow-border rounded-full bg-signal/10 border border-signal/30 px-8 py-4 font-mono text-sm text-signal flex items-center gap-2 mx-auto"
              >
                <RotateCcw className="h-4 w-4" />
                Play Again
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
