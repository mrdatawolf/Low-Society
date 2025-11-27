// Game state model
import { buildItemDeck, createMoneyHand, removeRandomBill, isGameEndingCard, calculateScore, CARD_TYPES } from './cards.js';

export const GAME_PHASES = {
  WAITING: 'waiting',           // Waiting for players
  STARTING: 'starting',         // Game is starting (removing random bills)
  AUCTION: 'auction',           // Active auction
  CARD_SWAP: 'card_swap',       // Pawn Shop Trade - winner selecting cards to swap
  GAME_OVER: 'game_over'        // Game ended
};

export const AUCTION_TYPES = {
  STANDARD: 'standard',         // Bidding to win
  REVERSE: 'reverse'            // Bidding to avoid
};

export class Game {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.players = [];
    this.phase = GAME_PHASES.WAITING;
    this.itemDeck = [];
    this.currentCard = null;
    this.currentAuction = null;
    this.gameEndingCardsRevealed = 0;
    this.host = null;
    this.createdAt = Date.now();
    this.results = null;
    this.nextStartingPlayerId = null; // Track who starts the next auction
  }

  // Add a player to the game
  addPlayer(playerId, playerName) {
    if (this.players.length >= 5) {
      throw new Error('Room is full (max 5 players)');
    }

    if (this.phase !== GAME_PHASES.WAITING) {
      throw new Error('Game already in progress');
    }

    const player = {
      id: playerId,
      name: playerName,
      moneyHand: createMoneyHand(),
      wonCards: [],
      currentBid: [],
      hasPassed: false,
      removedBill: null  // Track which bill was removed at start
    };

    this.players.push(player);

    // First player is host
    if (!this.host) {
      this.host = playerId;
    }

    return player;
  }

  // Remove a player from the game
  removePlayer(playerId) {
    const index = this.players.findIndex(p => p.id === playerId);
    if (index !== -1) {
      this.players.splice(index, 1);

      // Assign new host if needed
      if (this.host === playerId && this.players.length > 0) {
        this.host = this.players[0].id;
      }
    }
  }

  // Start the game
  startGame() {
    if (this.players.length < 3) {
      throw new Error('Need at least 3 players to start');
    }

    // Build and shuffle deck
    this.itemDeck = buildItemDeck();

    // LOW SOCIETY RULE: Remove one random bill from each player
    this.players.forEach(player => {
      player.removedBill = removeRandomBill(player.moneyHand);
    });

    this.phase = GAME_PHASES.STARTING;

    // Start first auction immediately
    this.startNextAuction();
  }

  // Start the next auction
  startNextAuction() {
    if (this.itemDeck.length === 0) {
      this.endGame();
      return;
    }

    // Draw next card
    this.currentCard = this.itemDeck.shift();

    // Check if this is a game-ending card
    if (isGameEndingCard(this.currentCard)) {
      this.gameEndingCardsRevealed++;
      if (this.gameEndingCardsRevealed >= 4) {
        this.endGame();
        return;
      }
    }

    // Reset all players for new auction
    this.players.forEach(player => {
      player.currentBid = [];
      player.hasPassed = false;
    });

    // Determine auction type
    const auctionType = this.currentCard.type === CARD_TYPES.DISGRACE
      ? AUCTION_TYPES.REVERSE
      : AUCTION_TYPES.STANDARD;

    // Determine starting player (winner/loser of previous auction starts next one)
    let startingPlayerId = this.nextStartingPlayerId || this.players[0].id;
    let startingPlayerIndex = this.players.findIndex(p => p.id === startingPlayerId);

    // If starting player not found, use first player
    if (startingPlayerIndex === -1) {
      startingPlayerIndex = 0;
      startingPlayerId = this.players[0].id;
    }

    this.currentAuction = {
      type: auctionType,
      highestBid: 0,
      highestBidder: null,
      activePlayers: this.players.map(p => p.id),
      currentTurnIndex: startingPlayerIndex,
      currentTurnPlayerId: startingPlayerId
    };

    this.phase = GAME_PHASES.AUCTION;
  }

  // Place a bid
  placeBid(playerId, moneyCardIds) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');

    // Check if it's this player's turn
    if (this.currentAuction.currentTurnPlayerId !== playerId) {
      throw new Error('Not your turn');
    }

    if (player.hasPassed) throw new Error('You have already passed');

    // Calculate new bid total
    const newBidTotal = this.calculatePlayerBidTotal(playerId, moneyCardIds);

    // Must be higher than current highest
    if (newBidTotal <= this.currentAuction.highestBid) {
      throw new Error('Bid must be higher than current bid');
    }

    // Update player's current bid
    player.currentBid = moneyCardIds;

    // Update auction state
    this.currentAuction.highestBid = newBidTotal;
    this.currentAuction.highestBidder = playerId;

    // Advance to next player's turn
    this.advanceTurn();

    return newBidTotal;
  }

  // Player passes
  pass(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');

    // Check if it's this player's turn
    if (this.currentAuction.currentTurnPlayerId !== playerId) {
      throw new Error('Not your turn');
    }

    if (player.hasPassed) throw new Error('You have already passed');

    player.hasPassed = true;

    // Return bid cards to hand
    player.currentBid = [];

    // Remove from active players
    const activeIndex = this.currentAuction.activePlayers.indexOf(playerId);
    if (activeIndex !== -1) {
      this.currentAuction.activePlayers.splice(activeIndex, 1);
    }

    // Check auction end conditions
    if (this.currentAuction.type === AUCTION_TYPES.REVERSE) {
      // Reverse auction: first pass ends it
      this.resolveReverseAuction(playerId);
    } else {
      // Standard auction: ends when only one player remains
      if (this.currentAuction.activePlayers.length === 1) {
        this.resolveStandardAuction();
      } else {
        // Advance to next player's turn
        this.advanceTurn();
      }
    }
  }

  // Resolve standard auction (bidding to win)
  resolveStandardAuction() {
    const winner = this.players.find(p => p.id === this.currentAuction.highestBidder);

    if (winner) {
      // Winner gets the card
      winner.wonCards.push(this.currentCard);

      // Winner loses their bid money
      this.removeMoneyFromPlayer(winner.id, winner.currentBid);

      // All other players keep their money
      this.players.forEach(player => {
        if (player.id !== winner.id) {
          player.currentBid = [];
        }
      });

      // Winner starts the next auction
      this.nextStartingPlayerId = winner.id;

      // Check for special card effects
      if (this.currentCard.type === 'special' && this.currentCard.effect === 'card-swap') {
        // TODO: Implement card swap UI
        // For now, just continue to next auction
        // this.phase = GAME_PHASES.CARD_SWAP;
        // this.currentAuction.swapWinner = winner.id;
        // return; // Don't start next auction yet
      }

      // Apply disgrace effects
      this.applyDisgraceEffect(winner, this.currentCard);
    }

    // Start next auction
    this.startNextAuction();
  }

  // Resolve reverse auction (bidding to avoid)
  resolveReverseAuction(passedPlayerId) {
    const loser = this.players.find(p => p.id === passedPlayerId);

    if (loser) {
      // Loser gets the disgrace card
      loser.wonCards.push(this.currentCard);
      loser.currentBid = [];

      // Loser starts the next auction (they "won" by getting stuck with it)
      this.nextStartingPlayerId = loser.id;

      // Apply disgrace effect
      this.applyDisgraceEffect(loser, this.currentCard);

      // All other players lose their bid money
      this.players.forEach(player => {
        if (player.id !== loser.id && player.currentBid.length > 0) {
          this.removeMoneyFromPlayer(player.id, player.currentBid);
        }
      });
    }

    // Start next auction
    this.startNextAuction();
  }

  // Execute card swap (Pawn Shop Trade)
  executeCardSwap(swapperPlayerId, player1Id, card1Id, player2Id, card2Id) {
    if (this.phase !== GAME_PHASES.CARD_SWAP) {
      throw new Error('Not in card swap phase');
    }

    if (swapperPlayerId !== this.currentAuction.swapWinner) {
      throw new Error('Only the winner can swap cards');
    }

    const player1 = this.players.find(p => p.id === player1Id);
    const player2 = this.players.find(p => p.id === player2Id);

    if (!player1 || !player2) throw new Error('Invalid players');

    const card1Index = player1.wonCards.findIndex(c => c.id === card1Id);
    const card2Index = player2.wonCards.findIndex(c => c.id === card2Id);

    if (card1Index === -1 || card2Index === -1) {
      throw new Error('Cards not found');
    }

    // Swap the cards
    const temp = player1.wonCards[card1Index];
    player1.wonCards[card1Index] = player2.wonCards[card2Index];
    player2.wonCards[card2Index] = temp;

    // Continue to next auction
    this.startNextAuction();
  }

  // Apply disgrace card effects
  applyDisgraceEffect(player, card) {
    if (card.type !== CARD_TYPES.DISGRACE) return;

    if (card.effect === 'faux-pas') {
      // Remove one luxury card if player has any
      const luxuryIndex = player.wonCards.findIndex(c => c.type === CARD_TYPES.LUXURY);
      if (luxuryIndex !== -1) {
        player.wonCards.splice(luxuryIndex, 1);
      }
      // If no luxury cards, the effect waits for the next one (handled in score calculation)
    }
  }

  // Remove money cards from player
  removeMoneyFromPlayer(playerId, moneyCardIds) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;

    moneyCardIds.forEach(cardId => {
      const card = player.moneyHand.find(m => m.id === cardId);
      if (card) {
        card.available = false;
      }
    });

    player.currentBid = [];
  }

  // Advance turn to next active player
  advanceTurn() {
    if (!this.currentAuction || this.currentAuction.activePlayers.length === 0) return;

    // Find next active player
    let nextTurnIndex = this.currentAuction.currentTurnIndex;
    let attempts = 0;

    do {
      nextTurnIndex = (nextTurnIndex + 1) % this.players.length;
      attempts++;

      // Safety check to prevent infinite loop
      if (attempts > this.players.length) {
        // Just use first active player
        this.currentAuction.currentTurnPlayerId = this.currentAuction.activePlayers[0];
        return;
      }

      const nextPlayer = this.players[nextTurnIndex];
      if (this.currentAuction.activePlayers.includes(nextPlayer.id)) {
        this.currentAuction.currentTurnIndex = nextTurnIndex;
        this.currentAuction.currentTurnPlayerId = nextPlayer.id;
        return;
      }
    } while (true);
  }

  // Calculate player's bid total including cards already in current bid
  calculatePlayerBidTotal(playerId, additionalMoneyCardIds) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return 0;

    const allBidCards = [...player.currentBid, ...additionalMoneyCardIds];
    let total = 0;

    allBidCards.forEach(cardId => {
      const card = player.moneyHand.find(m => m.id === cardId);
      if (card) {
        total += card.value;
      }
    });

    return total;
  }

  // Get player's remaining money total
  getPlayerMoneyTotal(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return 0;

    return player.moneyHand
      .filter(m => m.available)
      .reduce((sum, m) => sum + m.value, 0);
  }

  // End the game
  endGame() {
    this.phase = GAME_PHASES.GAME_OVER;

    // Calculate remaining money for each player
    const playerMoney = this.players.map(player => ({
      id: player.id,
      name: player.name,
      money: this.getPlayerMoneyTotal(player.id)
    }));

    // Find player with least money
    const poorestPlayer = playerMoney.reduce((min, p) =>
      p.money < min.money ? p : min
    );

    // Calculate scores (excluding poorest player)
    this.results = this.players
      .filter(p => p.id !== poorestPlayer.id)
      .map(player => ({
        id: player.id,
        name: player.name,
        score: calculateScore(player),
        money: this.getPlayerMoneyTotal(player.id),
        wonCards: player.wonCards
      }))
      .sort((a, b) => b.score - a.score);

    // Add poorest player at the end
    this.results.push({
      id: poorestPlayer.id,
      name: poorestPlayer.name,
      score: 0,
      money: poorestPlayer.money,
      eliminated: true,
      wonCards: this.players.find(p => p.id === poorestPlayer.id).wonCards
    });

    return this.results;
  }

  // Get public game state (what all players can see)
  getPublicState() {
    return {
      roomCode: this.roomCode,
      phase: this.phase,
      playerCount: this.players.length,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        remainingMoney: this.getPlayerMoneyTotal(p.id),
        wonCardsCount: p.wonCards.length,
        wonCards: p.wonCards, // All players can see won cards
        hasPassed: p.hasPassed,
        currentBidTotal: this.calculatePlayerBidTotal(p.id, [])
      })),
      currentCard: this.currentCard,
      currentAuction: this.currentAuction,
      gameEndingCardsRevealed: this.gameEndingCardsRevealed,
      host: this.host,
      results: this.results
    };
  }

  // Get private state for a specific player
  getPrivateState(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;

    return {
      moneyHand: player.moneyHand,
      removedBill: player.removedBill,
      currentBid: player.currentBid
    };
  }
}
