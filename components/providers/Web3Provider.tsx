'use client'

import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/lib/web3/config'

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
}