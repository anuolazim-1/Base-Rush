/**
 * Firebase Firestore operations for player progression (off-chain points).
 */

import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { getDb } from './config'

const PLAYERS_COLLECTION = 'players'

export interface PlayerProgression {
  pointsBalance: number
  lifetimeCoins: number
  runsCount: number
}

export async function getPlayerProgression(walletAddress: string): Promise<PlayerProgression | null> {
  try {
    const db = getDb()
    const snapshot = await getDoc(doc(db, PLAYERS_COLLECTION, walletAddress.toLowerCase()))
    if (!snapshot.exists()) {
      return { pointsBalance: 0, lifetimeCoins: 0, runsCount: 0 }
    }
    const data = snapshot.data()
    return {
      pointsBalance: Number(data.pointsBalance ?? 0),
      lifetimeCoins: Number(data.lifetimeCoins ?? 0),
      runsCount: Number(data.runsCount ?? 0),
    }
  } catch (error) {
    console.warn('Progression unavailable:', error)
    return null
  }
}

export async function incrementPlayerProgression(
  walletAddress: string,
  coinsEarned: number
): Promise<PlayerProgression | null> {
  try {
    const db = getDb()
    const ref = doc(db, PLAYERS_COLLECTION, walletAddress.toLowerCase())

    return await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref)
      const data = snapshot.exists() ? snapshot.data() : {}
      const currentPoints = Number(data.pointsBalance ?? 0)
      const currentLifetime = Number(data.lifetimeCoins ?? 0)
      const currentRuns = Number(data.runsCount ?? 0)

      const next = {
        pointsBalance: currentPoints + coinsEarned,
        lifetimeCoins: currentLifetime + coinsEarned,
        runsCount: currentRuns + 1,
      }

      transaction.set(
        ref,
        {
          walletAddress: walletAddress.toLowerCase(),
          ...next,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      return next
    })
  } catch (error) {
    console.warn('Failed to update progression:', error)
    return null
  }
}
