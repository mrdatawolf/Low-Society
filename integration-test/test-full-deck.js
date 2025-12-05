// Test that all 15 cards are played in a game
import io from 'socket.io-client';

const SERVER_URL = 'http://localhost:3003';

class TestPlayer {
  constructor(name) {
    this.name = name;
    this.socket = null;
    this.gameState = null;
    this.privateState = null;
    this.cardsRevealed = [];
  }

  connect() {
    return new Promise((resolve) => {
      this.socket = io(SERVER_URL);

      this.socket.on('connect', () => {
        console.log(`${this.name} connected`);
        resolve();
      });

      this.socket.on('auction_started', (data) => {
        this.gameState = data.publicState;
        if (data.publicState.currentCard) {
          const card = data.publicState.currentCard;
          this.cardsRevealed.push(card);
          console.log(`Card ${this.cardsRevealed.length}: ${card.name}`);
        }
      });

      this.socket.on('player_bid', (data) => {
        this.gameState = data.publicState;
      });

      this.socket.on('player_passed', (data) => {
        this.gameState = data.publicState;
      });

      this.socket.on('private_state', (data) => {
        this.privateState = data;
      });

      this.socket.on('game_over', (data) => {
        this.gameState = data.publicState;
      });
    });
  }

  async makeMove() {
    if (!this.gameState || this.gameState.phase === 'game_over') return;

    const me = this.gameState.players.find(p => p.id === this.socket.id);
    if (!me || me.hasPassed) return;

    if (this.gameState.currentAuction?.currentTurnPlayerId === this.socket.id) {
      // Randomly bid or pass (70% bid)
      if (Math.random() > 0.3) {
        const availableMoney = this.privateState.moneyHand.filter(m => m.available);
        if (availableMoney.length > 0) {
          const card = availableMoney[Math.floor(Math.random() * availableMoney.length)];
          const currentBid = this.gameState.currentAuction.highestBid;

          if (card.value > currentBid) {
            await new Promise(resolve => {
              this.socket.emit('place_bid', { moneyCardIds: [card.id] }, () => resolve());
            });
            return;
          }
        }
      }

      // Pass
      await new Promise(resolve => {
        this.socket.emit('pass', {}, () => resolve());
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('=== Full Deck Test ===\n');

  // Create players
  const players = [
    new TestPlayer('Alice'),
    new TestPlayer('Bob'),
    new TestPlayer('Charlie')
  ];

  // Connect all players
  for (const player of players) {
    await player.connect();
  }

  await sleep(500);

  // Create room
  console.log('\nCreating room...');
  const roomCode = await new Promise(resolve => {
    players[0].socket.emit('create_room', { playerName: players[0].name }, (response) => {
      resolve(response.roomCode);
    });
  });

  console.log(`Room created: ${roomCode}\n`);

  // Other players join
  for (let i = 1; i < players.length; i++) {
    await new Promise(resolve => {
      players[i].socket.emit('join_room', {
        playerName: players[i].name,
        roomCode
      }, () => resolve());
    });
    await sleep(200);
  }

  console.log('All players joined\n');

  // Start game
  await new Promise(resolve => {
    players[0].socket.emit('start_game', {}, () => resolve());
  });

  console.log('Game started\n');
  await sleep(2000);

  // Game loop
  let rounds = 0;
  const maxRounds = 200;

  while (rounds < maxRounds) {
    rounds++;

    // Check if game is over
    if (players[0].gameState?.phase === 'game_over') {
      console.log('\n=== GAME OVER ===');
      break;
    }

    // All players try to make moves
    for (const player of players) {
      try {
        await player.makeMove();
        await sleep(100);
      } catch (err) {
        // Ignore errors
      }
    }

    await sleep(200);
  }

  // Count unique cards
  const uniqueCards = new Set(players[0].cardsRevealed.map(c => c.id));
  console.log(`\nTotal unique cards revealed: ${uniqueCards.size}`);
  console.log(`Expected: 15`);

  if (uniqueCards.size === 15) {
    console.log('✅ SUCCESS: All 15 cards were played!');
  } else {
    console.log(`❌ FAILURE: Only ${uniqueCards.size} cards were played`);
  }

  console.log('\nCards revealed:');
  players[0].cardsRevealed.forEach((card, idx) => {
    console.log(`  ${idx + 1}. ${card.name} (${card.type})`);
  });

  // Disconnect
  for (const player of players) {
    player.disconnect();
  }

  await sleep(500);
  process.exit(0);
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
