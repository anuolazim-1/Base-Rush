'use client'

import { useState, useEffect } from 'react'
import { getLeaderboard } from '@/lib/firebase/scores'
import type { LeaderboardEntry } from '@/types'

/**
 * Leaderboard component displays global top scores
 */
export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const entries = await getLeaderboard(50) // Top 50
      setLeaderboard(entries)
    } catch (err) {
      console.error('Error loading leaderboard:', err)
      setError('Failed to load leaderboard. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="leaderboard-panel">
      <div className="leaderboard-header">
        <div>
          <h2>Global Leaderboard</h2>
          <p className="leaderboard-note">Global (Wallet) only • Guest scores stay local</p>
        </div>
        <button onClick={loadLeaderboard} className="btn-secondary btn-small">
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="leaderboard-loading">
          <p>Loading leaderboard...</p>
        </div>
      )}

      {error && (
        <div className="leaderboard-error">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {leaderboard.length === 0 ? (
            <div className="leaderboard-empty">
              <p>No scores yet. Be the first to play!</p>
            </div>
          ) : (
            <div className="leaderboard-table">
              <div className="leaderboard-row header">
                <div className="rank-col">Rank</div>
                <div className="address-col">Player</div>
                <div className="score-col">Score</div>
                <div className="coins-col">Coins</div>
                <div className="distance-col">Distance</div>
              </div>
              
              {leaderboard.map((entry) => (
                <div key={`${entry.walletAddress}-${entry.rank}`} className="leaderboard-row">
                  <div className="rank-col">
                    {entry.rank === 1 && '🥇'}
                    {entry.rank === 2 && '🥈'}
                    {entry.rank === 3 && '🥉'}
                    {entry.rank > 3 && `#${entry.rank}`}
                  </div>
                  <div className="address-col" title={entry.walletAddress}>
                    {entry.playerName || formatAddress(entry.walletAddress)}
                  </div>
                  <div className="score-col">{entry.score.toLocaleString()}</div>
                  <div className="coins-col">{entry.coins}</div>
                  <div className="distance-col">{Math.floor(entry.distance)}m</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}