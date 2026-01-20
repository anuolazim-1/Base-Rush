'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { WalletConnect } from './WalletConnect'
import { GameCanvas } from './GameCanvas'
import { Leaderboard } from './Leaderboard'
import { GameOverScreen } from './GameOverScreen'
import type { Address } from 'viem'
import type { GameState } from '@/types'
import { savePlayerName } from '@/lib/firebase/players'
import { getPlayerProgression } from '@/lib/firebase/progression'

export function GameScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [walletAddress, setWalletAddress] = useState<Address | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showRewards, setShowRewards] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [pointsBalance, setPointsBalance] = useState<number | null>(null)
  const [dailyStreak, setDailyStreak] = useState(0)
  const [lastStreakDate, setLastStreakDate] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [showHowTo, setShowHowTo] = useState(false)
  const [dontShowHowTo, setDontShowHowTo] = useState(false)
  const [autoStartGame, setAutoStartGame] = useState(false)
  const streakUpdatedRef = useRef(false)

  const handleAuthenticated = useCallback((address: Address) => {
    setWalletAddress(address)
    setIsAuthenticated(true)
    setIsGuest(false)
  }, [])

  const handleGameStateChange = useCallback((state: GameState) => {
    setGameState(state)
  }, [])

  const handleNewGame = useCallback(() => {
    setGameState(null)
    setAutoStartGame(true)
  }, [])

  const handleDisconnected = useCallback(() => {
    setIsAuthenticated(false)
    setWalletAddress(null)
    setGameState(null)
    setAutoStartGame(false)
    setIsGuest(false)
    setPointsBalance(null)
  }, [])

  const handleAutoStartHandled = useCallback(() => {
    setAutoStartGame(false)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const isGameplayActive = (isAuthenticated || isGuest) && !gameState?.isGameOver
    document.body.classList.toggle('gameplay-active', isGameplayActive)
    return () => {
      document.body.classList.remove('gameplay-active')
    }
  }, [isAuthenticated, isGuest, gameState?.isGameOver])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hideHowTo = localStorage.getItem('base-rush-hide-howto')
    if (!hideHowTo) {
      setShowHowTo(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedStreak = Number(localStorage.getItem('base-rush-streak-count') || 0)
    const storedDate = localStorage.getItem('base-rush-streak-date')
    setDailyStreak(Number.isFinite(storedStreak) ? storedStreak : 0)
    setLastStreakDate(storedDate)
  }, [])

  useEffect(() => {
    if (!walletAddress || !isAuthenticated) return
    getPlayerProgression(walletAddress)
      .then((progression) => {
        if (progression) {
          setPointsBalance(progression.pointsBalance)
        } else {
          setPointsBalance(null)
        }
      })
      .catch(() => setPointsBalance(null))
  }, [walletAddress, isAuthenticated])

  useEffect(() => {
    if (!gameState?.isGameOver) {
      streakUpdatedRef.current = false
      return
    }
    if (streakUpdatedRef.current || typeof window === 'undefined') return
    streakUpdatedRef.current = true
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const storedDate = localStorage.getItem('base-rush-streak-date')
    const storedStreak = Number(localStorage.getItem('base-rush-streak-count') || 0)
    if (storedDate === today) {
      setDailyStreak(storedStreak)
      setLastStreakDate(storedDate)
      return
    }
    const nextStreak = storedDate === yesterday ? storedStreak + 1 : 1
    localStorage.setItem('base-rush-streak-count', String(nextStreak))
    localStorage.setItem('base-rush-streak-date', today)
    setDailyStreak(nextStreak)
    setLastStreakDate(today)
  }, [gameState?.isGameOver])

  const handleGuestStart = useCallback(() => {
    setIsGuest(true)
    setIsAuthenticated(false)
    setWalletAddress(null)
    setGameState(null)
    setShowLeaderboard(false)
    setShowRewards(false)
    setPointsBalance(null)
    setAutoStartGame(true)
  }, [])

  const handleCloseHowTo = useCallback(() => {
    if (dontShowHowTo && typeof window !== 'undefined') {
      localStorage.setItem('base-rush-hide-howto', '1')
    }
    setShowHowTo(false)
  }, [dontShowHowTo])

  useEffect(() => {
    if (!walletAddress) return
    const key = `base-rush-player-name:${walletAddress.toLowerCase()}`
    const stored = localStorage.getItem(key)
    if (stored) {
      setPlayerName(stored)
      setShowNamePrompt(false)
    } else {
      setShowNamePrompt(true)
    }
  }, [walletAddress])

  const handleSavePlayerName = useCallback(async () => {
    if (!walletAddress) return
    const trimmed = playerName.trim()
    const isValid = /^[a-zA-Z0-9 _-]{3,16}$/.test(trimmed)
    if (!isValid) {
      setNameError('Name must be 3–16 characters (letters, numbers, space, _ or -).')
      return
    }
    const key = `base-rush-player-name:${walletAddress.toLowerCase()}`
    localStorage.setItem(key, trimmed)
    setNameError(null)
    setShowNamePrompt(false)
    try {
      await savePlayerName(walletAddress, trimmed)
    } catch (error) {
      console.error('Error saving player name:', error)
    }
  }, [walletAddress, playerName])

  const handleSkipName = useCallback(() => {
    setShowNamePrompt(false)
  }, [])

  return (
    <div className="game-screen">
      <header className="game-header">
        <h1>Base Rush</h1>
        <div className="header-actions">
          <button 
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="btn-secondary"
          >
            {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
          </button>
          <button
            onClick={() => setShowRewards(!showRewards)}
            className="btn-secondary"
          >
            {showRewards ? 'Hide' : 'Show'} Rewards
          </button>
          {isAuthenticated && pointsBalance !== null && (
            <div className="points-badge">
              Points Balance: {pointsBalance}
            </div>
          )}
          {isAuthenticated && (
            <WalletConnect
              onAuthenticated={handleAuthenticated}
              onDisconnected={handleDisconnected}
            />
          )}
        </div>
      </header>

      <main className="game-main">
        {showLeaderboard && <Leaderboard />}
        {showRewards && (
          <div className="rewards-panel">
            <h2>Rewards</h2>
            {isAuthenticated ? (
              <>
                <p className="rewards-balance">Points Balance: {pointsBalance ?? 0}</p>
                <p className="rewards-note">Token conversion coming soon.</p>
              </>
            ) : (
              <p className="rewards-note">Connect your wallet to track points globally.</p>
            )}
            <div className="rewards-streak">
              <p>Daily streak: {dailyStreak} day{dailyStreak === 1 ? '' : 's'}</p>
              <p className="rewards-note">
                {lastStreakDate ? 'Complete a run each day to keep it going.' : 'Play one run today to start a streak.'}
              </p>
            </div>
          </div>
        )}
        
        {showHowTo && (
          <div className="how-to-overlay">
            <div className="how-to-card">
              <h3>How to Play</h3>
              <ul className="how-to-list">
                <li>Jump to avoid obstacles</li>
                <li>Collect Base Coins to boost score</li>
                <li>Survive as long as you can</li>
              </ul>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={dontShowHowTo}
                  onChange={(e) => setDontShowHowTo(e.target.checked)}
                />
                Don’t show again
              </label>
              <div className="how-to-actions">
                <button className="btn-primary" onClick={handleCloseHowTo}>
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        {isAuthenticated && showNamePrompt && (
          <div className="player-name-modal">
            <div className="player-name-card">
              <h3>Choose a Player Name</h3>
              <p>Shown on the leaderboard (3–16 chars).</p>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your name"
                maxLength={16}
              />
              {nameError && <p className="error-message">{nameError}</p>}
              <div className="player-name-actions">
                <button className="btn-secondary" onClick={handleSkipName}>
                  Skip
                </button>
                <button className="btn-primary" onClick={handleSavePlayerName}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {!isAuthenticated && !isGuest ? (
          <section className="landing">
            <div className="landing-hero">
              <div className="hero-copy">
                <span className="hero-kicker">Base Network Arcade</span>
                <h2 className="hero-title">Dash, jump, and stack Base Coins.</h2>
                <p className="hero-subtitle">
                  Base Rush is a fast, on-chain runner where every score is tied to your wallet.
                </p>
                <div className="hero-cta">
                  <WalletConnect
                    onAuthenticated={handleAuthenticated}
                    onDisconnected={handleDisconnected}
                    buttonClassName="btn-large cta-glow"
                  />
                  <button className="btn-secondary btn-large" onClick={handleGuestStart}>
                    Play as Guest
                  </button>
                  <p className="hero-note">Connect once to save scores and climb the leaderboard.</p>
                </div>
              </div>
              <div className="hero-media">
                <div className="gif-frame">
                  <div className="gif-placeholder">Gameplay preview coming soon</div>
                </div>
              </div>
            </div>
            <div className="landing-howto">
              <h3>How to Play</h3>
              <ul>
                <li>Tap or press Space to jump.</li>
                <li>Collect coins to boost your score.</li>
                <li>Avoid obstacles to keep the run alive.</li>
                <li>Save your score with your wallet.</li>
              </ul>
            </div>
          </section>
        ) : gameState?.isGameOver ? (
          <>
          <GameOverScreen 
            gameState={gameState}
            walletAddress={walletAddress ?? undefined}
            isGuest={isGuest}
            onProgressionUpdated={setPointsBalance}
            onNewGame={handleNewGame}
          />
          {isGuest && (
            <div className="guest-cta">
              <p>Connect wallet to save to the global leaderboard.</p>
              <WalletConnect
                onAuthenticated={handleAuthenticated}
                onDisconnected={handleDisconnected}
                buttonClassName="btn-large"
              />
            </div>
          )}
          </>
        ) : (
          <GameCanvas 
            walletAddress={walletAddress ?? undefined}
            onGameStateChange={handleGameStateChange}
            autoStart={autoStartGame}
            onAutoStartHandled={handleAutoStartHandled}
            pointsBalance={isAuthenticated ? pointsBalance : null}
          />
        )}
      </main>

      <footer className="game-footer">
        <p>Built for the Base ecosystem • Gasless gameplay • On-chain authentication</p>
      </footer>
    </div>
  )
}