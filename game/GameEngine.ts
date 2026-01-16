/**
 * Game Engine - Core game logic for the endless runner
 * 
 * This module handles:
 * - Player movement (running, jumping)
 * - Obstacle spawning and collision detection
 * - Coin collection
 * - Score calculation
 * - Difficulty progression
 * 
 * All gameplay logic is self-contained and doesn't require blockchain interaction.
 */

import type { GameState, GameConfig } from '@/types'

export interface Player {
  x: number
  y: number
  width: number
  height: number
  velocityY: number
  isJumping: boolean
  groundY: number
}

export interface Obstacle {
  x: number
  y: number
  width: number
  height: number
  id: string
}

export interface Coin {
  x: number
  y: number
  width: number
  height: number
  id: string
  collected: boolean
}

export interface GameEngineEvents {
  onCoinCollected?: (x: number, y: number) => void
  onGameOver?: () => void
}

interface CoinEffect {
  x: number
  y: number
  age: number
  duration: number
}

interface SpeedLine {
  x: number
  y: number
  length: number
  opacity: number
}

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: GameConfig
  private state: GameState
  private events?: GameEngineEvents

  // Game entities
  private player: Player
  private obstacles: Obstacle[] = []
  private coins: Coin[] = []
  private coinEffects: CoinEffect[] = []
  private speedLines: SpeedLine[] = []

  // Game loop
  private animationFrameId: number | null = null
  private lastFrameTime: number = 0
  private gameSpeed: number

  // Spawning
  private obstacleSpawnTimer: number = 0
  private coinSpawnTimer: number = 0
  private speedLineTimer: number = 0
  private elapsedTimeMs: number = 0

  // Visual feedback
  private screenShakeTime: number = 0
  private screenFlashTime: number = 0
  private postGameEffectTime: number = 0

  constructor(canvas: HTMLCanvasElement, config?: Partial<GameConfig>, events?: GameEngineEvents) {
    this.canvas = canvas
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Could not get 2D rendering context')
    }
    this.ctx = context
    this.events = events

    // Default game configuration
    this.config = {
      initialSpeed: 3,
      speedIncrement: 0.001,
      obstacleSpawnRate: 120, // frames between obstacles
      coinSpawnRate: 60, // frames between coins
      gravity: 0.6,
      jumpVelocity: -15,
      ...config,
    }

    this.gameSpeed = this.config.initialSpeed

    // Initialize game state
    this.state = {
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      score: 0,
      coins: 0,
      distance: 0,
      speed: this.config.initialSpeed,
    }

    // Initialize player
    const groundY = canvas.height - 100
    this.player = {
      x: 100,
      y: groundY,
      width: 40,
      height: 60,
      velocityY: 0,
      isJumping: false,
      groundY,
    }

    this.setupCanvas()
  }

  private setupCanvas() {
    // Set canvas size for better mobile support
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = rect.width * window.devicePixelRatio
    this.canvas.height = rect.height * window.devicePixelRatio
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    
    // Update player ground position
    this.player.groundY = this.canvas.height / window.devicePixelRatio - 100
    this.player.y = this.player.groundY
  }

  /**
   * Start the game
   */
  start() {
    if (this.state.isPlaying) return

    this.state.isPlaying = true
    this.state.isPaused = false
    this.state.isGameOver = false
    this.state.score = 0
    this.state.coins = 0
    this.state.distance = 0
    this.state.speed = this.config.initialSpeed

    // Reset entities
    this.obstacles = []
    this.coins = []
    this.player.y = this.player.groundY
    this.player.velocityY = 0
    this.player.isJumping = false
    this.gameSpeed = this.config.initialSpeed
    this.obstacleSpawnTimer = 0
    this.coinSpawnTimer = 0
    this.speedLineTimer = 0
    this.elapsedTimeMs = 0
    this.coinEffects = []
    this.speedLines = []
    this.screenShakeTime = 0
    this.screenFlashTime = 0
    this.postGameEffectTime = 0

    this.lastFrameTime = performance.now()
    this.gameLoop(this.lastFrameTime)
  }

  /**
   * Pause/unpause the game
   */
  togglePause() {
    if (!this.state.isPlaying || this.state.isGameOver) return

    this.state.isPaused = !this.state.isPaused
    if (!this.state.isPaused) {
      this.lastFrameTime = performance.now()
      this.gameLoop(this.lastFrameTime)
    }
  }

  /**
   * Make the player jump
   */
  jump() {
    if (!this.state.isPlaying || this.state.isPaused || this.state.isGameOver) return
    if (this.player.isJumping) return

    this.player.velocityY = this.config.jumpVelocity
    this.player.isJumping = true
  }

  /**
   * Main game loop
   */
  private gameLoop(currentTime: number) {
    if (this.state.isPaused) return

    const deltaTime = currentTime - this.lastFrameTime
    this.lastFrameTime = currentTime

    if (!this.state.isGameOver) {
      this.update(deltaTime)
    } else {
      this.updateScreenEffects(deltaTime)
      this.postGameEffectTime = Math.max(0, this.postGameEffectTime - deltaTime)
    }
    this.render()

    if (this.state.isGameOver && this.postGameEffectTime <= 0) {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
      }
      return
    }

    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time))
  }

  /**
   * Update game state
   */
  private update(deltaTime: number) {
    if (this.state.isPaused || this.state.isGameOver) return

    this.elapsedTimeMs += deltaTime

    // Update player physics
    this.updatePlayer(deltaTime)

    // Spawn obstacles and coins
    this.updateSpawning(deltaTime)

    // Update obstacles
    this.updateObstacles()

    // Update coins
    this.updateCoins()

    // Check collisions
    this.checkCollisions()

    // Update score and difficulty
    this.state.distance += this.gameSpeed * (deltaTime / 16) // Normalize to 60fps
    this.state.score = Math.floor(this.state.distance / 10) + this.state.coins * 10
    this.gameSpeed += this.config.speedIncrement
    this.state.speed = this.gameSpeed

    // Update effects
    this.updateCoinEffects(deltaTime)
    this.updateSpeedLines(deltaTime)
    this.updateScreenEffects(deltaTime)
  }

  private updatePlayer(deltaTime: number) {
    // Apply gravity
    this.player.velocityY += this.config.gravity

    // Update position
    this.player.y += this.player.velocityY

    // Ground collision
    if (this.player.y >= this.player.groundY) {
      this.player.y = this.player.groundY
      this.player.velocityY = 0
      this.player.isJumping = false
    }
  }

  private updateSpawning(deltaTime: number) {
    const gracePeriodMs = 3500
    const easyRampDurationMs = 12000
    const rampProgress = Math.min(1, Math.max(0, (this.elapsedTimeMs - gracePeriodMs) / easyRampDurationMs))
    const earlySpawnMultiplier = 1.6 - 0.6 * rampProgress

    // Grace period before first obstacle
    if (this.elapsedTimeMs < gracePeriodMs) {
      return
    }

    // Spawn obstacles
    this.obstacleSpawnTimer++
    if (this.obstacleSpawnTimer >= (this.config.obstacleSpawnRate * earlySpawnMultiplier) / this.gameSpeed) {
      this.spawnObstacle()
      this.obstacleSpawnTimer = 0
      // Decrease spawn rate as game gets faster
      this.config.obstacleSpawnRate = Math.max(60, this.config.obstacleSpawnRate - 0.5)
    }

    // Spawn coins
    this.coinSpawnTimer++
    if (this.coinSpawnTimer >= this.config.coinSpawnRate) {
      this.spawnCoin()
      this.coinSpawnTimer = 0
    }
  }

  private spawnObstacle() {
    const obstacle: Obstacle = {
      x: this.canvas.width / window.devicePixelRatio,
      y: this.player.groundY,
      width: 30,
      height: 50,
      id: Math.random().toString(36).substr(2, 9),
    }
    this.obstacles.push(obstacle)
  }

  private spawnCoin() {
    const coin: Coin = {
      x: this.canvas.width / window.devicePixelRatio,
      y: this.player.groundY - 80, // Floating above ground
      width: 25,
      height: 25,
      id: Math.random().toString(36).substr(2, 9),
      collected: false,
    }
    this.coins.push(coin)
  }

  private updateObstacles() {
    this.obstacles.forEach((obstacle) => {
      obstacle.x -= this.gameSpeed
    })

    // Remove obstacles that are off-screen
    this.obstacles = this.obstacles.filter(
      (obstacle) => obstacle.x + obstacle.width > 0
    )
  }

  private updateCoins() {
    this.coins.forEach((coin) => {
      if (!coin.collected) {
        coin.x -= this.gameSpeed
      }
    })

    // Remove coins that are off-screen or collected
    this.coins = this.coins.filter(
      (coin) => coin.x + coin.width > 0 && !coin.collected
    )
  }

  private checkCollisions() {
    // Check obstacle collisions
    for (const obstacle of this.obstacles) {
      const hitbox = {
        x: obstacle.x + obstacle.width * 0.1,
        y: obstacle.y + obstacle.height * 0.05,
        width: obstacle.width * 0.8,
        height: obstacle.height * 0.9,
      }
      if (this.isColliding(this.player, hitbox)) {
        this.gameOver()
        return
      }
    }

    // Check coin collections
    for (const coin of this.coins) {
      if (!coin.collected && this.isColliding(this.player, coin)) {
        coin.collected = true
        this.state.coins++
        this.spawnCoinEffect(coin)
        this.events?.onCoinCollected?.(coin.x + coin.width / 2, coin.y + coin.height / 2)
      }
    }
  }

  private isColliding(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    )
  }

  private gameOver() {
    this.state.isGameOver = true
    this.state.isPlaying = false
    this.screenShakeTime = 250
    this.screenFlashTime = 220
    this.postGameEffectTime = 260
    this.events?.onGameOver?.()
  }

  /**
   * Render game frame
   */
  private render() {
    const ctx = this.ctx
    const width = this.canvas.width / window.devicePixelRatio
    const height = this.canvas.height / window.devicePixelRatio
    const speedFactor = Math.min(1, (this.gameSpeed - this.config.initialSpeed) / 8)

    // Screen shake
    ctx.save()
    if (this.screenShakeTime > 0) {
      const magnitude = 6 * speedFactor + 2
      const offsetX = (Math.random() - 0.5) * magnitude
      const offsetY = (Math.random() - 0.5) * magnitude
      ctx.translate(offsetX, offsetY)
    }

    // Background gradient with speed shift
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
    bgGradient.addColorStop(0, `rgba(0, 82, 255, ${0.55 + speedFactor * 0.2})`)
    bgGradient.addColorStop(1, `rgba(0, 31, 92, ${0.95})`)
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    // Speed lines
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + speedFactor * 0.2})`
    ctx.lineWidth = 1
    this.speedLines.forEach((line) => {
      ctx.globalAlpha = line.opacity
      ctx.beginPath()
      ctx.moveTo(line.x, line.y)
      ctx.lineTo(line.x + line.length, line.y)
      ctx.stroke()
    })
    ctx.globalAlpha = 1

    // Draw ground
    const groundGradient = ctx.createLinearGradient(0, this.player.groundY, 0, height)
    groundGradient.addColorStop(0, '#0046D9')
    groundGradient.addColorStop(1, '#002B7F')
    ctx.fillStyle = groundGradient
    const groundY = this.player.groundY
    ctx.fillRect(0, groundY, width, height - groundY)

    // Draw player
    const playerGradient = ctx.createLinearGradient(this.player.x, this.player.y, this.player.x, this.player.y + this.player.height)
    playerGradient.addColorStop(0, '#FFFFFF')
    playerGradient.addColorStop(1, '#C9D9FF')
    ctx.fillStyle = playerGradient
    ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height)
    ctx.strokeStyle = '#7FA6FF'
    ctx.lineWidth = 2
    ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height)

    // Draw obstacles (tree shapes)
    this.obstacles.forEach((obstacle) => {
      const trunkWidth = obstacle.width * 0.35
      const trunkHeight = obstacle.height * 0.55
      const trunkX = obstacle.x + (obstacle.width - trunkWidth) / 2
      const trunkY = obstacle.y + obstacle.height - trunkHeight
      const canopyRadius = obstacle.width * 0.55
      const canopyX = obstacle.x + obstacle.width / 2
      const canopyY = obstacle.y + canopyRadius

      // Trunk
      const trunkGradient = ctx.createLinearGradient(trunkX, trunkY, trunkX, trunkY + trunkHeight)
      trunkGradient.addColorStop(0, '#8D5A2B')
      trunkGradient.addColorStop(1, '#5A3A1C')
      ctx.fillStyle = trunkGradient
      ctx.fillRect(trunkX, trunkY, trunkWidth, trunkHeight)
      ctx.strokeStyle = '#3E2611'
      ctx.lineWidth = 1.5
      ctx.strokeRect(trunkX, trunkY, trunkWidth, trunkHeight)

      // Canopy
      const canopyGradient = ctx.createRadialGradient(
        canopyX,
        canopyY,
        4,
        canopyX,
        canopyY,
        canopyRadius
      )
      canopyGradient.addColorStop(0, '#66BB6A')
      canopyGradient.addColorStop(1, '#2E7D32')
      ctx.fillStyle = canopyGradient
      ctx.beginPath()
      ctx.arc(canopyX, canopyY, canopyRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#1B5E20'
      ctx.lineWidth = 2
      ctx.stroke()
    })

    // Draw coins
    ctx.fillStyle = '#FFD700'
    this.coins.forEach((coin) => {
      if (!coin.collected) {
        const coinGradient = ctx.createRadialGradient(
          coin.x + coin.width / 2,
          coin.y + coin.height / 2,
          2,
          coin.x + coin.width / 2,
          coin.y + coin.height / 2,
          coin.width / 2
        )
        coinGradient.addColorStop(0, '#FFF6A1')
        coinGradient.addColorStop(1, '#F5B700')
        ctx.fillStyle = coinGradient
        ctx.beginPath()
        ctx.arc(
          coin.x + coin.width / 2,
          coin.y + coin.height / 2,
          coin.width / 2,
          0,
          Math.PI * 2
        )
        ctx.fill()
        ctx.strokeStyle = '#B8860B'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    })

    // Coin pickup effects
    this.coinEffects.forEach((effect) => {
      const progress = effect.age / effect.duration
      const alpha = 1 - progress
      const size = 12 + progress * 18
      ctx.globalAlpha = alpha
      ctx.strokeStyle = '#FFF1A8'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#FFF1A8'
      ctx.font = 'bold 14px Arial'
      ctx.fillText('+1', effect.x - 8, effect.y - 18 - progress * 12)
      ctx.globalAlpha = 1
    })

    // Red flash on game over
    if (this.screenFlashTime > 0) {
      const flashAlpha = Math.min(0.5, this.screenFlashTime / 220)
      ctx.fillStyle = `rgba(255, 60, 60, ${flashAlpha})`
      ctx.fillRect(0, 0, width, height)
    }

    ctx.restore()
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    return { ...this.state }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
    }
    this.state.isPlaying = false
  }

  /**
   * Handle window resize
   */
  handleResize() {
    this.setupCanvas()
  }

  private spawnCoinEffect(coin: Coin) {
    this.coinEffects.push({
      x: coin.x + coin.width / 2,
      y: coin.y + coin.height / 2,
      age: 0,
      duration: 500,
    })
  }

  private updateCoinEffects(deltaTime: number) {
    this.coinEffects.forEach((effect) => {
      effect.age += deltaTime
      effect.y -= 0.03 * deltaTime
    })
    this.coinEffects = this.coinEffects.filter((effect) => effect.age < effect.duration)
  }

  private updateSpeedLines(deltaTime: number) {
    this.speedLineTimer += deltaTime
    if (this.speedLineTimer > 120 / Math.max(1, this.gameSpeed / 2)) {
      this.speedLineTimer = 0
      this.speedLines.push({
        x: this.canvas.width / window.devicePixelRatio + 20,
        y: 40 + Math.random() * (this.player.groundY - 120),
        length: 20 + Math.random() * 40,
        opacity: 0.2 + Math.random() * 0.2,
      })
    }

    this.speedLines.forEach((line) => {
      line.x -= this.gameSpeed * 1.6
      line.opacity -= deltaTime * 0.0005
    })

    this.speedLines = this.speedLines.filter((line) => line.x + line.length > 0 && line.opacity > 0)
  }

  private updateScreenEffects(deltaTime: number) {
    this.screenShakeTime = Math.max(0, this.screenShakeTime - deltaTime)
    this.screenFlashTime = Math.max(0, this.screenFlashTime - deltaTime)
  }
}