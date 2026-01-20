/**
 * Web3 configuration for Base network
 * 
 * This module configures wagmi/viem for Base blockchain interactions.
 * Base Chain ID: 8453 (mainnet) / 84531 (testnet)
 */

import { base, baseSepolia } from 'viem/chains'
import { http, createConfig } from 'wagmi'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// Use Base Sepolia testnet by default for development
// Switch to base (mainnet) for production
const targetChain = process.env.NEXT_PUBLIC_CHAIN_ID === '8453' ? base : baseSepolia

// Create transports object with both chains to satisfy TypeScript
const transports: Record<number, ReturnType<typeof http>> = {
  [base.id]: http(),
  [baseSepolia.id]: http(),
}

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim()
const enableWalletConnect = typeof window !== 'undefined' && !!walletConnectProjectId

export const wagmiConfig = createConfig({
  chains: [targetChain],
  connectors: [
    injected(),
    metaMask(),
    ...(enableWalletConnect ? [walletConnect({ projectId: walletConnectProjectId })] : []),
  ],
  transports,
})

// Export chain info for use in components
export const CHAIN_ID = targetChain.id
export const CHAIN_NAME = targetChain.name