# Base Rush 🏃‍♂️

**Live Demo:** https://base-rush.vercel.app

## About Base Rush

Base Rush is an endless runner mini-game built specifically for the Base ecosystem. Players control a character that runs continuously, avoiding obstacles and collecting Base Coins to increase their score. The game features wallet-based authentication using Sign-In With Ethereum (SIWE), allowing players to connect their Base-compatible wallet without paying gas fees. Scores are tracked on a competitive global leaderboard, creating a simple yet engaging Web3 gaming experience that demonstrates the potential of gasless interactions on Base.

The project serves as both a learning exercise and a portfolio demonstration of Web3 game development. It showcases integration with Base network, gasless authentication patterns, and off-chain data storage while maintaining a clean, beginner-friendly codebase. The game is designed to be browser-first with mobile support, making it accessible to casual Web3 users exploring the Base ecosystem.

## Current Limitations

This MVP version has several intentional limitations that reflect its current development stage:

- **Off-Chain Score Storage**: All scores are stored in Firebase Firestore (off-chain). There is no on-chain verification or permanent blockchain record of scores at this time.

- **Minimal Anti-Cheat**: Score validation is primarily client-side. The current implementation does not include robust server-side verification or cryptographic proof of gameplay authenticity.

- **Planned On-Chain Features**: On-chain score verification, smart contract integration, and enhanced anti-cheat mechanisms are planned for future iterations but are not currently implemented.

These limitations are acknowledged as part of the MVP scope, prioritizing simplicity and learning over production-grade security features.

## Planned Improvements

The following enhancements are planned for future iterations:

- **On-Chain Score Verification**: Implement smart contract-based score verification to create tamper-proof, permanent records on Base blockchain
- **ENS Support**: Display Ethereum Name Service (ENS) names on leaderboards instead of truncated wallet addresses
- **Enhanced Gameplay**: Add power-ups, multiple obstacle types, and dynamic difficulty scaling
- **Audio & Visual Polish**: Implement sound effects, background music, and improved sprite animations
- **Server-Side Validation**: Add backend verification for score submissions to prevent cheating
- **Player Profiles**: Create persistent player profiles with statistics and achievement tracking
- **Daily/Weekly Challenges**: Implement time-limited challenges with special rewards

## 🎮 Game Overview

Base Rush is a browser-first, mobile-friendly endless runner where players:
- Run endlessly while avoiding obstacles
- Collect Base Coins to boost their score
- Compete on a global leaderboard
- Authenticate using Web3 wallet (gasless SIWE)

## 🚀 Features

- **Gasless Authentication**: Sign-In With Ethereum (SIWE) - no gas fees required
- **Base Ecosystem**: Built specifically for Base network
- **Off-Chain Scoring**: Scores stored in Firebase (free tier compatible)
- **Global Leaderboard**: See how you stack up against other players
- **Mobile-Friendly**: Responsive design works on desktop and mobile devices
- **Simple Architecture**: Clean, beginner-friendly codebase

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- A Firebase account (free tier is sufficient)
- A Base-compatible wallet (MetaMask, Coinbase Wallet, etc.)

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd base-rush
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database:
   - Go to Firestore Database
   - Click "Create database"
   - Start in "Test mode" for development (or set up security rules for production)
3. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll to "Your apps" and select Web app
   - Copy the config values

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Web3 Configuration
# Use 84531 for Base Sepolia testnet, 8453 for Base mainnet
# This chain ID is used for both wagmi connection and SIWE authentication
NEXT_PUBLIC_CHAIN_ID=84531

# WalletConnect (optional)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
```

**⚠️ Important**: Never commit `.env.local` to git! It's already in `.gitignore`.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 How to Play

1. **Connect Wallet**: Click "Connect Wallet" and approve the connection in your wallet extension
2. **Sign In**: Sign the message to authenticate (no gas required!)
3. **Start Game**: Click "Start Game" or press SPACE
4. **Controls**:
   - **Desktop**: SPACE to jump, P to pause
   - **Mobile**: Tap to jump, use on-screen controls
5. **Goal**: Avoid obstacles, collect coins, and survive as long as possible!

## 🏗️ Project Structure

```
base-rush/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── providers/         # Context providers (Web3, QueryClient)
│   ├── GameScreen.tsx     # Main game screen orchestrator
│   ├── GameCanvas.tsx     # Canvas wrapper and game loop
│   ├── GameOverScreen.tsx # Game over UI and score submission
│   ├── Leaderboard.tsx    # Global leaderboard display
│   └── WalletConnect.tsx  # Wallet connection and SIWE
├── game/                  # Game logic (separated from UI)
│   └── GameEngine.ts      # Core game engine (physics, collisions, etc.)
├── lib/                   # Utilities and configurations
│   ├── auth/              # Authentication logic (SIWE)
│   ├── firebase/          # Firebase/Firestore operations
│   └── web3/              # Web3 configuration (wagmi/viem)
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## 🔐 Authentication Flow

