// Automated Low Society Game Tester
// Simulates 4 AI players playing a complete game

import { io } from 'socket.io-client';
import { writeFileSync, appendFileSync } from 'fs';

const SERVER_URL = 'http://localhost:3003';
const LOG_FILE = 'test-log.txt';
const ERROR_FILE = 'test-errors.txt';

// Clear previous logs
try {
  writeFileSync(LOG_FILE, `=== Low Society Integration Test Started ${new Date().toISOString()} ===\n\n`);
  writeFileSync(ERROR_FILE, `=== Error Log ${new Date().toISOString()} ===\n\n`);
} catch (err) {
  console.error('Failed to initialize log files:', err);
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  try {
    appendFileSync(LOG_FILE, logMessage);
  } catch (err) {
    console.error('Failed to write to log:', err);
  }
}

function logError(message, error) {
  const timestamp = new Date().toISOString();
  const errorMessage = `[${timestamp}] ${message}\nError: ${error?.message || error}\nStack: ${error?.stack || 'N/A'}\n\n`;
  console.error(message, error);
  try {
    appendFileSync(ERROR_FILE, errorMessage);
  } catch (err) {
    console.error('Failed to write to error log:', err);
  }
}

class AIPlayer {
  constructor(name, playerNumber) {
    this.name = name;
    this.playerNumber = playerNumber;
    this.socket = null;
    this.gameState = null;
    this.privateState = null;
    this.roomCode = null;
    this.myId = null;
    this.isHost = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(SERVER_URL, {
        autoConnect: true,
        reconnection: false
      });

      this.socket.on('connect', () => {
        this.myId = this.socket.id;
        log(`${this.name} connected (ID: ${this.myId})`);
        this.setupListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        logError(`${this.name} connection error`, error);
        reject(error);
      });

      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
  }

  setupListeners() {
    this.socket.on('player_joined', ({ publicState }) => {
      this.gameState = publicState;
      log(`${this.name} sees player joined. Players: ${publicState.playerCount}`);
    });

    this.socket.on('game_started', ({ publicState }) => {
      this.gameState = publicState;
      log(`${this.name} sees game started!`);
    });

    this.socket.on('private_state_update', ({ privateState }) => {
      this.privateState = privateState;
      log(`${this.name} received private state update`);
    });

    this.socket.on('bid_placed', ({ publicState, playerId, bidTotal }) => {
      this.gameState = publicState;
      const playerName = publicState.players.find(p => p.id === playerId)?.name;
      log(`${this.name} sees ${playerName} placed bid of $${bidTotal}`);
    });

    this.socket.on('player_passed', ({ publicState, playerId }) => {
      this.gameState = publicState;
      const playerName = publicState.players.find(p => p.id === playerId)?.name;
      log(`${this.name} sees ${playerName} passed`);
    });

    this.socket.on('cards_swapped', ({ publicState }) => {
      this.gameState = publicState;
      log(`${this.name} sees cards were swapped (Pawn Shop Trade)`);
    });

    this.socket.on('luxury_card_discarded', ({ publicState, playerId }) => {
      this.gameState = publicState;
      const playerName = publicState.players.find(p => p.id === playerId)?.name;
      log(`${this.name} sees ${playerName} discarded a luxury card (Repo Man)`);
    });

    this.socket.on('disconnect', () => {
      log(`${this.name} disconnected`);
    });
  }

  async createRoom() {
    return new Promise((resolve, reject) => {
      this.socket.emit('create_room', { playerName: this.name }, (response) => {
        if (response.success) {
          this.roomCode = response.roomCode;
          this.gameState = response.publicState;
          this.privateState = response.privateState;
          this.isHost = true;
          log(`${this.name} created room ${this.roomCode}`);
          resolve(this.roomCode);
        } else {
          logError(`${this.name} failed to create room`, response.error);
          reject(new Error(response.error));
        }
      });
    });
  }

  async joinRoom(roomCode) {
    return new Promise((resolve, reject) => {
      this.socket.emit('join_room', { roomCode, playerName: this.name }, (response) => {
        if (response.success) {
          this.roomCode = roomCode;
          this.gameState = response.publicState;
          this.privateState = response.privateState;
          log(`${this.name} joined room ${roomCode}`);
          resolve();
        } else {
          logError(`${this.name} failed to join room`, response.error);
          reject(new Error(response.error));
        }
      });
    });
  }

