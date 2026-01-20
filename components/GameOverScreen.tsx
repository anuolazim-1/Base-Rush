'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { saveScore, getHighScore } from '@/lib/firebase/scores'
import { hasFirebaseConfig } from '@/lib/firebase/config'
import { incrementPlayerProgression } from '@/lib/firebase/progression'
import type { Address } from 'viem'
import type { GameState, PlayerScore } from '@/types'

interface GameOverScreenProps {
  gameState: GameState
  walletAddress?: Address
  isGuest?: boolean
  onProgressionUpdated?: (pointsBalance: number | null) => void
  onNewGame: () => void
}

/**
 * GameOverScreen displays final score and handles score submission
 */
export function GameOverScreen({
  gameState,
  walletAddress,
  isGuest = false,
  onProgressionUpdated,
  onNewGame,
}: GameOverScreenProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [highScore, setHighScore] = useState<number | null>(null)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const [localHighScore, setLocalHighScore] = useState<number | null>(null)
  const hasSavedRef = useRef(false)
  const hasProgressedRef = useRef(false)
  const guestScoreKey = 'base-rush-guest-high-score'

  const loadHighScore = useCallback(async () => {
    if (!walletAddress) return
    try {
      const playerScore = await getHighScore(walletAddress)
      if (playerScore) {
        setHighScore(playerScore.score)
        if (gameState.score > playerScore.score) {
          setIsNewRecord(true)
        }
      } else {
        setIsNewRecord(true) // First score is always a record
      }
    } catch (error) {
      console.error('Error loading high score:', error)
    }
  }, [walletAddress, gameState.score])

  const handleSaveScore = useCallback(async () => {
    if (!walletAddress || isGuest) {
      return
    }
    if (!hasFirebaseConfig()) {
      setSaveError('Score saving is unavailable. Firebase configuration is missing.')
      return
    }

    const storedName = typeof window !== 'undefined'
      ? localStorage.getItem(`base-rush-player-name:${walletAddress.toLowerCase()}`)
      : null

    const scoreData: PlayerScore = {
      walletAddress: walletAddress.toLowerCase(),
      score: gameState.score,
      coins: gameState.coins,
      distance: Math.floor(gameState.distance),
      timestamp: Date.now(),
      playerName: storedName || undefined,
    }

    // Basic payload validation to avoid false "save failed" errors
    if (!scoreData.walletAddress || scoreData.timestamp <= 0) {
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      await saveScore(scoreData)
      setSaveSuccess(true)
      
      // Update high score if this is better
      if (!highScore || gameState.score > highScore) {
        setHighScore(gameState.score)
        setIsNewRecord(true)
      }
    } catch (error) {
      console.error('Error saving score:', error)
      const errorMessage = (error as { message?: string; code?: string })?.message || ''
      const errorCode = (error as { code?: string })?.code || ''

      if (errorCode === 'permission-denied' || errorMessage.includes('permission')) {
        setSaveError('Failed to save score. Firestore rules may be blocking writes.')
      } else if (errorMessage.includes('Missing Firebase env vars')) {
        setSaveError('Failed to save score. Firebase configuration is missing.')
      } else {
        setSaveError('Failed to save score. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }, [walletAddress, isGuest, gameState.score, gameState.coins, gameState.distance, highScore])

  useEffect(() => {
    // Load player's high score and check if this is a new record
    if (!walletAddress || isGuest) return
    loadHighScore()
  }, [walletAddress, gameState.score, loadHighScore, isGuest])

  useEffect(() => {
    // Auto-save score when component mounts
    if (!walletAddress || hasSavedRef.current || isGuest) return
    hasSavedRef.current = true
    handleSaveScore()
  }, [walletAddress, gameState.score, handleSaveScore, isGuest])

  useEffect(() => {
    if (!walletAddress || isGuest || hasProgressedRef.current) return
    hasProgressedRef.current = true
    incrementPlayerProgression(walletAddress, gameState.coins)
      .then((progression) => {
        if (progression) {
          onProgressionUpdated?.(progression.pointsBalance)
        }
      })
      .catch(() => {
        onProgressionUpdated?.(null)
      })
  }, [walletAddress, gameState.coins, isGuest, onProgressionUpdated])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!walletAddress || isGuest) return
    const storedName = localStorage.getItem(`base-rush-player-name:${walletAddress.toLowerCase()}`)
    setPlayerName(storedName)
  }, [walletAddress, isGuest])

  useEffect(() => {
    if (!isGuest || typeof window === 'undefined') return
    const stored = localStorage.getItem(guestScoreKey)
    const parsed = stored ? Number.parseInt(stored, 10) : null
    const storedScore = Number.isFinite(parsed) ? parsed : null
    setLocalHighScore(storedScore)

    if (!storedScore) {
      setIsNewRecord(true)
      localStorage.setItem(guestScoreKey, String(gameState.score))
      setLocalHighScore(gameState.score)
      return
    }

    if (gameState.score > storedScore) {
      setIsNewRecord(true)
      localStorage.setItem(guestScoreKey, String(gameState.score))
      setLocalHighScore(gameState.score)
    } else {
      setIsNewRecord(false)
    }
  }, [gameState.score, isGuest])

  const distance = Math.floor(gameState.distance)
  const bestScore = isGuest
    ? (localHighScore ? Math.max(localHighScore, gameState.score) : gameState.score)
    : (highScore ? Math.max(highScore, gameState.score) : gameState.score)
  const shareText = `${playerName ? `${playerName} just` : 'I just'} hit ${bestScore} points (${distance}m, ${gameState.coins} coins) on Base in Base Rush! https://base-rush-tg9s.vercel.app/`
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`

  const handleShareOnX = () => {
    if (typeof window === 'undefined') return
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }

  const handleCopyShare = async () => {
    if (typeof navigator === 'undefined') return
    try {
      await navigator.clipboard.writeText(shareText)
      setCopyStatus('Copied!')
    } catch (error) {
      console.error('Failed to copy share text:', error)
      setCopyStatus('Copy failed')
    }
  }

  return (
    <div className="game-over-screen">
      <div className="game-over-content">
        <h2>Game Over!</h2>
        
        {isNewRecord && (
          <div className="new-record-badge">
            🎉 New Personal Record! 🎉
          </div>
        )}

        <div className="final-stats">
          <div className="stat-card">
            <div className="stat-label">Final Score</div>
            <div className="stat-value">{gameState.score}</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">Coins Collected</div>
            <div className="stat-value">{gameState.coins}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Points Earned</div>
            <div className="stat-value">+{gameState.coins}</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">Distance</div>
            <div className="stat-value">{Math.floor(gameState.distance)}m</div>
          </div>

          {highScore !== null && !isGuest && (
            <div className="stat-card">
              <div className="stat-label">Global (Wallet) Best</div>
              <div className="stat-value">{highScore}</div>
            </div>
          )}
          {isGuest && (
            <div className="stat-card">
              <div className="stat-label">Local (Guest) Best</div>
              <div className="stat-value">{bestScore}</div>
            </div>
          )}
        </div>

        {isSaving && !isGuest && (
          <div className="save-status">
            <p>Saving your score...</p>
          </div>
        )}

        {saveSuccess && !isGuest && (
          <div className="save-status success">
            <p>✓ Score saved successfully!</p>
          </div>
        )}

        {saveError && !isGuest && (
          <div className="save-status error">
            <p>{saveError}</p>
            <button onClick={handleSaveScore} className="btn-secondary btn-small">
              Retry
            </button>
          </div>
        )}

        <div className="share-actions">
          <button onClick={handleShareOnX} className="btn-primary">
            Share on X
          </button>
          <button onClick={handleCopyShare} className="btn-secondary">
            Copy share text
          </button>
          {copyStatus && <p className="share-status">{copyStatus}</p>}
        </div>

        <div className="game-over-actions">
          <button onClick={onNewGame} className="btn-primary btn-large">
            Play Again
          </button>
        </div>
      </div>
    </div>
  )
}