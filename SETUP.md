# Setup Guide

Quick setup guide for Base Rush development environment.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] Firebase account (free tier works)
- [ ] Base-compatible wallet extension (MetaMask, Coinbase Wallet, etc.)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or select existing project
3. Name your project (e.g., "base-rush")
4. Enable Firestore Database:
   - Click "Firestore Database" in left sidebar
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location (choose closest to your users)
   - Click "Enable"

5. Get your Firebase config:
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Click the Web icon (`</>`)
   - Register app with a nickname (e.g., "Base Rush Web")
   - Copy the config values

### 3. Environment Variables

1. Copy the template file:
   ```bash
   cp env.template .env.local
   ```

2. Open `.env.local` and fill in your Firebase config values:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

3. Set your chain ID:
   - For development/testnet: `NEXT_PUBLIC_CHAIN_ID=84531` (Base Sepolia)
   - For production/mainnet: `NEXT_PUBLIC_CHAIN_ID=8453` (Base Mainnet)
   - This chain ID is used for both wagmi connection and SIWE authentication

### 4. Optional: WalletConnect Setup

If you want to enable WalletConnect connector:

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create a project
3. Copy your Project ID
4. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
   ```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 6. Test the Application

1. **Connect Wallet**:
   - Click "Connect Wallet"
   - Approve connection in your wallet
   - Switch to Base network if prompted

2. **Sign In**:
   - Click "Sign In to Play"
   - Approve the signature request (no gas required!)

3. **Play Game**:
   - Click "Start Game"
   - Use SPACE to jump (desktop) or tap (mobile)
   - Collect coins and avoid obstacles!

4. **Check Leaderboard**:
   - Click "Show Leaderboard" to see global scores
   - Your score should appear after game over

## Troubleshooting

### Firebase Connection Issues

- **Error**: "Firebase not initialized"
  - Check that all Firebase environment variables are set
  - Ensure `.env.local` is in the project root
  - Restart the dev server after changing `.env.local`

### Wallet Connection Issues

- **Wallet not appearing**: 
  - Ensure you have a Base-compatible wallet installed
  - Try refreshing the page
  - Check browser console for errors

- **Wrong network**:
  - The app is configured for Base Sepolia (testnet) by default
  - Switch your wallet to Base Sepolia network
  - Or change `NEXT_PUBLIC_CHAIN_ID=8453` for mainnet

### Game Not Starting

- Check browser console for errors
- Ensure canvas element is rendering
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Score Not Saving

- Check Firebase Firestore rules (should allow writes in test mode)
- Check browser console for Firebase errors
- Verify Firebase config values are correct

## Development Tips

- Use React DevTools for component debugging
- Check Network tab for Firebase/Firestore requests
- Use Wagmi DevTools (if installed) for Web3 debugging
- Hot reload should work automatically for most changes

## Next Steps

After setup, you can:
- Customize game difficulty in `game/GameEngine.ts`
- Modify UI styles in `app/globals.css`
- Add features following the project structure
- Deploy to Vercel or your preferred hosting

## Production Deployment

Before deploying to production:

1. **Firebase Security Rules**: Update Firestore rules from test mode to production rules
2. **Environment Variables**: Set production values in your hosting platform
3. **Chain ID**: Switch to Base mainnet (8453) if deploying for production
4. **Build**: Test production build locally with `npm run build && npm start`

See main README.md for more details.