  async startGame() {
    return new Promise((resolve, reject) => {
      this.socket.emit('start_game', {}, (response) => {
        if (response.success) {
          log(`${this.name} started the game`);
          resolve();
        } else {
          logError(`${this.name} failed to start game`, response.error);
          reject(new Error(response.error));
        }
      });
    });
  }

  async makeMove() {
    try {
      if (!this.gameState || !this.privateState) {
        log(`${this.name} waiting for game state...`);
        return;
      }

      const phase = this.gameState.phase;

      // Handle Card Swap Phase
      if (phase === 'card_swap') {
        if (this.gameState.currentAuction?.swapWinner === this.myId) {
          await this.handleCardSwap();
        } else {
          log(`${this.name} waiting for card swap...`);
        }
        return;
      }

      // Handle Discard Luxury Phase
      if (phase === 'discard_luxury') {
        if (this.gameState.discardingPlayerId === this.myId) {
          await this.handleDiscardLuxury();
        } else {
          log(`${this.name} waiting for luxury discard...`);
        }
        return;
      }

      // Handle Auction Phase
      if (phase === 'auction') {
        const myPlayer = this.gameState.players.find(p => p.id === this.myId);
        const isMyTurn = this.gameState.currentAuction?.currentTurnPlayerId === this.myId;

        if (!isMyTurn) {
          log(`${this.name} waiting for turn...`);
          return;
        }

        if (myPlayer.hasPassed) {
          log(`${this.name} has already passed`);
          return;
        }

        // AI decision: 70% chance to bid, 30% chance to pass
        const shouldBid = Math.random() > 0.3;

        if (shouldBid) {
          await this.placeBid();
        } else {
          await this.pass();
        }
      }
    } catch (error) {
      logError(`${this.name} error in makeMove`, error);
    }
  }

  async placeBid() {
    try {
      const availableMoney = this.privateState.moneyHand.filter(m => m.available);
      const currentBid = this.gameState.currentAuction?.highestBid || 0;

      // Find money cards that would beat current bid
      const validBids = [];
      for (let i = 0; i < availableMoney.length; i++) {
        const money = availableMoney[i];
        const myCurrentBid = this.privateState.currentBid || [];
        const currentTotal = myCurrentBid.reduce((sum, id) => {
          const card = this.privateState.moneyHand.find(m => m.id === id);
          return sum + (card?.value || 0);
        }, 0);

        if (currentTotal + money.value > currentBid) {
          validBids.push(money);
        }
      }

      if (validBids.length === 0) {
        log(`${this.name} has no valid bids, must pass`);
        await this.pass();
        return;
      }

      // Pick a random valid bid
      const chosenMoney = validBids[Math.floor(Math.random() * validBids.length)];

      return new Promise((resolve, reject) => {
        this.socket.emit('place_bid', { moneyCardIds: [chosenMoney.id] }, (response) => {
          if (response.success) {
            log(`${this.name} bid $${response.bidTotal}`);
            resolve();
          } else {
            logError(`${this.name} failed to place bid`, response.error);
            // If bid fails, try to pass instead
            this.pass().then(resolve).catch(reject);
          }
        });
      });
    } catch (error) {
      logError(`${this.name} error placing bid`, error);
    }
  }

  async pass() {
    return new Promise((resolve, reject) => {
      this.socket.emit('pass', {}, (response) => {
        if (response.success) {
          log(`${this.name} passed`);
          resolve();
        } else {
          logError(`${this.name} failed to pass`, response.error);
          reject(new Error(response.error));
        }
      });
    });
  }

