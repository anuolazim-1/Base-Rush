/**
 * Firebase Firestore operations for player profiles
 */

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { getDb } from './config'

const PLAYERS_COLLECTION = 'players'

export async function savePlayerName(walletAddress: string, playerName: string): Promise<void> {
  const db = getDb()
  await setDoc(
    doc(db, PLAYERS_COLLECTION, walletAddress.toLowerCase()),
    {
      walletAddress: walletAddress.toLowerCase(),
      playerName,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  )
}

export async function getPlayerName(walletAddress: string): Promise<string | null> {
  const db = getDb()
  const snapshot = await getDoc(doc(db, PLAYERS_COLLECTION, walletAddress.toLowerCase()))
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  return typeof data.playerName === 'string' ? data.playerName : null
}
