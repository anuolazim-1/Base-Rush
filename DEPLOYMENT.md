# Vercel Deployment Guide

## Pre-Deployment Checklist

✅ Repository is initialized with git
✅ All code is committed
✅ `.gitignore` properly excludes sensitive files
✅ `package.json` has correct build scripts
✅ Environment variables documented in README

## Step-by-Step Vercel Deployment

### 1. Push to GitHub

First, ensure your code is pushed to a GitHub repository:

```bash
# If you haven't created a GitHub repo yet:
# 1. Go to https://github.com/new
# 2. Create a new repository (e.g., "base-rush")
# 3. Don't initialize with README (we already have one)

# Then push your code:
git remote add origin https://github.com/YOUR_USERNAME/base-rush.git
git branch -M main
git push -u origin main
```

**Note**: Make sure to commit `package-lock.json` if it exists:
```bash
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### 2. Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Sign in with your GitHub account (or create a Vercel account)
3. Click **"Add New Project"** or **"Import Project"**
4. Select your GitHub repository (`base-rush`)
5. Click **"Import"**

### 3. Configure Project Settings

Vercel will auto-detect Next.js. Verify these settings:

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (root)
- **Build Command**: `next build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

**No changes needed** - Vercel handles Next.js projects automatically.

### 4. Add Environment Variables

Before deploying, add all required environment variables in Vercel:

1. In the project configuration page, scroll to **"Environment Variables"**
2. Add each variable (click "Add" for each):

**Required Firebase Variables:**
```
NEXT_PUBLIC_FIREBASE_API_KEY = your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID = your-app-id
```

**Required Web3 Variable:**
```
NEXT_PUBLIC_CHAIN_ID = 84531
```
(Use `8453` for Base mainnet, `84531` for Base Sepolia testnet)

**Optional:**
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = your-project-id
```
(Only if using WalletConnect connector)

3. Make sure to select **"Production"**, **"Preview"**, and **"Development"** environments for each variable (or at least Production)

### 5. Deploy

1. Click **"Deploy"** button
2. Vercel will:
   - Install dependencies (`npm install`)
   - Run the build (`npm run build`)
   - Deploy to production
3. Monitor the build logs in real-time

### 6. Verify Deployment

After deployment completes:

1. **Check Build Logs**: Review for any errors or warnings
2. **Visit Live URL**: Click the deployment URL (e.g., `base-rush.vercel.app`)
3. **Test Functionality**:
   - Connect wallet
   - Sign in with SIWE
   - Play a game
   - Check leaderboard

### 7. Custom Domain (Optional)

If you want a custom domain:

1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

## Troubleshooting

### Build Fails

**Common Issues:**

1. **Missing Environment Variables**
   - Error: `Firebase not initialized` or `undefined` errors
   - Solution: Ensure all `NEXT_PUBLIC_*` variables are set in Vercel

2. **TypeScript Errors**
   - Error: Type errors during build
   - Solution: Run `npm run type-check` locally first, fix any errors

3. **Dependency Issues**
   - Error: Package not found or version conflicts
   - Solution: Ensure `package-lock.json` is committed and up to date

4. **Node Version**
   - Error: Node version mismatch
   - Solution: Vercel uses Node 18+ by default (matches your `engines` requirement)

### Runtime Errors

1. **Firebase Connection Issues**
   - Check Firebase console for quota limits
   - Verify environment variables are correct
   - Check Firebase security rules

2. **Wallet Connection Issues**
   - Ensure `NEXT_PUBLIC_CHAIN_ID` matches your target network
   - Check browser console for Web3 errors

### Viewing Build Logs

- Go to your project in Vercel Dashboard
- Click on the deployment
- View "Build Logs" tab for detailed output

## Post-Deployment

### Automatic Deployments

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every push to other branches or pull requests

### Environment Variables Updates

To update environment variables:
1. Go to Project Settings → Environment Variables
2. Edit or add variables
3. Redeploy (or wait for next push)

### Monitoring

- Check Vercel Analytics (if enabled)
- Monitor Firebase usage in Firebase Console
- Review error logs in Vercel Dashboard

## Expected Build Output

A successful build should show:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

Build time: ~2-3 minutes for first deployment

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Support](https://vercel.com/support)
