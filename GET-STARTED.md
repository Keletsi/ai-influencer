# 🚀 Get Started in 10 Minutes

The fastest way to get Motion Studio Pro running on your own.

## Prerequisites

- Node.js 18+ installed
- A code editor (VS Code recommended)
- 10 minutes of your time

---

## Step 1: Clone & Install (2 minutes)

```bash
git clone https://github.com/yourusername/motion-studio-pro.git
cd motion-studio-pro
npm install
```

---

## Step 2: Get API Keys (3 minutes)

### Kling AI API Keys
1. Go to [klingai.com](https://klingai.com)
2. Sign up for an account
3. Navigate to **API Settings**
4. Copy your **Access Key** and **Secret Key**

### Supabase Credentials
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project" (free tier is fine)
3. Wait ~2 minutes for setup
4. Go to **Settings** → **API**
5. Copy your **Project URL** and **anon/public key**

---

## Step 3: Configure Environment (1 minute)

```bash
# Copy the example file
cp .env.example .env

# Open .env in your editor and fill in:
VITE_KLING_ACCESS_KEY=paste_your_kling_access_key
VITE_KLING_SECRET_KEY=paste_your_kling_secret_key
VITE_KLING_API_BASE_URL=/api/kling

VITE_SUPABASE_URL=paste_your_supabase_url
VITE_SUPABASE_ANON_KEY=paste_your_supabase_anon_key
```

---

## Step 4: Setup Database (3 minutes)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the sidebar
3. Click **New Query**
4. Copy and paste the contents of:
   - `supabase/migrations/20260131_initial_schema.sql`
5. Click **Run**
6. Create another new query and paste:
   - `supabase/migrations/20260131_create_storage_buckets.sql`
7. Click **Run**

**Verify:**
- Go to **Table Editor** → You should see `generations` and `user_settings` tables
- Go to **Storage** → You should see `uploads` and `results` buckets

---

## Step 5: Run Locally (1 minute)

### Option A: Development Mode (Recommended for testing)

**Terminal 1** - Start the proxy server:
```bash
node server.js
```

Update your `.env`:
```env
VITE_KLING_API_BASE_URL=http://localhost:3001/api/v1
```

**Terminal 2** - Start the app:
```bash
npm run dev
```

### Option B: Production-Like Mode

Just run:
```bash
npm run dev
```

Make sure your `.env` has:
```env
VITE_KLING_API_BASE_URL=/api/kling
```

---

## Step 6: Open & Test! 🎉

Open [http://localhost:5173](http://localhost:5173)

1. Click **Sign Up** → Create an account
2. Upload a reference image
3. Upload a motion video
4. Click **Generate Video**
5. Watch the magic happen! ✨

---

## What's Next?

### For Local Development
- You're all set! Keep coding.
- The app hot-reloads when you make changes.

### For Production Deployment
- See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for Vercel, Railway, etc.
- Make sure to add your environment variables to your hosting platform.

### For Commercialization
- Read [COMMERCIALIZATION.md](./COMMERCIALIZATION.md) to learn how to sell this.
- Add payment integration (Stripe recommended).
- Customize branding and pricing.

---

## Troubleshooting

### "Network Error" when generating
- Make sure the proxy server is running (`node server.js`)
- Check that `VITE_KLING_API_BASE_URL` matches your setup
- Verify your Kling AI credentials are correct

### "Authentication Error"
- Check your Supabase URL and anon key
- Make sure the database migrations ran successfully
- Try signing out and back in

### "Storage Error"
- Verify the storage buckets exist in Supabase
- Make sure both buckets are set to **Public**
- Check bucket permissions in Supabase Storage settings

### Still Stuck?
- Check the [full setup guide](./docs/SETUP-GUIDE.md)
- Open an issue on GitHub
- Review the error messages in your browser console

---

## 🎯 Quick Commands Reference

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Start proxy server (local dev)
node server.js

# Run tests (if implemented)
npm test

# Lint code
npm run lint
```

---

## 📁 Project Structure (Quick Overview)

```
motion-studio-pro/
├── api/                    # Vercel serverless functions
│   └── kling.ts           # API proxy for production
├── src/
│   ├── components/        # React components
│   ├── pages/            # Application pages
│   ├── services/         # API services
│   └── contexts/         # React contexts
├── supabase/
│   └── migrations/       # Database setup files
├── server.js             # Local proxy server
└── .env                  # Your credentials (don't commit!)
```

---

## 💡 Tips

1. **Always use two terminals** when developing locally (one for proxy, one for app)
2. **Check browser console** for helpful error messages
3. **Supabase Dashboard** is your friend - monitor database, auth, and storage there
4. **Read the logs** - both in terminal and browser console
5. **Start simple** - test with small images/videos first

---

<p align="center">
  <strong>Happy Building! 🚀</strong>
</p>

<p align="center">
  Need help? Check out the <a href="./docs/">full documentation</a> or open an issue!
</p>
