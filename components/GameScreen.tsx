'use client'

import { useState, useCallback } from 'react'
import { WalletConnect } from './WalletConnect'
import { GameCanvas } from './GameCanvas'
import { Leaderboard } from './Leaderboard'
import { GameOverScreen } from './GameOverScreen'
import type { Address } from 'viem'
import type { GameState } from '@/types'

export function GameScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [walletAddress, setWalletAddress] = useState<Address | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const handleAuthenticated = useCallback((address: Address) => {
    setWalletAddress(address)
    setIsAuthenticated(true)
  }, [])

  const handleGameStateChange = useCallback((state: GameState) => {
    setGameState(state)
  }, [])

  const handleNewGame = useCallback(() => {
    setGameState(null)
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
          {!isAuthenticated && <WalletConnect onAuthenticated={handleAuthenticated} />}
          {isAuthenticated && walletAddress && (
            <div className="wallet-badge">
              {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
            </div>
          )}
        </div>
      </header>

      <main className="game-main">
        {showLeaderboard && <Leaderboard />}
        
        {!isAuthenticated ? (
          <div className="auth-prompt">
            <h2>Connect Your Wallet to Play</h2>
            <p>Connect your Base wallet to start playing and save your scores!</p>
            <WalletConnect onAuthenticated={handleAuthenticated} />
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
          />
        )}
      </main>

      <footer className="game-footer">
        <p>Built for the Base ecosystem • Gasless gameplay • On-chain authentication</p>
      </footer>
    </div>
  )
}