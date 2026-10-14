# Deployment Guide

This guide covers different deployment options for Motion Studio Pro.

## Table of Contents

1. [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
2. [Railway Deployment](#railway-deployment)
3. [Netlify Deployment](#netlify-deployment)
4. [Docker Self-Hosting](#docker-self-hosting)
5. [Environment Variables Reference](#environment-variables-reference)

## Vercel Deployment (Recommended)

Vercel is the easiest deployment option with zero configuration needed.

### Prerequisites

- GitHub account with your code pushed to a repository
- Vercel account ([sign up free](https://vercel.com/signup))
- Supabase project set up ([see SETUP-GUIDE.md](./SETUP-GUIDE.md))
- Kling AI API credentials

### Step-by-Step

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/motion-studio-pro.git
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your `motion-studio-pro` repository
   - Vercel auto-detects Vite configuration

3. **Configure Environment Variables:**
   
   Click "Environment Variables" and add:
   
   ```
   VITE_KLING_ACCESS_KEY = your_kling_access_key
   VITE_KLING_SECRET_KEY = your_kling_secret_key
   VITE_KLING_API_BASE_URL = /api/kling-proxy
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app is live! 🎉

5. **Update Supabase URLs:**
   - Go to Supabase > Authentication > URL Configuration
   - Set **Site URL**: `https://your-app.vercel.app`
   - Add to **Redirect URLs**: `https://your-app.vercel.app/**`

### Custom Domain (Optional)

1. In Vercel project settings, go to **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update Supabase redirect URLs to use your custom domain

### Automatic Deployments

Vercel automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push
```

## Railway Deployment

Railway supports both frontend and backend in one platform.

### Step-by-Step

1. **Sign up at [railway.app](https://railway.app)**

2. **New Project from GitHub:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Build Settings:**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`
   - **Port**: `4173` (Vite preview port)

4. **Add Environment Variables:**
   - Go to project > Variables
   - Add all required environment variables
   - Use `/api/kling-proxy` for VITE_KLING_API_BASE_URL

5. **Deploy:**
   - Railway automatically builds and deploys
   - Get your public URL from the deployment

### Running Proxy Server on Railway

If you want to use the Express proxy server instead of serverless:

1. **Create Two Services:**
   - Service 1: Frontend (Vite)
   - Service 2: Backend (Node.js with server.js)

2. **Backend Service Settings:**
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Port**: `3001`

3. **Connect Services:**
   - Use Railway's internal networking
   - Set `VITE_KLING_API_BASE_URL` to backend service URL

## Netlify Deployment

Netlify is similar to Vercel for static site deployment.

### Step-by-Step

1. **Sign up at [netlify.com](https://netlify.com)**

2. **New Site from Git:**
   - Click "Add new site" > "Import an existing project"
   - Connect to GitHub
   - Select your repository

3. **Build Settings:**
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

4. **Environment Variables:**
   - Go to Site Settings > Environment Variables
   - Add all required variables
   - **Important**: For serverless functions, create a `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[functions]
  directory = "netlify/functions"
```

5. **Create Netlify Functions:**
   
   Create `netlify/functions/kling-proxy.ts`:
   
   ```typescript
   import { Handler } from '@netlify/functions';
   // Copy the logic from api/kling-proxy/[...path].ts
   ```

6. **Deploy:**
   - Netlify automatically deploys on git push
   - Get your URL: `https://your-site.netlify.app`

## Docker Self-Hosting

For complete control, deploy with Docker on your own VPS.

### Prerequisites

- VPS with Docker installed (DigitalOcean, Linode, AWS EC2, etc.)
- Domain name (optional)
- SSL certificate (use Let's Encrypt)

### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.js ./

RUN npm ci --only=production

EXPOSE 3001

CMD ["node", "server.js"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - VITE_KLING_ACCESS_KEY=${VITE_KLING_ACCESS_KEY}
      - VITE_KLING_SECRET_KEY=${VITE_KLING_SECRET_KEY}
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
      - PUBLIC_URL=https://yourdomain.com
    restart: unless-stopped
```

### Deploy

1. **On your VPS:**
   ```bash
   git clone https://github.com/yourusername/motion-studio-pro.git
   cd motion-studio-pro
   ```

2. **Create `.env` file:**
   ```bash
   nano .env
   # Add your environment variables
   ```

3. **Build and run:**
   ```bash
   docker-compose up -d
   ```

4. **Setup Nginx reverse proxy:**
   
   `/etc/nginx/sites-available/motionstudio`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Enable and restart Nginx:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/motionstudio /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Setup SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_KLING_ACCESS_KEY` | Kling AI Access Key | `A4LDgYpYANAHfTbRHmL...` |
| `VITE_KLING_SECRET_KEY` | Kling AI Secret Key | `nHAyDQCpECJmgD8QBNr...` |
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_KLING_API_BASE_URL` | API endpoint | `/api/kling-proxy` (production), `http://localhost:3001/api/v1` (dev) |
| `PUBLIC_URL` | Public URL for uploads | Auto-detected or `http://localhost:3001` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3001` |

### Production vs Development

**Development (`.env`):**
```env
VITE_KLING_API_BASE_URL=http://localhost:3001/api/v1
PUBLIC_URL=http://localhost:3001
```

**Production (Vercel/Netlify):**
```env
VITE_KLING_API_BASE_URL=/api/kling-proxy
# No PUBLIC_URL needed (uses deployment URL)
```

**Production (Docker):**
```env
VITE_KLING_API_BASE_URL=https://yourdomain.com/api/v1
PUBLIC_URL=https://yourdomain.com
```

## Monitoring and Logs

### Vercel

- Go to your project dashboard
- Click on a deployment
- View "Functions" tab for serverless function logs
- View "Logs" tab for build logs

### Railway

- Go to project dashboard
- Click "Deployments"
- Click on a deployment to view logs
- Use Railway CLI for real-time logs: `railway logs`

### Docker

View logs:
```bash
docker-compose logs -f app
```

## Scaling Considerations

### Vercel/Netlify

- Automatically scales with traffic
- Edge functions run globally
- Monitor usage in dashboard

### Railway

- Vertical scaling: Upgrade instance size
- Horizontal scaling: Add replicas
- Configure in project settings

### Docker

- Use Docker Swarm or Kubernetes for clustering
- Set up load balancer (Nginx, HAProxy)
- Monitor with Prometheus + Grafana

## Troubleshooting

### Build Fails

- Check that all dependencies are in `package.json`
- Verify Node.js version (18+)
- Check build logs for specific errors

### Environment Variables Not Working

- Ensure variables start with `VITE_` for frontend access
- Restart deployment after adding variables
- Check variable names for typos

### API Proxy Not Working

- Verify serverless function is deployed
- Check function logs for errors
- Ensure credentials are correct

### CORS Errors

- Check that API base URL is correct
- Verify CORS settings in serverless function
- Use browser dev tools to inspect requests

## Performance Optimization

1. **Enable Caching:**
   - Vercel and Netlify cache static assets automatically
   - Set cache headers for API responses

2. **Optimize Images:**
   - Use Supabase image transformations
   - Serve images via CDN

3. **Enable Gzip/Brotli:**
   - Automatically enabled on Vercel/Netlify
   - Configure in Nginx for self-hosted

4. **Monitor Performance:**
   - Use Vercel Analytics
   - Set up Sentry for error tracking
   - Monitor Supabase database performance

## Security Checklist

- ✅ Never commit `.env` file
- ✅ Use environment variables for all secrets
- ✅ Enable HTTPS (automatic on Vercel/Netlify)
- ✅ Set up RLS policies in Supabase
- ✅ Rotate API keys regularly
- ✅ Monitor for suspicious activity
- ✅ Keep dependencies updated
- ✅ Set up rate limiting (if needed)

## Cost Estimates

### Vercel (Free Tier)
- Hobby: Free
- Includes: 100GB bandwidth, unlimited requests
- Upgrade if: Heavy traffic (>100GB/month)

### Railway (Free Tier)
- Free: $5 credits/month
- Covers: Small apps with moderate traffic
- Upgrade if: Need more resources

### Self-Hosted VPS
- DigitalOcean Droplet: $6-12/month
- Includes: 1-2GB RAM, 25-50GB SSD
- Additional costs: Domain ($10-15/year), backups

### Supabase (Free Tier)
- Free: 500MB database, 1GB file storage
- Upgrade if: >10,000 active users or >1GB storage

---

Need help? Check [SETUP-GUIDE.md](./SETUP-GUIDE.md) or open an issue!
