# AI-influencer ðŸŽ¬

> An AI-powered virtual influencer studio - turn a still portrait into an on-camera performance by transferring motion from a driver clip.

**Open Source Template** â€¢ **Production Ready** â€¢ **Self-Hostable** â€¢ **100% Free to Commercialize**

> ðŸ’¼ **Want to sell this as your own product?** Check out the [Commercialization Guide](./COMMERCIALIZATION.md) â†’

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Kling AI](https://img.shields.io/badge/Kling-2.6-blue)](https://klingai.com)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-green)](https://supabase.com)

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/Deploy-Vercel-black" alt="Deploy">
  <img src="https://img.shields.io/badge/Auth-Supabase-green" alt="Auth">
</p>

---

## âœ¨ Features

### Core Features
- ðŸŽ¬ **AI Motion Transfer** - Apply motion from any video to your images
- ðŸ” **Complete Authentication** - Email/password + OAuth (Google, GitHub)
- ðŸ’¾ **Database Integration** - Save and manage your generation history
- ðŸ“¦ **Cloud Storage** - Automatic file upload to Supabase Storage
- ðŸŽ¨ **Beautiful UI** - Modern, responsive design with dark/light themes
- âš¡ **Real-time Progress** - Live updates during video generation
- ðŸ“Š **Generation History** - View, download, and manage all your creations
- ðŸ‘¤ **User Profiles** - Manage settings and optional per-user API keys

### Technical Features
- âœ… Full TypeScript support
- âœ… Row Level Security (RLS) for data isolation
- âœ… Serverless-ready (Vercel/Netlify)
- âœ… Self-hostable with Docker
- âœ… API proxy for secure credential handling
- âœ… Responsive design for mobile and desktop
- âœ… Production-grade error handling
- âœ… Optimized for performance

### Advanced Controls
- ðŸŽ›ï¸ **Motion Strength** - Fine-tune intensity (0-100%)
- ðŸŽ¯ **Match Mode** - Structure preservation or motion matching
- â±ï¸ **Duration** - 5 or 10 second videos
- ðŸŽ¨ **Quality** - 720p (HD) or 1080p (Full HD)
- ðŸ“ **Aspect Ratios** - 16:9 (landscape), 9:16 (portrait), or 1:1 (square)
- â›” **Negative Prompt** - Describe unwanted elements

---

## ðŸš€ Quick Start

Get your own AI-influencer instance running in **under 15 minutes**!

ðŸ“– **[â†’ Read the Full Quick Start Guide](./GET-STARTED.md)**

### Ultra-Quick Version

```bash
# 1. Clone and install
git clone https://github.com/yourusername/motion-studio-pro.git
cd motion-studio-pro
npm install

# 2. Setup environment
cp .env.example .env
# Fill in your Kling AI + Supabase credentials

# 3. Run database migrations
# (Copy SQL from supabase/migrations/ to your Supabase SQL Editor)

# 4. Start the app
npm run dev
```

**Open**: [http://localhost:5173](http://localhost:5173)

That's it! Create an account and start generating. ðŸŽ‰

---

## ðŸ“š Documentation

Comprehensive guides for setup, deployment, and commercialization:

- âš¡ **[Quick Start Guide](./GET-STARTED.md)** - Get running in 10 minutes
- ðŸ’¼ **[Commercialization Guide](./COMMERCIALIZATION.md)** - How to sell this as your own product
- âœ… **[Launch Checklist](./LAUNCH-CHECKLIST.md)** - Step-by-step launch plan for your business
- ðŸ“– **[Complete Setup Guide](./docs/SETUP-GUIDE.md)** - Detailed setup instructions
- ðŸš€ **[Deployment Guide](./docs/DEPLOYMENT.md)** - Deploy to Vercel, Railway, Netlify, or Docker
- ðŸ—„ï¸ **[Database Schema](./docs/DATABASE.md)** - Database structure and queries

---

## ðŸŽ¯ Use Cases

Perfect for:
- ðŸŽ¥ Content creators and video editors
- ðŸ“± Social media managers
- ðŸŽ¨ Digital artists and designers
- ðŸ¢ Marketing agencies
- ðŸŽ¬ Film and animation studios
- ðŸš€ Startups building AI video products
- ðŸ“š Educators and researchers

---

## ðŸ› ï¸ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- shadcn/ui (component library)
- Framer Motion (animations)

**Backend:**
- Supabase (PostgreSQL + Auth + Storage)
- Express.js (local proxy server)
- Vercel Serverless Functions (production)

**External:**
- Kling AI API (motion transfer processing)

---

## ðŸ“¦ Project Structure

```
motion-studio-pro/
â”œâ”€â”€ api/                        # Vercel serverless functions
â”‚   â””â”€â”€ kling-proxy/           # API proxy endpoint
â”œâ”€â”€ docs/                       # Documentation
â”‚   â”œâ”€â”€ SETUP-GUIDE.md
â”‚   â”œâ”€â”€ DEPLOYMENT.md
â”‚   â””â”€â”€ DATABASE.md
â”œâ”€â”€ public/                     # Static assets
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ auth/              # Auth components (login, signup, etc.)
â”‚   â”‚   â”œâ”€â”€ studio/            # Studio components (workspace, history)
â”‚   â”‚   â””â”€â”€ ui/                # Reusable UI components
â”‚   â”œâ”€â”€ contexts/              # React contexts (Auth)
â”‚   â”œâ”€â”€ pages/                 # Application pages
â”‚   â”œâ”€â”€ services/              # API services (Kling, Supabase, Storage)
â”‚   â””â”€â”€ types/                 # TypeScript type definitions
â”œâ”€â”€ supabase/
â”‚   â”œâ”€â”€ migrations/            # Database migrations
â”‚   â””â”€â”€ config.toml            # Supabase local dev config
â”œâ”€â”€ server.js                  # Express proxy server (local dev)
â””â”€â”€ vercel.json               # Vercel configuration
```

---

## ðŸŒ Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/motion-studio-pro)

1. Click the button above
2. Add environment variables
3. Deploy!

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for other platforms.

---

## âš™ï¸ Configuration

### Environment Variables

Create a `.env` file with:

```env
# Kling AI API
VITE_KLING_ACCESS_KEY=your_access_key
VITE_KLING_SECRET_KEY=your_secret_key
VITE_KLING_API_BASE_URL=http://localhost:3001/api/v1

# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

See [SETUP-GUIDE.md](./docs/SETUP-GUIDE.md) for detailed configuration.

---

## ðŸ”’ Security

This template includes production-grade security:

- âœ… Row Level Security (RLS) policies
- âœ… Secure credential storage (environment variables)
- âœ… API keys never exposed to frontend
- âœ… User data isolation
- âœ… HTTPS-only in production
- âœ… OAuth support for social login

**Important**: Never commit your `.env` file!

---

## ðŸ¤ Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## ðŸ“ License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

**What this means for you:**
- âœ… Use commercially (sell it!)
- âœ… Modify as you wish
- âœ… Private use
- âœ… Distribute freely
- âœ… No revenue sharing required

Want to turn this into your business? Read the [Commercialization Guide](./COMMERCIALIZATION.md)!

---

## ðŸ™ Acknowledgments

- **Kling AI** - For the amazing motion transfer API
- **Supabase** - For the excellent backend platform
- **shadcn/ui** - For beautiful UI components
- **Vercel** - For seamless deployment

---

## ðŸ’¡ Inspiration & Ideas

Want to extend this template? Here are some ideas:

- ðŸ’³ Add subscription system with Stripe
- ðŸ“Š Usage analytics dashboard
- ðŸŽ¨ Custom branding options
- ðŸ”— Shareable generation links
- ðŸŽ¥ Batch processing
- ðŸŒ Multi-language support
- ðŸ“± Progressive Web App (PWA)
- ðŸ”” Email notifications
- ðŸŽ¯ Generation templates/presets
- ðŸ‘¥ Team collaboration features

---

## ðŸ“ž Support

- ðŸ“– **Documentation**: [docs/](./docs/)
- ðŸ› **Issues**: [GitHub Issues](https://github.com/yourusername/motion-studio-pro/issues)
- ðŸ’¬ **Discussions**: [GitHub Discussions](https://github.com/yourusername/motion-studio-pro/discussions)
- ðŸ“§ **Email**: your@email.com

---

## â­ Star History

If you find this project useful, please consider giving it a star!

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/motion-studio-pro&type=Date)](https://star-history.com/#yourusername/motion-studio-pro&Date)

---

## ðŸŽ¬ Demo

**Live Demo**: Coming soon!

---

<p align="center">
  <strong>Built with â¤ï¸ using React, TypeScript, Supabase, and Kling AI</strong>
</p>

<p align="center">
  <a href="https://github.com/yourusername/motion-studio-pro">â­ Star on GitHub</a> â€¢
  <a href="./docs/SETUP-GUIDE.md">ðŸ“š Setup Guide</a> â€¢
  <a href="./docs/DEPLOYMENT.md">ðŸš€ Deploy</a>
</p>

# ai-influencer
