/**
 * Firebase configuration
 * 
 * This file should be populated with your Firebase project credentials.
 * These values should come from environment variables for security.
 * 
 * Setup instructions:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Firestore Database (start in test mode for development)
 * 3. Copy your config values to .env.local
 * 4. Never commit .env.local to git
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
}

// Initialize Firebase only if it hasn't been initialized already
let app: FirebaseApp | undefined
let db: Firestore | undefined

function getMissingConfigKeys(config: Record<string, string>) {
  return Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key)
}

export function hasFirebaseConfig(): boolean {
  return getMissingConfigKeys(firebaseConfig).length === 0
}

/**
 * Lazily initialize and return Firestore instance.
 * Ensures single initialization and validates environment variables.
 */
export function getDb(): Firestore {
  if (typeof window === 'undefined') {
    throw new Error('Firebase client is not available on the server')
  }

  if (!app) {
    if (getApps().length === 0) {
      const missingKeys = getMissingConfigKeys(firebaseConfig)
      if (missingKeys.length > 0) {
        throw new Error(`Missing Firebase env vars: ${missingKeys.join(', ')}`)
      }
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }
  }

  if (!db) {
    db = getFirestore(app)
  }

  return db
}

export { app, db }