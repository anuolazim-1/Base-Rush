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

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: GameConfig
  private state: GameState

  // Game entities
  private player: Player
  private obstacles: Obstacle[] = []
  private coins: Coin[] = []

  // Game loop
  private animationFrameId: number | null = null
  private lastFrameTime: number = 0
  private gameSpeed: number

  // Spawning
  private obstacleSpawnTimer: number = 0
  private coinSpawnTimer: number = 0

  constructor(canvas: HTMLCanvasElement, config?: Partial<GameConfig>) {
    this.canvas = canvas
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Could not get 2D rendering context')
    }
    this.ctx = context

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

    // Reset entities
    this.obstacles = []
    this.coins = []
    this.player.y = this.player.groundY
    this.player.velocityY = 0
    this.player.isJumping = false
    this.gameSpeed = this.config.initialSpeed
    this.obstacleSpawnTimer = 0
    this.coinSpawnTimer = 0

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
    if (this.state.isPaused || this.state.isGameOver) return

    const deltaTime = currentTime - this.lastFrameTime
    this.lastFrameTime = currentTime

    this.update(deltaTime)
    this.render()

    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time))
  }

  /**
   * Update game state
   */
  private update(deltaTime: number) {
    if (this.state.isPaused || this.state.isGameOver) return

    // Update player physics
    this.updatePlayer(deltaTime)

    // Spawn obstacles and coins
    this.updateSpawning()

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

  private updateSpawning() {
    // Spawn obstacles
    this.obstacleSpawnTimer++
    if (this.obstacleSpawnTimer >= this.config.obstacleSpawnRate / this.gameSpeed) {
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
      if (this.isColliding(this.player, obstacle)) {
        this.gameOver()
        return
      }
    }

    // Check coin collections
    for (const coin of this.coins) {
      if (!coin.collected && this.isColliding(this.player, coin)) {
        coin.collected = true
        this.state.coins++
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
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Render game frame
   */
  private render() {
    // Clear canvas
    this.ctx.fillStyle = '#001F5C'
    this.ctx.fillRect(0, 0, this.canvas.width / window.devicePixelRatio, this.canvas.height / window.devicePixelRatio)

    // Draw ground
    this.ctx.fillStyle = '#0052FF'
    const groundY = this.player.groundY
    this.ctx.fillRect(0, groundY, this.canvas.width / window.devicePixelRatio, this.canvas.height / window.devicePixelRatio - groundY)

    // Draw player
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height)

    // Draw obstacles
    this.ctx.fillStyle = '#FF0000'
    this.obstacles.forEach((obstacle) => {
      this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
    })

    // Draw coins
    this.ctx.fillStyle = '#FFD700'
    this.coins.forEach((coin) => {
      if (!coin.collected) {
        this.ctx.beginPath()
        this.ctx.arc(
          coin.x + coin.width / 2,
          coin.y + coin.height / 2,
          coin.width / 2,
          0,
          Math.PI * 2
        )
        this.ctx.fill()
      }
    })
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
}