Base Rush uses Sign-In With Ethereum (SIWE) for gasless authentication:

1. User connects wallet via wagmi
2. User signs a SIWE message (no transaction, no gas)
3. Signature is stored locally as authentication proof
4. Wallet address serves as player identifier
5. Scores are associated with wallet address

## 💾 Data Storage

All game data is stored off-chain in Firebase Firestore:

- **Collection**: `scores`
- **Document Structure**:
  ```typescript
  {
    walletAddress: string
    score: number
    coins: number
    distance: number
    timestamp: number
    playerName?: string (optional)
  }
  ```

**No blockchain transactions are required for gameplay or score saving.**

## 🔧 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Web3**: wagmi + viem (Base network support)
- **Authentication**: SIWE (Sign-In With Ethereum)
- **Database**: Firebase Firestore
- **Styling**: CSS Modules (globals.css)
- **Game Engine**: Custom Canvas-based engine

## 📝 Development Guidelines

### Code Organization

- **Gameplay Logic**: Separated in `game/GameEngine.ts` - no Web3 dependencies
- **Web3 Logic**: Isolated in `lib/web3/` and `lib/auth/`
- **Data Layer**: Centralized in `lib/firebase/`
- **UI Components**: React components in `components/`

### Best Practices

- Keep game logic separate from blockchain/auth logic
- Use TypeScript for type safety
- Comment complex logic, but prefer self-documenting code
- Follow Next.js 14 App Router conventions
- Mobile-first responsive design

### Adding Features

When adding features, consider:
- Is this a gameplay feature? → Add to `GameEngine.ts`
- Is this a UI feature? → Add to `components/`
- Is this data-related? → Add to `lib/firebase/`
- Does it require Web3? → Add to `lib/web3/` or `lib/auth/`

## 🚢 Deployment

### Deployment (Vercel)

Base Rush is fully compatible with Vercel's free tier and can be deployed with minimal configuration.

#### Quick Deploy Steps

1. Push your code to a GitHub repository
2. Import the project in [Vercel Dashboard](https://vercel.com/dashboard)
3. Configure environment variables (see below)
4. Deploy automatically on every push to main branch

#### Required Environment Variables

Add the following environment variables in your Vercel project settings:

**Firebase Configuration** (Required):
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Your Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Your Firebase app ID

**Web3 Configuration** (Required):
- `NEXT_PUBLIC_CHAIN_ID` - Set to `8453` for Base mainnet or `84531` for Base Sepolia testnet

**Optional**:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - Only needed if using WalletConnect connector

#### Firebase Free Tier Considerations

The Firebase free tier (Spark plan) includes:
- 1 GB storage
- 10 GB/month network egress
- 50K reads/day, 20K writes/day, 20K deletes/day

For a portfolio project with moderate traffic, the free tier should be sufficient. Monitor usage in the Firebase Console and upgrade to Blaze (pay-as-you-go) if needed. The free tier does not require a credit card.

#### Build Configuration

Vercel will automatically detect Next.js and use the default build settings. No additional configuration is required. The build command `next build` runs automatically.

### Alternative: Firebase Hosting

```bash
npm run build
firebase deploy
```

Note: Firebase Hosting requires additional Firebase CLI setup and configuration.

## 🔒 Security Considerations

- ✅ No private keys or secrets in code
- ✅ Environment variables for sensitive config
- ✅ Client-side signature verification (consider server-side for production)
- ⚠️ Firebase security rules should be configured for production
- ⚠️ Rate limiting should be considered for score submissions

## 📄 License

This project is intended as a portfolio/learning project. Feel free to use and modify as needed.

## 🤝 Contributing

This is a portfolio project, but suggestions and improvements are welcome! Please:
- Keep code simple and beginner-friendly
- Add comments for complex logic
- Follow existing code style
- Test on both desktop and mobile

## 🐛 Known Issues

- Client-side SIWE signature verification only (server-side verification recommended for production)
- Firebase security rules should be configured for production use
- No rate limiting on score submissions (should be implemented for production)

## 📚 Resources

- [Base Documentation](https://docs.base.org/)
- [wagmi Documentation](https://wagmi.sh/)
- [SIWE Specification](https://login.xyz/)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Next.js Documentation](https://nextjs.org/docs)

## 🙏 Acknowledgments

Built for the Base ecosystem community. Special thanks to the Base team and all the Web3 builders making this possible!

---

**Note**: This is an MVP/learning project. The architecture prioritizes simplicity and clarity over optimization. Perfect for learning Web3 game development! 🎮