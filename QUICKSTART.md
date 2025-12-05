# Quick Start Guide

Get up and running with Low Society in 2 minutes!

## Install and Run (First Time)

### 1. Install Dependencies

Open two terminal windows and run:

**Terminal 1 (Server):**
```bash
cd server
npm install
npm run dev
```
Server will start on `http://localhost:3003`

**Terminal 2 (Client):**
```bash
cd client
npm install
npm run dev
```
Client will start on `http://localhost:3004`

### 2. Play the Game

1. Open your browser to `http://localhost:3004`
2. Enter your name
3. Create a room (gives you a 4-letter code) or join an existing room
4. Wait for 3-5 players to join
5. Host clicks "Start Game"
6. Play Low Society!

## Subsequent Runs

After the first install, just run:

**Terminal 1:**
```bash
cd server && npm run dev
```

**Terminal 2:**
```bash
cd client && npm run dev
```

## Quick Reference

### What's Different from High Society?

1. **Random Bill Loss**: Each player loses one random bill at game start (not $1 or $25)
2. **Pawn Shop Trade**: New special card lets winner swap two cards between players
3. **White Trash Theme**: Food stamps instead of money, trailer park items instead of art

### Card Themes

**Luxury Items (Win to collect)**
- Pabst Blue Ribbon 6-Pack (1)
- NASCAR Baseball Cap (2)
- Muddin' Truck Tires (3)
- Velvet Elvis Painting (4)
- Strange Mongrel Dog (5)
- Jack Daniel's Whiskey (6)
- Camouflage Couch (7)
- Above Ground Pool (8)
- Lifted Pickup Truck (9)
- Double Wide Trailer (10)

**Prestige Items (Double your score!)**
- Mullet Hairstyle
- Monster Truck Rally Tickets
- Confederate Flag Collection

**Disgrace Items (Bid to avoid!)**
- Repo Man (Lose a luxury item)
- DUI Citation (-5 points)
- Jerry Springer Episode (Halve your score)

**Special**
- Pawn Shop Trade (Swap two cards)

### Tips

1. **Watch your money**: You can have the highest score but still lose if you're the poorest!
2. **Prestige multiplies**: Two prestige cards = 4x your score, three = 8x!
3. **Reverse auctions**: When a disgrace card appears, the first to pass loses
4. **Pawn Shop**: Use it strategically to hurt opponents or help yourself

## Running Tests

**Before committing code, run the tests:**

**Server tests (92 tests):**
```bash
cd server && npm test
```

**Client tests (28 tests):**
```bash
cd client && npm test
```

All 120 tests should pass! Tests run without needing a server.

## Troubleshooting

**Can't connect?**
- Make sure both server (port 3003) and client (port 3004) are running
- Check that no other apps are using these ports
- Look for errors in the server terminal

**Room not found?**
- Room codes are 4 uppercase letters (e.g., ABC1)
- Rooms auto-delete after 4 hours of inactivity
- Host must create room before others can join

**Players not syncing?**
- Refresh the browser
- Check the server terminal for errors
- Check browser console (F12) for client errors

**Not your turn?**
- Low Society uses turn-based bidding
- Wait for your turn (indicated by "← TURN" marker)
- Player who won/lost previous auction goes first

**Game stuck after Pawn Shop Trade or Repo Man?**
- Known limitation: UI not implemented for these cards
- Game will continue to next auction automatically (Pawn Shop)
- Repo Man requires manual selection (not yet implemented)

## Development

**Ports:**
- Server: `http://localhost:3003`
- Client: `http://localhost:3004`

**Logs:**
- Server logs in Terminal 1 show all game events
- Browser console (F12) shows client-side events
- Check both for debugging

**Hot Reload:**
- Server: Uses nodemon (auto-restarts on file changes)
- Client: Uses Vite HMR (instant updates)

**Documentation:**
- [README.md](README.md) - Full project overview
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Implementation details
- [TESTING.md](TESTING.md) - Test suite documentation
