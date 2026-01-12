'use client'

import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { useState, useEffect, useCallback } from 'react'
import { createSiweMessage, storeAuthSession, getAuthSession, clearAuthSession } from '@/lib/auth/siwe'
import type { Address } from 'viem'

interface WalletConnectProps {
  onAuthenticated: (address: Address) => void
}

/**
 * WalletConnect component handles Base wallet connection and SIWE authentication
 * 
 * Flow:
 * 1. User clicks "Connect Wallet"
 * 2. Wallet extension prompts for connection
 * 3. Once connected, user signs a SIWE message (gasless)
 * 4. Signature is stored as authentication proof
 */
export function WalletConnect({ onAuthenticated }: WalletConnectProps) {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const [isSigning, setIsSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = useCallback(async () => {
    if (!address) return

    setIsSigning(true)
    setError(null)

    try {
      const message = createSiweMessage(
        address,
        'Sign in to Base Rush to play and save your scores!'
      )

      const signature = await signMessageAsync({ message })
      storeAuthSession(address, signature)
      onAuthenticated(address)
    } catch (err) {
      console.error('Sign-in error:', err)
      setError('Failed to sign in. Please try again.')
      // If user rejects signature, disconnect wallet
      disconnect()
    } finally {
      setIsSigning(false)
    }
  }, [address, signMessageAsync, onAuthenticated, disconnect])

  // Check for existing auth session on mount
  useEffect(() => {
    const session = getAuthSession()
    if (session && address && session.address.toLowerCase() === address.toLowerCase()) {
      onAuthenticated(address)
    }
  }, [address, onAuthenticated])

  // When wallet connects, prompt for SIWE signature
  useEffect(() => {
    if (isConnected && address && !getAuthSession()) {
      handleSignIn()
    }
  }, [isConnected, address, handleSignIn])

  const handleConnect = () => {
    setError(null)
    // Try MetaMask first, then injected connector
    const connector = connectors.find(c => c.id === 'metaMask') || connectors[0]
    if (connector) {
      connect({ connector })
    }
  }

  const handleDisconnect = () => {
    clearAuthSession()
    disconnect()
  }

  if (isConnected && address) {
    const session = getAuthSession()
    if (session) {
      return (
        <div className="wallet-connected">
          <div className="wallet-info">
            <span className="wallet-address">
              {`${address.slice(0, 6)}...${address.slice(-4)}`}
            </span>
            <button onClick={handleDisconnect} className="btn-disconnect">
              Disconnect
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="wallet-auth">
        {isSigning ? (
          <button disabled className="btn-primary">
            Signing message...
          </button>
        ) : (
          <button onClick={handleSignIn} className="btn-primary">
            Sign In to Play
          </button>
        )}
        {error && <p className="error-message">{error}</p>}
      </div>
    )
  }

  return (
    <div className="wallet-connect">
      <button 
        onClick={handleConnect} 
        disabled={isPending}
        className="btn-primary"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  )
}