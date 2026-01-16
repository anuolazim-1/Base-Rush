'use client'

import { useState, useCallback, useEffect } from 'react'
import { WalletConnect } from './WalletConnect'
import { GameCanvas } from './GameCanvas'
import { Leaderboard } from './Leaderboard'
import { GameOverScreen } from './GameOverScreen'
import type { Address } from 'viem'
import type { GameState } from '@/types'
import { savePlayerName } from '@/lib/firebase/players'

export function GameScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [walletAddress, setWalletAddress] = useState<Address | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [showHowTo, setShowHowTo] = useState(false)
  const [dontShowHowTo, setDontShowHowTo] = useState(false)
  const [autoStartGame, setAutoStartGame] = useState(false)

  const handleAuthenticated = useCallback((address: Address) => {
    setWalletAddress(address)
    setIsAuthenticated(true)
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
  }, [])

  const handleAutoStartHandled = useCallback(() => {
    setAutoStartGame(false)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hideHowTo = localStorage.getItem('base-rush-hide-howto')
    if (!hideHowTo) {
      setShowHowTo(true)
    }
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
          <WalletConnect
            onAuthenticated={handleAuthenticated}
            onDisconnected={handleDisconnected}
          />
        </div>
      </header>

      <main className="game-main">
        {showLeaderboard && <Leaderboard />}
        
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

        {!isAuthenticated ? (
          <div className="auth-prompt">
            <h2>Connect Your Wallet to Play</h2>
            <p>Connect your Base wallet to start playing and save your scores.</p>
            <p>Use the Connect button in the header to continue.</p>
          </div>
        ) : gameState?.isGameOver ? (
          <GameOverScreen 
            gameState={gameState}
            walletAddress={walletAddress!}
            onNewGame={handleNewGame}
          />
        ) : (
          <GameCanvas 
            walletAddress={walletAddress!}
            onGameStateChange={handleGameStateChange}
            autoStart={autoStartGame}
            onAutoStartHandled={handleAutoStartHandled}
          />
        )}
      </main>

      <footer className="game-footer">
        <p>Built for the Base ecosystem • Gasless gameplay • On-chain authentication</p>
      </footer>
    </div>
  )
}