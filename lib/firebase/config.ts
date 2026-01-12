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

if (typeof window !== 'undefined') {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }
  db = getFirestore(app)
}

export { app, db }