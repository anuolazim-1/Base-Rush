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
import type { PlayerScore, LeaderboardEntry } from '@/types'

const SCORES_COLLECTION = 'scores'
const LEADERBOARD_LIMIT = 100

/**
 * Save a player's score to Firestore
 */
export async function saveScore(score: PlayerScore): Promise<void> {
  const db = getDb()

  try {
    await addDoc(collection(db, SCORES_COLLECTION), {
      ...score,
      timestamp: Timestamp.fromMillis(score.timestamp),
    })
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
      limit(1)
    )

    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    return docToPlayerScore(doc)
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
    const q = query(
      collection(db, SCORES_COLLECTION),
      orderBy('score', 'desc'),
      limit(limitCount)
    )

    const querySnapshot = await getDocs(q)
    
    const leaderboard: LeaderboardEntry[] = []
    querySnapshot.docs.forEach((doc, index) => {
      const score = docToPlayerScore(doc)
      leaderboard.push({
        ...score,
        rank: index + 1,
      })
    })

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