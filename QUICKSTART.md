# Quick Start Guide

## Install and Run (First Time)

### 1. Install Dependencies

Open two terminal windows and run:

**Terminal 1 (Server):**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 (Client):**
```bash
cd client
npm install
npm run dev
```

### 2. Play the Game

1. Open your browser to `http://localhost:3004`
2. Enter your name
3. Create or join a room
4. Play Low Society!

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

## Troubleshooting

**Can't connect?**
- Make sure both server (port 3001) and client (port 3000) are running
- Check that no other apps are using these ports

**Room not found?**
- Room codes are case-sensitive (use uppercase)
- Rooms auto-delete after 4 hours of inactivity

**Players not syncing?**
- Refresh the browser
- Check the server terminal for errors
- Make sure all players are on the same network (if testing locally)

## Development

**Server runs on:** `http://localhost:3003`
**Client runs on:** `http://localhost:3004`

**Server logs** show all game events in Terminal 1
**Browser console** shows client-side events (F12 in browser)
