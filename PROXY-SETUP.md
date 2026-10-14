# Backend Proxy Server Setup Guide

This guide explains how to set up and use the backend proxy server to securely access the Kling AI API.

## Why Use a Proxy Server?

1. **Security**: Keeps your API credentials safe on the server-side
2. **CORS**: Avoids Cross-Origin Resource Sharing issues
3. **Production-Ready**: Suitable for deployment to production environments
4. **API Key Protection**: Prevents exposure of your Secret Key in the browser

## Quick Start

### Option 1: Using the Proxy Server (Recommended)

**Step 1: Install proxy dependencies**

```bash
# Install dependencies for the proxy server
npm install express cors dotenv jose node-fetch
```

**Step 2: Start the proxy server**

```bash
# In a new terminal window
node server.js
```

You should see:
```
🚀 Kling AI Proxy Server started
📡 Listening on http://localhost:3001
🔒 API credentials: ✅ Configured
```

**Step 3: Update your .env file**

Change the API base URL to point to your local proxy:

```env
VITE_KLING_API_BASE_URL=http://localhost:3001/api/v1
```

**Step 4: Restart your frontend**

Stop and restart your Vite dev server to pick up the new environment variable:

```bash
# Stop the frontend (Ctrl+C)
# Then restart it
npm run dev
```

### Option 2: Direct Browser Access (Development Only)

⚠️ **Warning**: This method exposes your Secret Key in the browser. Only use for local testing!

Keep your current `.env` settings:

```env
VITE_KLING_API_BASE_URL=https://api.klingai.com
```

## Running Both Servers

You'll need two terminal windows:

**Terminal 1: Frontend**
```bash
npm run dev
# Runs on http://localhost:5173
```

**Terminal 2: Proxy Server**
```bash
node server.js
# Runs on http://localhost:3001
```

## Verification

### Check Proxy Health

Visit: `http://localhost:3001/health`

You should see:
```json
{
  "status": "ok",
  "message": "Kling AI Proxy Server is running",
  "configured": true
}
```

### Check Frontend

Visit: `http://localhost:5173`

The app should load without CORS errors in the browser console.

## Troubleshooting

### "API credentials not configured" error

**Problem**: The proxy server can't find your API keys.

**Solution**: Make sure your `.env` file contains:
```env
VITE_KLING_ACCESS_KEY=your_access_key_here
VITE_KLING_SECRET_KEY=your_secret_key_here
```

Then restart the proxy server.

### CORS errors still appearing

**Problem**: The frontend is still calling the Kling API directly.

**Solution**:
1. Update `.env` with the proxy URL
2. Restart the frontend dev server (`npm run dev`)
3. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

### Connection refused

**Problem**: Can't connect to `http://localhost:3001`

**Solution**: Make sure the proxy server is running in a separate terminal.

### Port 3001 already in use

**Problem**: Another application is using port 3001.

**Solution**: Change the port:
```bash
PORT=3002 node server.js
```

Then update `.env`:
```env
VITE_KLING_API_BASE_URL=http://localhost:3002/api/v1
```

## Production Deployment

### Deploy Proxy Server

Deploy `server.js` to:
- **Vercel**: Add as serverless function
- **Heroku**: Use Procfile: `web: node server.js`
- **Railway**: Direct deployment
- **DigitalOcean**: App Platform
- **AWS**: Elastic Beanstalk or Lambda

### Environment Variables

Set these on your hosting platform:
- `VITE_KLING_ACCESS_KEY`
- `VITE_KLING_SECRET_KEY`
- `PORT` (usually auto-set by the platform)

### Update Frontend

In your production frontend `.env.production`:
```env
VITE_KLING_API_BASE_URL=https://your-proxy-domain.com/api/v1
```

## Advanced Configuration

### Custom Port

Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3001; // Change 3001 to your preferred port
```

### Add Rate Limiting

Install express-rate-limit:
```bash
npm install express-rate-limit
```

Add to `server.js`:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Add Authentication

Protect your proxy with an API key:

```javascript
const PROXY_API_KEY = process.env.PROXY_API_KEY;

app.use('/api/', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== PROXY_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

## Architecture

```
┌──────────┐         ┌─────────────┐         ┌─────────────┐
│ Browser  │ ───────►│ Proxy Server│ ───────►│  Kling AI   │
│ (React)  │         │ (Express)   │         │     API     │
└──────────┘         └─────────────┘         └─────────────┘
                           │
                           ▼
                     ┌─────────────┐
                     │  JWT Token  │
                     │  Generation │
                     └─────────────┘
```

## Security Checklist

- [ ] API keys are in `.env` and never committed to git
- [ ] Using proxy server for all API requests
- [ ] Proxy server validates all requests
- [ ] Rate limiting enabled (for production)
- [ ] CORS configured for your domain only
- [ ] Regular monitoring of API usage
- [ ] Keys rotated periodically

## Support

If you encounter issues:

1. Check proxy server logs in the terminal
2. Check browser console for errors
3. Verify all environment variables are set
4. Review the [SECURITY.md](./SECURITY.md) file
5. Check Kling AI API status and documentation
