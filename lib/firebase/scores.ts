/**
 * Firebase Firestore operations for scores and leaderboard
 * 
 * This module handles all off-chain data persistence:
 * - Saving player scores
 * - Fetching high scores
 * - Global leaderboard queries
 */

import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  where,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore'
import { getDb } from './config'
import { getPlayerName } from './players'
import type { PlayerScore, LeaderboardEntry } from '@/types'

const SCORES_COLLECTION = 'scores'
const LEADERBOARD_LIMIT = 100
const LEADERBOARD_FETCH_MULTIPLIER = 5

/**
 * Save a player's score to Firestore
 */
export async function saveScore(score: PlayerScore): Promise<void> {
  const db = getDb()

  try {
    const payload = Object.fromEntries(
      Object.entries({
        ...score,
        timestamp: Timestamp.fromMillis(score.timestamp),
      }).filter(([, value]) => value !== undefined)
    )
    await addDoc(collection(db, SCORES_COLLECTION), payload)
  } catch (error) {
    console.error('Error saving score:', error)
    throw error
  }
}

/**
 * Get the highest score for a specific wallet address
 */
export async function getHighScore(walletAddress: string): Promise<PlayerScore | null> {
  const db = getDb()

  try {
    const q = query(
      collection(db, SCORES_COLLECTION),
      where('walletAddress', '==', walletAddress),
      orderBy('score', 'desc'),
      limit(25)
    )

    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }

    const scores = querySnapshot.docs.map((doc) => docToPlayerScore(doc))
    scores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.distance !== a.distance) return b.distance - a.distance
      return b.timestamp - a.timestamp
    })
    return scores[0] ?? null
  } catch (error) {
    console.error('Error fetching high score:', error)
    return null
  }
}

/**
 * Get the global leaderboard (top N scores)
 */
export async function getLeaderboard(limitCount: number = LEADERBOARD_LIMIT): Promise<LeaderboardEntry[]> {
  const db = getDb()

  try {
    const fetchLimit = Math.max(limitCount * LEADERBOARD_FETCH_MULTIPLIER, limitCount)
    const q = query(
      collection(db, SCORES_COLLECTION),
      orderBy('score', 'desc'),
      limit(fetchLimit)
    )

    const querySnapshot = await getDocs(q)
    
    const runs = querySnapshot.docs.map((doc) => docToPlayerScore(doc))
    runs.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.distance !== a.distance) return b.distance - a.distance
      return b.timestamp - a.timestamp
    })

    // Leaderboard model: best score per wallet
    const seen = new Set<string>()
    const leaderboard: LeaderboardEntry[] = []
    for (const run of runs) {
      if (seen.has(run.walletAddress)) continue
      seen.add(run.walletAddress)
      leaderboard.push({
        ...run,
        rank: leaderboard.length + 1,
      })
      if (leaderboard.length >= limitCount) break
    }

    const missingNames = leaderboard.filter((entry) => !entry.playerName)
    if (missingNames.length > 0) {
      const nameLookups = await Promise.all(
        missingNames.map(async (entry) => ({
          walletAddress: entry.walletAddress,
          playerName: await getPlayerName(entry.walletAddress),
        }))
      )
      const nameMap = new Map(nameLookups.map((item) => [item.walletAddress, item.playerName]))
      leaderboard.forEach((entry) => {
        const name = nameMap.get(entry.walletAddress)
        if (name) {
          entry.playerName = name
        }
      })
    }

    return leaderboard
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }
}

/**
 * Helper function to convert Firestore document to PlayerScore
 */
function docToPlayerScore(doc: QueryDocumentSnapshot<DocumentData>): PlayerScore {
  const data = doc.data()
  const timestamp = data.timestamp instanceof Timestamp 
    ? data.timestamp.toMillis() 
    : data.timestamp || Date.now()

  return {
    walletAddress: data.walletAddress,
    score: data.score,
    coins: data.coins,
    distance: data.distance,
    timestamp: timestamp,
    playerName: data.playerName,
  }
}