  async handleCardSwap() {
    log(`${this.name} is selecting cards to swap (Pawn Shop Trade)`);

    // Collect all cards from all players
    const allCards = [];
    this.gameState.players.forEach(player => {
      player.wonCards.forEach(card => {
        allCards.push({ playerId: player.id, cardId: card.id, card });
      });
    });

    // Skip if not enough cards
    if (allCards.length < 2) {
      log(`${this.name} skipping swap (not enough cards)`);
      return new Promise((resolve) => {
        this.socket.emit('execute_card_swap', {
          player1Id: null,
          card1Id: null,
          player2Id: null,
          card2Id: null
        }, (response) => {
          if (response.success) {
            log(`${this.name} skipped card swap`);
            resolve();
          } else {
            logError(`${this.name} failed to skip swap`, response.error);
            resolve();
          }
        });
      });
    }

    // Pick 2 random cards to swap
    const card1 = allCards[Math.floor(Math.random() * allCards.length)];
    let card2;
    do {
      card2 = allCards[Math.floor(Math.random() * allCards.length)];
    } while (card1.playerId === card2.playerId && card1.cardId === card2.cardId);

    return new Promise((resolve) => {
      this.socket.emit('execute_card_swap', {
        player1Id: card1.playerId,
        card1Id: card1.cardId,
        player2Id: card2.playerId,
        card2Id: card2.cardId
      }, (response) => {
        if (response.success) {
          log(`${this.name} swapped cards`);
          resolve();
        } else {
          logError(`${this.name} failed to swap cards`, response.error);
          resolve();
        }
      });
    });
  }

  async handleDiscardLuxury() {
    log(`${this.name} must discard a luxury card (Repo Man)`);

    const myPlayer = this.gameState.players.find(p => p.id === this.myId);
    const luxuryCards = myPlayer.wonCards.filter(c => c.type === 'luxury');

    if (luxuryCards.length === 0) {
      logError(`${this.name} has no luxury cards to discard!`, new Error('No luxury cards'));
      return;
    }

    // Pick a random luxury card (prefer lowest value)
    const sortedLuxury = luxuryCards.sort((a, b) => (a.value || 0) - (b.value || 0));
    const cardToDiscard = sortedLuxury[0];

    return new Promise((resolve) => {
      this.socket.emit('discard_luxury_card', { cardId: cardToDiscard.id }, (response) => {
        if (response.success) {
          log(`${this.name} discarded ${cardToDiscard.name}`);
          resolve();
        } else {
          logError(`${this.name} failed to discard luxury`, response.error);
          resolve();
        }
      });
    });
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

async function runGame() {
  const players = [
    new AIPlayer('Alice', 1),
    new AIPlayer('Bob', 2),
    new AIPlayer('Charlie', 3),
    new AIPlayer('Dave', 4)
  ];

  try {
    log('=== Starting Integration Test ===');

    // Connect all players
    log('\n--- Connecting Players ---');
    for (const player of players) {
      await player.connect();
      await sleep(500);
    }

    // Create room with first player
    log('\n--- Creating Room ---');
    const roomCode = await players[0].createRoom();
    await sleep(1000);

    // Other players join
    log('\n--- Players Joining Room ---');
    for (let i = 1; i < players.length; i++) {
      await players[i].joinRoom(roomCode);
      await sleep(500);
    }

    // Start game
    log('\n--- Starting Game ---');
    await sleep(1000);
    await players[0].startGame();
    await sleep(2000);

    // Game loop
    log('\n--- Game Loop Started ---');
    let rounds = 0;
    const maxRounds = 200; // Safety limit

    while (rounds < maxRounds) {
      rounds++;

      // Check if game is over
      const gameState = players[0].gameState;
      if (!gameState) {
        log('Waiting for game state...');
        await sleep(1000);
        continue;
      }

      if (gameState.phase === 'game_over') {
        log('\n=== GAME OVER ===');
        log(`Final Results:`);
        gameState.results.forEach((result, idx) => {
          log(`${idx + 1}. ${result.name}: ${result.score} points (${result.eliminated ? 'ELIMINATED' : 'Qualified'})`);
        });
        break;
      }

      // Each player tries to make a move
      for (const player of players) {
        await player.makeMove();
        await sleep(300); // Small delay between moves
      }

      await sleep(500); // Delay between rounds
    }

    if (rounds >= maxRounds) {
      logError('Game exceeded maximum rounds', new Error('Max rounds reached'));
    }

    log('\n=== Test Complete ===');
    log(`Total rounds: ${rounds}`);

  } catch (error) {
    logError('Fatal error in test', error);
  } finally {
    // Disconnect all players
    log('\n--- Disconnecting Players ---');
    for (const player of players) {
      player.disconnect();
    }
    await sleep(1000);

    log('\n=== Integration Test Finished ===');
    log(`Check ${LOG_FILE} for full log`);
    log(`Check ${ERROR_FILE} for errors`);

    process.exit(0);
  }
}

// Run the test
runGame().catch(error => {
  logError('Unhandled error', error);
  process.exit(1);
});
