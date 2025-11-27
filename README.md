# Low Society

A digital version of the card game we love - a white trash twist on the classic High Society!

## About the Game

Low Society is an auction card game for 3-5 players where you bid with food stamp bills to collect trailer park treasures. Based on Reiner Knizia's High Society, with unique Low Society twists:

- **Random Bill Loss**: At game start, each player loses one random food stamp bill (not the highest or lowest)
- **Pawn Shop Trade**: Special card allows the winner to swap two cards between players
- **White Trash Theme**: Instead of luxury art, collect items like PBR beer, double-wide trailers, and pickup trucks

### How to Win

1. Bid on desirable items to gain status points
2. Avoid disgrace cards (or bid to make someone else take them!)
3. Collect prestige cards to multiply your score
4. **BUT BEWARE**: The player with the least money left is eliminated!
5. Highest score among remaining players wins

## Project Structure

```
Low-Society/
├── server/          # Node.js backend with Socket.io
│   ├── src/
│   │   ├── models/      # Game logic and card definitions
│   │   ├── services/    # Room management
│   │   └── server.js    # Main server file
│   └── package.json
├── client/          # React frontend with Vite
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # Socket.io client
│   │   ├── styles/      # CSS styles
│   │   └── App.jsx      # Main app
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Low-Society.git
   cd Low-Society
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Running the Game

You need to run both the server and client in separate terminals.

#### Terminal 1 - Start the Server
```bash
cd server
npm run dev
```
Server will run on `http://localhost:3003`

#### Terminal 2 - Start the Client
```bash
cd client
npm run dev
```
Client will run on `http://localhost:3004`

### Playing the Game

1. Open `http://localhost:3004` in your browser
2. Enter your name
3. Click "Create Room" to start a new game
4. Share the 4-letter room code with friends
5. Friends can click "Join Room" and enter the code
6. Once you have 3-5 players, the host can start the game

## Game Rules

### Setup
- Each player receives 11 food stamp bills: $1, $2, $3, $4, $5, $6, $8, $10, $12, $15, $20, $25
- **LOW SOCIETY RULE**: One random bill (not $1 or $25) is removed from each player at game start
- 17 item cards are shuffled into a deck

### Item Cards
- **Luxury Cards (10)**: Worth 1-10 status points
- **Prestige Cards (3)**: Double your status (multiple cards multiply: 2 cards = 4x, 3 cards = 8x!)
- **Disgrace Cards (3)**:
  - Repo Man: Discard one luxury card
  - DUI Citation: -5 status points
  - Jerry Springer Episode: Halves your status
- **Pawn Shop Trade (1)**: Winner can swap two cards between any players

### Auction Types

**Standard Auction (Luxury, Prestige, Special cards)**
- Players bid to WIN the card
- You can increase your bid or pass
- Once you pass, you're out of this auction
- Last player standing wins and loses their bid money

**Reverse Auction (Disgrace cards)**
- Players bid to AVOID the card
- First player to pass LOSES and takes the card
- All other players lose their bid money

### Game End
- Game ends when the 4th "game-ending card" is revealed (3 Prestige + Jerry Springer)
- Player with LEAST money remaining is eliminated
- Remaining players calculate scores
- Highest score wins!

## Tech Stack

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: React, Vite
- **Real-time Communication**: WebSocket via Socket.io

## Development

### Server Development
```bash
cd server
npm run dev  # Uses nodemon for auto-reload
```

### Client Development
```bash
cd client
npm run dev  # Vite dev server with hot reload
```

### Production Build
```bash
# Build client
cd client
npm run build

# Run server in production
cd ../server
npm start
```

## Future Enhancements

- [ ] Game history and statistics
- [ ] Player accounts and authentication
- [ ] More Low Society themed cards
- [ ] Sound effects and animations
- [ ] Mobile-responsive improvements
- [ ] Reconnection handling
- [ ] Spectator mode

## Credits

Based on High Society by Reiner Knizia, reimagined with a Low Society twist!
