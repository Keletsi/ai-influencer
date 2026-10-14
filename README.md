# AI-influencer 🎬

> An AI-powered virtual influencer studio - turn a still portrait into an on-camera performance by transferring motion from a driver clip.

**Open Source Template** • **Production Ready** • **Self-Hostable** • **100% Free to Commercialize**

> 💼 **Want to sell this as your own product?** Check out the [Commercialization Guide](./COMMERCIALIZATION.md) →

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

## ✨ Features

### Core Features
- 🎬 **AI Motion Transfer** - Apply motion from any video to your images
- 🔐 **Complete Authentication** - Email/password + OAuth (Google, GitHub)
- 💾 **Database Integration** - Save and manage your generation history
- 📦 **Cloud Storage** - Automatic file upload to Supabase Storage
- 🎨 **Beautiful UI** - Modern, responsive design with dark/light themes
- ⚡ **Real-time Progress** - Live updates during video generation
- 📊 **Generation History** - View, download, and manage all your creations
- 👤 **User Profiles** - Manage settings and optional per-user API keys

### Technical Features
- ✅ Full TypeScript support
- ✅ Row Level Security (RLS) for data isolation
- ✅ Serverless-ready (Vercel/Netlify)
- ✅ Self-hostable with Docker
- ✅ API proxy for secure credential handling
- ✅ Responsive design for mobile and desktop
- ✅ Production-grade error handling
- ✅ Optimized for performance

### Advanced Controls
- 🎛️ **Motion Strength** - Fine-tune intensity (0-100%)
- 🎯 **Match Mode** - Structure preservation or motion matching
- ⏱️ **Duration** - 5 or 10 second videos
- 🎨 **Quality** - 720p (HD) or 1080p (Full HD)
- 📐 **Aspect Ratios** - 16:9 (landscape), 9:16 (portrait), or 1:1 (square)
- ⛔ **Negative Prompt** - Describe unwanted elements

---

## 🚀 Quick Start

Get your own Motion Studio Pro instance running in **under 15 minutes**!

📖 **[→ Read the Full Quick Start Guide](./GET-STARTED.md)**

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

That's it! Create an account and start generating. 🎉

---

## 📚 Documentation

Comprehensive guides for setup, deployment, and commercialization:

- ⚡ **[Quick Start Guide](./GET-STARTED.md)** - Get running in 10 minutes
- 💼 **[Commercialization Guide](./COMMERCIALIZATION.md)** - How to sell this as your own product
- ✅ **[Launch Checklist](./LAUNCH-CHECKLIST.md)** - Step-by-step launch plan for your business
- 📖 **[Complete Setup Guide](./docs/SETUP-GUIDE.md)** - Detailed setup instructions
- 🚀 **[Deployment Guide](./docs/DEPLOYMENT.md)** - Deploy to Vercel, Railway, Netlify, or Docker
- 🗄️ **[Database Schema](./docs/DATABASE.md)** - Database structure and queries

---

## 🎯 Use Cases

Perfect for:
- 🎥 Content creators and video editors
- 📱 Social media managers
- 🎨 Digital artists and designers
- 🏢 Marketing agencies
- 🎬 Film and animation studios
- 🚀 Startups building AI video products
- 📚 Educators and researchers

---

## 🛠️ Tech Stack

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

## 📦 Project Structure

```
motion-studio-pro/
├── api/                        # Vercel serverless functions
│   └── kling-proxy/           # API proxy endpoint
├── docs/                       # Documentation
│   ├── SETUP-GUIDE.md
│   ├── DEPLOYMENT.md
│   └── DATABASE.md
├── public/                     # Static assets
├── src/
│   ├── components/
│   │   ├── auth/              # Auth components (login, signup, etc.)
│   │   ├── studio/            # Studio components (workspace, history)
│   │   └── ui/                # Reusable UI components
│   ├── contexts/              # React contexts (Auth)
│   ├── pages/                 # Application pages
│   ├── services/              # API services (Kling, Supabase, Storage)
│   └── types/                 # TypeScript type definitions
├── supabase/
│   ├── migrations/            # Database migrations
│   └── config.toml            # Supabase local dev config
├── server.js                  # Express proxy server (local dev)
└── vercel.json               # Vercel configuration
```

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/motion-studio-pro)

1. Click the button above
2. Add environment variables
3. Deploy!

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for other platforms.

---

## ⚙️ Configuration

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

## 🔒 Security

This template includes production-grade security:

- ✅ Row Level Security (RLS) policies
- ✅ Secure credential storage (environment variables)
- ✅ API keys never exposed to frontend
- ✅ User data isolation
- ✅ HTTPS-only in production
- ✅ OAuth support for social login

**Important**: Never commit your `.env` file!

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

**What this means for you:**
- ✅ Use commercially (sell it!)
- ✅ Modify as you wish
- ✅ Private use
- ✅ Distribute freely
- ✅ No revenue sharing required

Want to turn this into your business? Read the [Commercialization Guide](./COMMERCIALIZATION.md)!

---

## 🙏 Acknowledgments

- **Kling AI** - For the amazing motion transfer API
- **Supabase** - For the excellent backend platform
- **shadcn/ui** - For beautiful UI components
- **Vercel** - For seamless deployment

---

## 💡 Inspiration & Ideas

Want to extend this template? Here are some ideas:

- 💳 Add subscription system with Stripe
- 📊 Usage analytics dashboard
- 🎨 Custom branding options
- 🔗 Shareable generation links
- 🎥 Batch processing
- 🌐 Multi-language support
- 📱 Progressive Web App (PWA)
- 🔔 Email notifications
- 🎯 Generation templates/presets
- 👥 Team collaboration features

---

## 📞 Support

- 📖 **Documentation**: [docs/](./docs/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/motion-studio-pro/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/motion-studio-pro/discussions)
- 📧 **Email**: your@email.com

---

## ⭐ Star History

If you find this project useful, please consider giving it a star!

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/motion-studio-pro&type=Date)](https://star-history.com/#yourusername/motion-studio-pro&Date)

---

## 🎬 Demo

**Live Demo**: Coming soon!

---

<p align="center">
  <strong>Built with ❤️ using React, TypeScript, Supabase, and Kling AI</strong>
</p>

<p align="center">
  <a href="https://github.com/yourusername/motion-studio-pro">⭐ Star on GitHub</a> •
  <a href="./docs/SETUP-GUIDE.md">📚 Setup Guide</a> •
  <a href="./docs/DEPLOYMENT.md">🚀 Deploy</a>
</p>

# ai-influencer