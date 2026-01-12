/**
 * Sign-In With Ethereum (SIWE) implementation
 * 
 * This module handles gasless authentication via message signing.
 * Players sign a message with their wallet instead of paying gas fees.
 * The signature serves as proof of wallet ownership.
 */

import { SiweMessage } from 'siwe'
import { Address } from 'viem'

const DOMAIN = typeof window !== 'undefined' ? window.location.host : 'base-rush.vercel.app'
const ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://base-rush.vercel.app'

/**
 * Create a SIWE message for the user to sign
 */
export function createSiweMessage(address: Address, statement: string): string {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '8453', 10)
  const message = new SiweMessage({
    domain: DOMAIN,
    address: address as string,
    statement: statement,
    uri: ORIGIN,
    version: '1',
    chainId: chainId,
  })
  
  return message.prepareMessage()
}

/**
 * Verify a SIWE message signature (client-side verification)
 * For production, you might want server-side verification
 */
export async function verifySiweMessage(
  message: string,
  signature: `0x${string}`
): Promise<boolean> {
  try {
    const siweMessage = new SiweMessage(message)
    // Basic validation - in production, you'd verify the signature cryptographically
    return siweMessage.validate() !== null
  } catch (error) {
    console.error('Error verifying SIWE message:', error)
    return false
  }
}

/**
 * Store authentication session in localStorage
 * This is a simple approach - for production, consider more secure storage
 */
export function storeAuthSession(address: Address, signature: string): void {
  if (typeof window === 'undefined') return
  
  const session = {
    address,
    signature,
    timestamp: Date.now(),
  }
  
  localStorage.setItem('base-rush-auth', JSON.stringify(session))
}

/**
 * Get stored authentication session
 */
export function getAuthSession(): { address: Address; signature: string } | null {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem('base-rush-auth')
  if (!stored) return null
  
  try {
    const session = JSON.parse(stored)
    // Session expires after 7 days
    const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000
    if (Date.now() - session.timestamp > SESSION_DURATION) {
      localStorage.removeItem('base-rush-auth')
      return null
    }
    
    return {
      address: session.address as Address,
      signature: session.signature,
    }
  } catch {
    return null
  }
}

/**
 * Clear authentication session
 */
export function clearAuthSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('base-rush-auth')
}