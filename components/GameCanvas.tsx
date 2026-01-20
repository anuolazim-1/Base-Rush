'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { GameEngine, GameEngineEvents } from '@/game/GameEngine'
import type { Address } from 'viem'
import type { GameState } from '@/types'

interface GameCanvasProps {
  walletAddress?: Address
  onGameStateChange: (state: GameState) => void
  autoStart?: boolean
  onAutoStartHandled?: () => void
  pointsBalance?: number | null
}

/**
 * GameCanvas component manages the game engine and canvas rendering
 */
export function GameCanvas({
  onGameStateChange,
  autoStart = false,
  onAutoStartHandled,
  pointsBalance = null,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [currentScore, setCurrentScore] = useState(0)
  const [currentCoins, setCurrentCoins] = useState(0)
  const [currentDistance, setCurrentDistance] = useState(0)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const muteHydratedRef = useRef(false)

  // Memoize callback to avoid unnecessary re-renders
  const stableOnGameStateChange = useCallback(onGameStateChange, [onGameStateChange])

  const initAudio = useCallback(async () => {
    if (isMuted) return
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }
  }, [isMuted])

  const playTone = useCallback(
    (frequency: number, durationMs: number, type: OscillatorType = 'sine', volume: number = 0.05) => {
      if (isMuted || !audioContextRef.current) return
      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = type
      oscillator.frequency.value = frequency
      gain.gain.value = volume
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start()
      oscillator.stop(ctx.currentTime + durationMs / 1000)
    },
    [isMuted]
  )

  useEffect(() => {
    if (!canvasRef.current) return

    const events: GameEngineEvents = {
      onCoinCollected: () => {
        playTone(820, 90, 'triangle', 0.06)
      },
      onGameOver: () => {
        playTone(160, 420, 'sawtooth', 0.08)
      },
    }

    // Initialize game engine
    const engine = new GameEngine(canvasRef.current, undefined, events)
    engineRef.current = engine

    // Handle keyboard input
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        initAudio()
        if (engine.getState().isPaused) {
          engine.togglePause()
          setIsPaused(false)
        } else if (!engine.getState().isPlaying) {
          engine.start()
        } else {
          engine.jump()
          playTone(420, 120, 'square', 0.05)
        }
      } else if (e.key === 'p' || e.key === 'P') {
        engine.togglePause()
        setIsPaused(engine.getState().isPaused)
      }
    }

    // Handle touch/mobile input
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      initAudio()
      if (engine.getState().isPaused) {
        engine.togglePause()
        setIsPaused(false)
      } else if (!engine.getState().isPlaying) {
        engine.start()
      } else {
        engine.jump()
        playTone(420, 120, 'square', 0.05)
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
        setCurrentSpeed(state.speed)
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
  }, [stableOnGameStateChange, initAudio, playTone])

  useEffect(() => {
    if (!autoStart) return
    const engine = engineRef.current
    if (engine && !engine.getState().isPlaying) {
      engine.start()
      onAutoStartHandled?.()
    }
  }, [autoStart, onAutoStartHandled])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('base-rush-muted')
    if (stored) {
      setIsMuted(stored === '1')
    }
    muteHydratedRef.current = true
  }, [])

  useEffect(() => {
    if (!muteHydratedRef.current) return
    if (typeof window === 'undefined') return
    localStorage.setItem('base-rush-muted', isMuted ? '1' : '0')
  }, [isMuted])

  const handleStartClick = () => {
    if (engineRef.current && !engineRef.current.getState().isPlaying) {
      initAudio()
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
      initAudio()
      engineRef.current.jump()
      playTone(420, 120, 'square', 0.05)
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
        {pointsBalance !== null && (
          <div className="hud-stat">
            <span className="hud-label">Points:</span>
            <span className="hud-value">{pointsBalance}</span>
          </div>
        )}
        <div className="hud-stat">
          <span className="hud-label">Coins:</span>
          <span className="hud-value">{currentCoins}</span>
        </div>
        <div className="hud-stat">
          <span className="hud-label">Distance:</span>
          <span className="hud-value">{currentDistance}m</span>
        </div>
        <div className="hud-stat">
          <span className="hud-label">Speed:</span>
          <span className="hud-value">{currentSpeed.toFixed(1)}x</span>
        </div>
        <button
          className={`btn-mute ${isMuted ? 'muted' : ''}`}
          onClick={() => setIsMuted((prev) => !prev)}
          aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        id="game-canvas"
        className="game-canvas"
      />

      {!state?.isPlaying && !state?.isGameOver && (
        <div className="game-start-overlay overlay-fade-in">
          <h2>Base Rush</h2>
          <p>Press SPACE or tap to jump</p>
          <p>Collect Base Coins and avoid obstacles!</p>
          <button onClick={handleStartClick} className="btn-primary btn-large">
            Start Game
          </button>
        </div>
      )}

      {state?.isPaused && (
        <div className="game-pause-overlay overlay-fade-in">
          <h2>Paused</h2>
          <button onClick={handlePauseClick} className="btn-primary">
            Resume
          </button>
        </div>
      )}

      {state?.isPlaying && !state.isPaused && (
        <div className="game-controls overlay-fade-in">
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