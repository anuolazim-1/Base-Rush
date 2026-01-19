'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { saveScore, getHighScore } from '@/lib/firebase/scores'
import type { Address } from 'viem'
import type { GameState, PlayerScore } from '@/types'

interface GameOverScreenProps {
  gameState: GameState
  walletAddress: Address
  onNewGame: () => void
}

/**
 * GameOverScreen displays final score and handles score submission
 */
export function GameOverScreen({ gameState, walletAddress, onNewGame }: GameOverScreenProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [highScore, setHighScore] = useState<number | null>(null)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const hasSavedRef = useRef(false)

  const loadHighScore = useCallback(async () => {
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
    if (!walletAddress) {
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
  }, [walletAddress, gameState.score, gameState.coins, gameState.distance, highScore])

  useEffect(() => {
    // Load player's high score and check if this is a new record
    if (!walletAddress) return
    loadHighScore()
  }, [walletAddress, gameState.score, loadHighScore])

  useEffect(() => {
    // Auto-save score when component mounts
    if (!walletAddress || hasSavedRef.current) return
    hasSavedRef.current = true
    handleSaveScore()
  }, [walletAddress, gameState.score, handleSaveScore])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedName = localStorage.getItem(`base-rush-player-name:${walletAddress.toLowerCase()}`)
    setPlayerName(storedName)
  }, [walletAddress])

  const distance = Math.floor(gameState.distance)
  const bestScore = highScore ? Math.max(highScore, gameState.score) : gameState.score
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
            <div className="stat-label">Distance</div>
            <div className="stat-value">{Math.floor(gameState.distance)}m</div>
          </div>

          {highScore !== null && (
            <div className="stat-card">
              <div className="stat-label">Your Best Score</div>
              <div className="stat-value">{highScore}</div>
            </div>
          )}
        </div>

        {isSaving && (
          <div className="save-status">
            <p>Saving your score...</p>
          </div>
        )}

        {saveSuccess && (
          <div className="save-status success">
            <p>✓ Score saved successfully!</p>
          </div>
        )}

        {saveError && (
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