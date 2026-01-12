'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { GameEngine } from '@/game/GameEngine'
import type { Address } from 'viem'
import type { GameState } from '@/types'

interface GameCanvasProps {
  walletAddress: Address
  onGameStateChange: (state: GameState) => void
}

/**
 * GameCanvas component manages the game engine and canvas rendering
 */
export function GameCanvas({ walletAddress, onGameStateChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [currentScore, setCurrentScore] = useState(0)
  const [currentCoins, setCurrentCoins] = useState(0)
  const [currentDistance, setCurrentDistance] = useState(0)

  // Memoize callback to avoid unnecessary re-renders
  const stableOnGameStateChange = useCallback(onGameStateChange, [onGameStateChange])

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize game engine
    const engine = new GameEngine(canvasRef.current)
    engineRef.current = engine

    // Handle keyboard input
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        if (engine.getState().isPaused) {
          engine.togglePause()
          setIsPaused(false)
        } else if (!engine.getState().isPlaying) {
          engine.start()
        } else {
          engine.jump()
        }
      } else if (e.key === 'p' || e.key === 'P') {
        engine.togglePause()
        setIsPaused(engine.getState().isPaused)
      }
    }

    // Handle touch/mobile input
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      if (engine.getState().isPaused) {
        engine.togglePause()
        setIsPaused(false)
      } else if (!engine.getState().isPlaying) {
        engine.start()
      } else {
        engine.jump()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    canvasRef.current.addEventListener('touchstart', handleTouchStart)

    // Update game state periodically
    const stateInterval = setInterval(() => {
      if (engine) {
        const state = engine.getState()
        stableOnGameStateChange(state)
        setCurrentScore(state.score)
        setCurrentCoins(state.coins)
        setCurrentDistance(Math.floor(state.distance))
      }
    }, 100)

    // Handle window resize
    const handleResize = () => {
      if (engine) {
        engine.handleResize()
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('touchstart', handleTouchStart)
      }
      clearInterval(stateInterval)
      if (engine) {
        engine.destroy()
      }
    }
  }, [stableOnGameStateChange])

  const handleStartClick = () => {
    if (engineRef.current && !engineRef.current.getState().isPlaying) {
      engineRef.current.start()
    }
  }

  const handlePauseClick = () => {
    if (engineRef.current) {
      engineRef.current.togglePause()
      setIsPaused(engineRef.current.getState().isPaused)
    }
  }

  const handleJumpClick = () => {
    if (engineRef.current) {
      engineRef.current.jump()
    }
  }

  const state = engineRef.current?.getState()

  return (
    <div className="game-canvas-container">
      <div className="game-hud">
        <div className="hud-stat">
          <span className="hud-label">Score:</span>
          <span className="hud-value">{currentScore}</span>
        </div>
        <div className="hud-stat">
          <span className="hud-label">Coins:</span>
          <span className="hud-value">{currentCoins}</span>
        </div>
        <div className="hud-stat">
          <span className="hud-label">Distance:</span>
          <span className="hud-value">{currentDistance}m</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        id="game-canvas"
        className="game-canvas"
        style={{ width: '100%', maxWidth: '800px', height: '600px', border: '2px solid #0052FF', borderRadius: '8px' }}
      />

      {!state?.isPlaying && !state?.isGameOver && (
        <div className="game-start-overlay">
          <h2>Base Rush</h2>
          <p>Press SPACE or tap to jump</p>
          <p>Collect Base Coins and avoid obstacles!</p>
          <button onClick={handleStartClick} className="btn-primary btn-large">
            Start Game
          </button>
        </div>
      )}

      {state?.isPaused && (
        <div className="game-pause-overlay">
          <h2>Paused</h2>
          <button onClick={handlePauseClick} className="btn-primary">
            Resume
          </button>
        </div>
      )}

      {state?.isPlaying && !state.isPaused && (
        <div className="game-controls">
          <button onClick={handlePauseClick} className="btn-control">
            ⏸ Pause
          </button>
          <button onClick={handleJumpClick} className="btn-control btn-jump">
            ⬆ Jump
          </button>
        </div>
      )}

      <div className="game-instructions">
        <p><strong>Desktop:</strong> Press SPACE to jump, P to pause</p>
        <p><strong>Mobile:</strong> Tap to jump, use controls below</p>
      </div>
    </div>
  )
}