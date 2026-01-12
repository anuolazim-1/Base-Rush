/**
 * Core types for Base Rush game
 */

export interface PlayerScore {
  walletAddress: string
  score: number
  coins: number
  distance: number
  timestamp: number
  playerName?: string // Optional: could be ENS name or truncated address
}

export interface LeaderboardEntry {
  walletAddress: string
  score: number
  coins: number
  distance: number
  rank: number
  playerName?: string
}

export interface GameState {
  isPlaying: boolean
  isPaused: boolean
  isGameOver: boolean
  score: number
  coins: number
  distance: number
}

export interface GameConfig {
  initialSpeed: number
  speedIncrement: number
  obstacleSpawnRate: number
  coinSpawnRate: number
  gravity: number
  jumpVelocity: number
}