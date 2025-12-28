# Low Society Documentation

Welcome to the Low Society game documentation! This directory contains guides, API documentation, and feature references.

## 📚 Table of Contents

### Getting Started
- **[Quick Start Guide](setup/QUICKSTART.md)** - Get up and running quickly
- **[Configuration Guide](setup/CONFIGURATION.md)** - Server and game configuration
- **[LAN Setup](setup/LAN-SETUP.md)** - Play on local network
- **[Cloudflare Setup](setup/CLOUDFLARE-SETUP.md)** - Deploy with Cloudflare Tunnels

### Development
- **[Socket API Documentation](SOCKET-API.md)** - Complete Socket.io event reference
- **[Testing Guide](TESTING.md)** - Running and writing tests
- **[TypeScript Definitions](../server/src/types/README.md)** - Type definitions for better IDE support

### Features
- **[Completed Features](COMPLETED-FEATURES.md)** - Major implemented features
  - Pawn Shop Trade card swap
  - Repo Man luxury discard
  - AI players
  - Chat system
  - And more...

### Project Management
- **[NEXT-STEPS.md](../NEXT-STEPS.md)** - Current roadmap and upcoming phases

## 🎮 Game Features

### Core Gameplay
- ✅ 3-5 player support
- ✅ Real-time multiplayer via Socket.io
- ✅ Standard and reverse auctions
- ✅ Special cards (Pawn Shop Trade, Repo Man)
- ✅ Prestige multiplier cards
- ✅ Player elimination mechanic

### AI System
- ✅ Auto-fill with AI players
- ✅ Intelligent bidding strategy
- ✅ Special card handling
- ✅ Chat system with tutorial and commentary modes
- ✅ Interactive storytelling for eliminated players

### UI/UX
- ✅ Responsive poker table layout
- ✅ Card animations
- ✅ Real-time state updates
- ✅ Mobile support with landscape lock
- ✅ Chat bubbles with dynamic arrows
- ✅ Game history panel

## 🏗️ Architecture

```
Low-Society/
├── server/           # Node.js backend
│   ├── src/
│   │   ├── models/       # Game logic
│   │   ├── ai/           # AI players
│   │   ├── handlers/     # Socket handlers
│   │   ├── shared/       # Shared constants
│   │   └── types/        # TypeScript definitions
│   └── test/         # Server tests
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API services
│   │   └── styles/       # CSS files
└── docs/             # Documentation
```

## 🔧 Technology Stack

**Backend:**
- Node.js + Express
- Socket.io for real-time communication
- ES6 modules

**Frontend:**
- React 18
- Vite build tool
- Socket.io client

**Testing:**
- Jest (server)
- Vitest (client)
- Integration tests

## 📝 Contributing

When adding new features:
1. Update relevant documentation
2. Add TypeScript definitions if applicable
3. Write tests for new functionality
4. Update NEXT-STEPS.md with progress

## 📂 Archive

Historical planning documents and completed phase documentation can be found in [archive/](archive/).
