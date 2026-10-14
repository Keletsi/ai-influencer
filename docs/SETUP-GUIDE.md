# Motion Studio Pro - Complete Setup Guide

This guide will walk you through setting up Motion Studio Pro with your own credentials, from cloning the repository to deploying it online.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Kling AI Setup](#kling-ai-setup)
4. [Local Development](#local-development)
5. [Vercel Deployment](#vercel-deployment)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **Git** installed
- A **Supabase account** (free tier available at [supabase.com](https://supabase.com))
- A **Kling AI account** ([Sign up here](https://klingai.com))
- A **Vercel account** (optional, for deployment - [vercel.com](https://vercel.com))

## Supabase Setup

### Step 1: Create a New Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in the details:
   - **Name**: motion-studio-pro (or your preferred name)
   - **Database Password**: Save this securely (you'll need it later)
   - **Region**: Choose the closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for your project to be provisioned

### Step 2: Get Your Supabase Credentials

1. In your project dashboard, click the **Settings** icon (gear) in the sidebar
2. Go to **API** settings
3. Copy these two values (you'll need them shortly):
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

### Step 3: Run Database Migrations

1. In your Supabase project, go to the **SQL Editor** (database icon in sidebar)
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/20260131_initial_schema.sql` from this repository
4. Paste it into the SQL editor
5. Click "Run" or press Cmd/Ctrl + Enter
6. You should see "Success. No rows returned"

This creates:
- `generations` table - stores your video generation history
- `user_settings` table - stores user preferences and optional API keys
- Row Level Security (RLS) policies - ensures users only see their own data

### Step 4: Create Storage Buckets

1. In your Supabase project, go to **Storage** (folder icon in sidebar)
2. Click "Create a new bucket"
3. Create the first bucket:
   - **Name**: `uploads`
   - **Public bucket**: ✅ Checked
   - Click "Create bucket"
4. Create the second bucket:
   - **Name**: `results`
   - **Public bucket**: ✅ Checked
   - Click "Create bucket"

### Step 5: Configure Storage Policies (Optional but Recommended)

For better security, you can add RLS policies to storage buckets:

1. Go to **Storage** > **Policies**
2. For the `uploads` bucket, add these policies:
   - **INSERT**: `(bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1])`
   - **SELECT**: `(bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1])`
   - **DELETE**: `(bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1])`
3. Repeat for the `results` bucket

### Step 6: (Optional) Enable OAuth Providers

If you want users to sign in with Google or GitHub:

1. Go to **Authentication** > **Providers**
2. Enable the providers you want:
   - **Google**: Requires Google Cloud Console setup ([Guide](https://supabase.com/docs/guides/auth/social-login/auth-google))
   - **GitHub**: Requires GitHub OAuth App ([Guide](https://supabase.com/docs/guides/auth/social-login/auth-github))

## Kling AI Setup

### Step 1: Sign Up for Kling AI

1. Go to [https://klingai.com/](https://klingai.com/)
2. Click "Sign Up" and create an account
3. Verify your email address

### Step 2: Get Your API Credentials

1. Log in to your Kling AI account
2. Navigate to your **Account Settings** or **API Dashboard**
3. Look for **API Keys** or **Developer Settings**
4. Generate or copy your:
   - **Access Key** (public identifier)
   - **Secret Key** (keep this private!)

> **Important**: Never commit your Secret Key to version control or share it publicly!

## Local Development

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/motion-studio-pro.git
cd motion-studio-pro
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Open `.env` in your text editor and fill in your credentials:

```env
# Kling AI API Configuration
VITE_KLING_ACCESS_KEY=your_kling_access_key_here
VITE_KLING_SECRET_KEY=your_kling_secret_key_here
VITE_KLING_API_BASE_URL=http://localhost:3001/api/v1

# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key_here

# Optional: Public URL for local proxy server
PUBLIC_URL=http://localhost:3001
```

### Step 4: Start the Development Server

You have two options for local development:

#### Option A: With Proxy Server (Recommended)

This keeps your API keys secure on the server side.

**Terminal 1** - Start the proxy server:
```bash
node server.js
```

You should see:
```
🚀 Kling AI Proxy Server started
📡 Local: http://localhost:3001
🔒 API credentials: ✅ Configured
```

**Terminal 2** - Start the frontend:
```bash
npm run dev
```

You should see:
```
VITE v5.x.x ready in xxx ms
➜ Local: http://localhost:5173/
```

#### Option B: Vercel Dev (For testing serverless functions)

```bash
npm install -g vercel
vercel dev
```

### Step 5: Open the Application

1. Open your browser to [http://localhost:5173](http://localhost:5173)
2. You'll be redirected to the login page
3. Click "Sign up" to create an account
4. Verify your email (check Supabase > Authentication > Users to verify)
5. Log in and start creating!

## Vercel Deployment

### Step 1: Prepare Your Repository

1. Create a GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/motion-studio-pro.git
git push -u origin main
```

2. Make sure `.env` is in `.gitignore` (it already is!)

### Step 2: Connect to Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your `motion-studio-pro` repository
4. Vercel will auto-detect it as a Vite project

### Step 3: Configure Environment Variables

In the Vercel import screen, add these environment variables:

```
VITE_KLING_ACCESS_KEY = your_kling_access_key_here
VITE_KLING_SECRET_KEY = your_kling_secret_key_here
VITE_KLING_API_BASE_URL = /api/kling-proxy
VITE_SUPABASE_URL = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = your_anon_public_key_here
```

**Important**: For production, use `/api/kling-proxy` for the API base URL (not localhost!)

### Step 4: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for the build to complete
3. Your app is now live! 🎉

### Step 5: Update Supabase URLs

1. Go to your Supabase project > **Authentication** > **URL Configuration**
2. Add your Vercel URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/**`

### Step 6: (Optional) Add Custom Domain

1. In your Vercel project, go to **Settings** > **Domains**
2. Add your custom domain (e.g., `motionstudio.com`)
3. Follow Vercel's DNS configuration instructions
4. Update Supabase URL Configuration with your custom domain

## Troubleshooting

### Issue: "API key not configured" error

**Solution**: 
- Check that your `.env` file exists and has the correct values
- Restart your development server (`Ctrl+C`, then `npm run dev`)
- For Vite apps, environment variables must start with `VITE_`

### Issue: "Supabase not configured" warning

**Solution**:
- Verify your Supabase URL and anon key are correct
- Check that the keys don't have extra spaces or quotes
- Make sure you're using the **anon public** key, not the service role key

### Issue: Cannot sign up / Email not being sent

**Solution**:
- Check Supabase > **Authentication** > **Email Templates**
- Make sure "Enable Email Confirmations" is OFF for development (Settings > Auth > Email)
- For production, configure an SMTP provider in Supabase settings

### Issue: "Row Level Security policy violation"

**Solution**:
- Make sure you ran the database migrations correctly
- Go to Supabase > **Database** > **Tables** > `generations`
- Check that RLS is enabled and policies exist
- Try re-running the migration SQL

### Issue: Files not uploading to Supabase Storage

**Solution**:
- Verify the `uploads` and `results` buckets exist and are public
- Check bucket policies in Storage > Policies
- Look at browser console for specific error messages

### Issue: Vercel deployment fails

**Solution**:
- Check the build logs in Vercel dashboard
- Make sure all environment variables are set correctly
- Verify `package.json` has all dependencies listed
- Try building locally first: `npm run build`

### Issue: Video generation works locally but fails on Vercel

**Solution**:
- Check that `VITE_KLING_API_BASE_URL=/api/kling-proxy` in Vercel environment variables
- Verify the serverless function is deployed: check `/api/kling-proxy/` folder exists
- Check Vercel function logs for errors

## Need More Help?

- **Supabase Documentation**: [docs.supabase.com](https://docs.supabase.com)
- **Kling AI Support**: Contact through their website
- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **GitHub Issues**: Open an issue in the repository

## Next Steps

- ✅ Customize the branding and styling
- ✅ Add your own logo
- ✅ Configure email templates in Supabase
- ✅ Set up analytics (optional)
- ✅ Enable OAuth providers for easier sign-in
- ✅ Add usage limits or subscription system

Congratulations! You now have your own Motion Studio Pro instance running! 🎬✨
