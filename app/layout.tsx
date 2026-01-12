import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Web3Provider } from '@/components/providers/Web3Provider'
import { QueryClientProvider } from '@/components/providers/QueryClientProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Base Rush - Endless Runner on Base',
  description: 'An endless runner mini-game built for the Base ecosystem',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider>
          <Web3Provider>
            {children}
          </Web3Provider>
        </QueryClientProvider>
      </body>
    </html>
  )
}