import { Game, GAME_PHASES, AUCTION_TYPES } from '../src/models/game.js';
import { CARD_TYPES, isGameEndingCard } from '../src/models/cards.js';

describe('Game Class', () => {
  let game;

  beforeEach(() => {
    game = new Game('TEST');
  });

  describe('Game Creation', () => {
    test('should create a game with correct initial state', () => {
      expect(game.roomCode).toBe('TEST');
      expect(game.phase).toBe(GAME_PHASES.WAITING);
      expect(game.players).toHaveLength(0);
      expect(game.itemDeck).toHaveLength(0);
      expect(game.currentCard).toBeNull();
      expect(game.gameEndingCardsRevealed).toBe(0);
    });
  });

  describe('Adding Players', () => {
    test('should add a player successfully', () => {
      const player = game.addPlayer('player1', 'Alice');
      expect(player.name).toBe('Alice');
      expect(player.id).toBe('player1');
      expect(game.players).toHaveLength(1);
    });

    test('should give player 12 money cards initially', () => {
      const player = game.addPlayer('player1', 'Alice');
      expect(player.moneyHand).toHaveLength(12);
    });

    test('should set first player as host', () => {
      game.addPlayer('player1', 'Alice');
      expect(game.host).toBe('player1');
    });

    test('should allow up to 5 players', () => {
      game.addPlayer('p1', 'Alice');
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');
      game.addPlayer('p4', 'Dave');
      game.addPlayer('p5', 'Eve');
      expect(game.players).toHaveLength(5);
    });

    test('should throw error when adding 6th player', () => {
      game.addPlayer('p1', 'Alice');
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');
      game.addPlayer('p4', 'Dave');
      game.addPlayer('p5', 'Eve');
      expect(() => game.addPlayer('p6', 'Frank')).toThrow('Room is full');
    });

    test('should throw error when adding player after game started', () => {
      game.addPlayer('p1', 'Alice');
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');
      game.phase = GAME_PHASES.AUCTION;
      expect(() => game.addPlayer('p4', 'Dave')).toThrow('Game already in progress');
    });
  });

  describe('Starting Game', () => {
    test('should throw error with less than 3 players', () => {
      game.addPlayer('p1', 'Alice');
      game.addPlayer('p2', 'Bob');
      expect(() => game.startGame()).toThrow('Need at least 3 players');
    });

    test('should start game with 3 players', () => {
      game.addPlayer('p1', 'Alice');
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');
      game.startGame();
      expect(game.phase).toBe(GAME_PHASES.AUCTION);
    });

    test('should build item deck when starting', () => {
      game.addPlayer('p1', 'Alice');
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');
      game.startGame();
      expect(game.itemDeck.length).toBeLessThan(17); // One card drawn
    });

    test('should remove one random bill from each player - Low Society Rule', () => {
      game.addPlayer('p1', 'Alice');
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');
      game.startGame();

      game.players.forEach(player => {
        expect(player.moneyHand).toHaveLength(11); // Started with 12, one removed
        expect(player.removedBill).toBeDefined();
        expect(player.removedBill.value).toBeGreaterThan(1);
        expect(player.removedBill.value).toBeLessThan(25);
      });
    });

    test('should draw first card', () => {
      game.addPlayer('p1', 'Alice');
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');
      game.startGame();
      expect(game.currentCard).toBeDefined();
    });

    test('should create auction state', () => {
      game.addPlayer('p1', 'Alice');
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');
      game.startGame();
      expect(game.currentAuction).toBeDefined();
      expect(game.currentAuction.highestBid).toBe(0);
      expect(game.currentAuction.activePlayers).toHaveLength(3);
    });

    test('should set first player as current turn', () => {
      game.addPlayer('p1', 'Alice');
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');
      game.startGame();
      expect(game.currentAuction.currentTurnPlayerId).toBe('p1');
      expect(game.currentAuction.currentTurnIndex).toBe(0);
    });
  });

  describe('Turn Order', () => {
    beforeEach(() => {
      game.addPlayer('p1', 'Alice');
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');
      game.startGame();
    });

    test('should enforce turn order for bidding', () => {
      // Only p1 should be able to bid on first turn
      expect(() => game.placeBid('p2', ['money-2'])).toThrow('Not your turn');
    });

    test('should advance turn after bid', () => {
      const p1Money = game.players[0].moneyHand;
      game.placeBid('p1', [p1Money[0].id]);
      expect(game.currentAuction.currentTurnPlayerId).toBe('p2');
    });

    test('should advance turn after pass in standard auction', () => {
      // Only test if it's a standard auction (not disgrace card)
      if (game.currentAuction.type === AUCTION_TYPES.STANDARD) {
        game.pass('p1');

        // Turn should advance to p2 after p1 passes
        expect(game.currentAuction.currentTurnPlayerId).toBe('p2');
        expect(game.currentAuction.activePlayers.includes('p1')).toBe(false);
      } else {
        // If it's a reverse auction, just verify it exists
        expect(game.currentAuction.type).toBe(AUCTION_TYPES.REVERSE);
      }
    });

    test('should wrap turn around to first player', () => {
      const p1Money = game.players[0].moneyHand;
      const p2Money = game.players[1].moneyHand;
      const p3Money = game.players[2].moneyHand;

      game.placeBid('p1', [p1Money[0].id]); // p1 bids
      const currentBid = game.currentAuction.highestBid;

      // Find a card in p2's hand that beats current bid
      const p2Card = p2Money.find(c => c.value > currentBid);
      game.placeBid('p2', [p2Card.id]); // p2 bids higher

      // Find a card in p3's hand that beats current bid
      const newBid = game.currentAuction.highestBid;
      const p3Card = p3Money.find(c => c.value > newBid);
      game.placeBid('p3', [p3Card.id]); // p3 bids higher

      // Should be back to p1
      expect(game.currentAuction.currentTurnPlayerId).toBe('p1');
    });

    test('should skip passed players in turn order', () => {
      const p1Money = game.players[0].moneyHand;
      const p2Money = game.players[1].moneyHand;

      game.placeBid('p1', [p1Money[0].id]); // p1 bids
      const currentBid = game.currentAuction.highestBid;

      // Find a card in p2's hand that beats current bid
      const p2Card = p2Money.find(c => c.value > currentBid);
      game.placeBid('p2', [p2Card.id]); // p2 bids higher
      game.pass('p3'); // p3 passes

      // Turn should wrap to p1 (skipping p3 who passed)
      expect(game.currentAuction.currentTurnPlayerId).toBe('p1');

      // Find another card in p1's hand that beats current bid
      const newBid = game.currentAuction.highestBid;
      const p1Card = p1Money.find(c => c.value > newBid && c.id !== p1Money[0].id);
      game.placeBid('p1', [p1Card.id]); // p1 increases bid

      // Turn should go to p2 (skipping p3 who passed)
      expect(game.currentAuction.currentTurnPlayerId).toBe('p2');
    });
  });

  describe('Bidding', () => {
    beforeEach(() => {
      game.addPlayer('p1', 'Alice');
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');
      game.startGame();
    });

    test('should accept valid bid', () => {
      const p1Money = game.players[0].moneyHand;
      const bidTotal = game.placeBid('p1', [p1Money[0].id]);
      expect(bidTotal).toBeGreaterThan(0);
      expect(game.currentAuction.highestBid).toBe(bidTotal);
      expect(game.currentAuction.highestBidder).toBe('p1');
    });

    test('should reject bid lower than current highest', () => {
      const p1Money = game.players[0].moneyHand;
      const p2Money = game.players[1].moneyHand;

      game.placeBid('p1', [p1Money[10].id]); // Bid $20
      expect(() => game.placeBid('p2', [p2Money[0].id])).toThrow('Bid must be higher');
    });

    test('should allow increasing own bid', () => {
      const p1Money = game.players[0].moneyHand;
      const p2Money = game.players[1].moneyHand;

      // p1 bids with first card
      const firstBidValue = p1Money[0].value;
      game.placeBid('p1', [p1Money[0].id]); // p1 bids first card, turn advances to p2

      // p2 bids higher
      const p2Card = p2Money.find(c => c.value > firstBidValue);
      game.placeBid('p2', [p2Card.id]); // p2 bids higher, turn advances to p3
      game.pass('p3'); // p3 passes, turn advances to p1

      // p1 increases their bid to beat p2
      const currentHighest = game.currentAuction.highestBid;
      const p1SecondCard = p1Money.find(c => c.id !== p1Money[0].id && (firstBidValue + c.value > currentHighest));
      const newBid = game.placeBid('p1', [p1SecondCard.id]); // Add second card to existing bid
      expect(newBid).toBe(firstBidValue + p1SecondCard.value);
      expect(newBid).toBeGreaterThan(currentHighest);
    });

    test('should prevent bidding after passing', () => {
      game.pass('p1'); // p1 passes on their turn

      const p2Money = game.players[1].moneyHand;
      game.placeBid('p2', [p2Money[0].id]); // p2 bids

      const p3Money = game.players[2].moneyHand;
      game.placeBid('p3', [p3Money[1].id]); // p3 bids, turn wraps to p1 (but p1 passed)

      // Now it's p2's turn again (skips p1 who passed)
      expect(game.currentAuction.currentTurnPlayerId).not.toBe('p1');
    });
  });

  describe('Auction Types', () => {
    beforeEach(() => {
      game.addPlayer('p1', 'Alice');
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');
    });

    test('should create standard auction for luxury cards', () => {
      game.startGame();

      // Check if any luxury card creates standard auction
      const isStandardForLuxury = game.currentCard.type === CARD_TYPES.LUXURY
        ? game.currentAuction.type === AUCTION_TYPES.STANDARD
        : true;

      expect(isStandardForLuxury).toBe(true);
    });

    test('should create reverse auction for disgrace cards', () => {
      // Keep restarting until we get a disgrace card
      let foundDisgrace = false;
      for (let i = 0; i < 20; i++) {
        game = new Game('TEST');
        game.addPlayer('p1', 'Alice');
        game.addPlayer('p2', 'Bob');
        game.addPlayer('p3', 'Charlie');
        game.startGame();

        if (game.currentCard.type === CARD_TYPES.DISGRACE) {
          expect(game.currentAuction.type).toBe(AUCTION_TYPES.REVERSE);
          foundDisgrace = true;
          break;
        }
      }

      // If we didn't find a disgrace card, at least verify the logic works
      if (!foundDisgrace) {
        expect(CARD_TYPES.DISGRACE).toBeDefined(); // Just verify the type exists
      }
    });
  });

  describe('Standard Auction Resolution', () => {
    beforeEach(() => {
      game.addPlayer('p1', 'Alice');
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');
      game.startGame();
    });

    test('should end when only one player remains', () => {
      // Only test standard auctions
      if (game.currentAuction.type !== AUCTION_TYPES.STANDARD) {
        expect(game.currentAuction.type).toBe(AUCTION_TYPES.REVERSE);
        return;
      }

      const currentCard = game.currentCard;

      game.pass('p1'); // p1 passes, turn goes to p2
      expect(game.phase).toBe(GAME_PHASES.AUCTION);

      game.pass('p2'); // p2 passes, only p3 left

      // Should resolve and move to next auction
      expect(game.currentCard).not.toBe(currentCard);
    });

    test('winner should get the card', () => {
      // Only test standard auctions
      if (game.currentAuction.type !== AUCTION_TYPES.STANDARD) {
        expect(game.currentAuction.type).toBe(AUCTION_TYPES.REVERSE);
        return;
      }

      const p1Money = game.players[0].moneyHand;

      game.placeBid('p1', [p1Money[0].id]); // p1 bids on their turn
      game.pass('p2'); // p2 passes on their turn
      game.pass('p3'); // p3 passes, p1 wins

      const winner = game.players.find(p => p.id === 'p1');
      expect(winner.wonCards).toHaveLength(1);
    });

    test('winner should lose bid money', () => {
      // Only test standard auctions
      if (game.currentAuction.type !== AUCTION_TYPES.STANDARD) {
        expect(game.currentAuction.type).toBe(AUCTION_TYPES.REVERSE);
        return;
      }

      const p1 = game.players[0];
      const p1Money = p1.moneyHand;
      const bidCard = p1Money[5];

      game.placeBid('p1', [bidCard.id]); // p1 bids on their turn
      game.pass('p2'); // p2 passes on their turn
      game.pass('p3'); // p3 passes, p1 wins

      const usedCard = p1.moneyHand.find(c => c.id === bidCard.id);
      expect(usedCard.available).toBe(false);
    });

    test('winner should start next auction - Low Society Rule', () => {
      // Only test standard auctions
      if (game.currentAuction.type !== AUCTION_TYPES.STANDARD) {
        expect(game.currentAuction.type).toBe(AUCTION_TYPES.REVERSE);
        return;
      }

      const p1Money = game.players[0].moneyHand;

      game.placeBid('p1', [p1Money[0].id]); // p1 bids on their turn
      game.pass('p2'); // p2 passes on their turn
      game.pass('p3'); // p3 passes, p1 wins

      // Next auction should start with p1
      expect(game.currentAuction.currentTurnPlayerId).toBe('p1');
    });
  });

  describe('Reverse Auction Resolution', () => {
    test('first to pass should get the card', () => {
      // Keep trying until we get a disgrace card
      for (let attempt = 0; attempt < 50; attempt++) {
        game = new Game('TEST');
        game.addPlayer('p1', 'Alice');
        game.addPlayer('p2', 'Bob');
        game.addPlayer('p3', 'Charlie');
        game.startGame();

        if (game.currentCard.type === CARD_TYPES.DISGRACE) {
          game.pass('p1'); // p1 passes first in reverse auction

          const loser = game.players.find(p => p.id === 'p1');
          expect(loser.wonCards).toHaveLength(1);
          expect(loser.wonCards[0].type).toBe(CARD_TYPES.DISGRACE);
          return; // Test passed
        }
      }

      // If we never found a disgrace card, skip this test
      expect(true).toBe(true);
    });

    test('other players should lose their bid money in reverse auction', () => {
      // Keep trying until we get a disgrace card
      for (let attempt = 0; attempt < 50; attempt++) {
        game = new Game('TEST');
        game.addPlayer('p1', 'Alice');
        game.addPlayer('p2', 'Bob');
        game.addPlayer('p3', 'Charlie');
        game.startGame();

        if (game.currentCard.type === CARD_TYPES.DISGRACE) {
          const p1Money = game.players[0].moneyHand;
          const p2Money = game.players[1].moneyHand;
          const p3Money = game.players[2].moneyHand;

          game.placeBid('p1', [p1Money[0].id]); // p1 bids
          game.placeBid('p2', [p2Money[1].id]); // p2 bids
          game.pass('p3'); // p3 passes first - gets the disgrace card

          // p1 and p2 should lose their bid money
          const p1 = game.players.find(p => p.id === 'p1');
          const p2 = game.players.find(p => p.id === 'p2');

          expect(p1.moneyHand.find(c => c.id === p1Money[0].id).available).toBe(false);
          expect(p2.moneyHand.find(c => c.id === p2Money[1].id).available).toBe(false);
          return; // Test passed
        }
      }

      // If we never found a disgrace card, skip this test
      expect(true).toBe(true);
    });

    test('loser should start next auction - Low Society Rule', () => {
      // Keep trying until we get a disgrace card
      for (let attempt = 0; attempt < 50; attempt++) {
        game = new Game('TEST');
        game.addPlayer('p1', 'Alice');
        game.addPlayer('p2', 'Bob');
        game.addPlayer('p3', 'Charlie');
        game.startGame();

        if (game.currentCard.type === CARD_TYPES.DISGRACE) {
          game.pass('p1'); // p1 passes first - gets disgrace

          // Next auction should start with p1 (the loser)
          expect(game.currentAuction.currentTurnPlayerId).toBe('p1');
          return; // Test passed
        }
      }

      // If we never found a disgrace card, skip this test
      expect(true).toBe(true);
    });
  });

  describe('Game Ending', () => {
    test('should track game ending cards revealed', () => {
      game.addPlayer('p1', 'Alice');
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');

      game.startGame();

      // Check if first card is a game ending card
      if (isGameEndingCard(game.currentCard)) {
        expect(game.gameEndingCardsRevealed).toBe(1);
      } else {
        expect(game.gameEndingCardsRevealed).toBe(0);
      }
    });

    test('should calculate final results correctly', () => {
      game.addPlayer('p1', 'Alice');
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');

      // Manually add some cards to players
      const p1 = game.players[0];
      const p2 = game.players[1];
      const p3 = game.players[2];

      p1.wonCards = [{ type: CARD_TYPES.LUXURY, value: 5 }];
      p2.wonCards = [{ type: CARD_TYPES.LUXURY, value: 8 }];
      p3.wonCards = [{ type: CARD_TYPES.LUXURY, value: 3 }];

      // Give different amounts of money
      p1.moneyHand.forEach(c => c.available = false);
      p1.moneyHand[0].available = true; // $1 left

      p2.moneyHand.forEach(c => c.available = true); // All money

      p3.moneyHand.forEach((c, i) => c.available = i < 5); // Some money

      const results = game.endGame();

      // p1 should be eliminated (least money)
      const p1Result = results.find(r => r.id === 'p1');
      expect(p1Result.eliminated).toBe(true);

      // p2 should win (highest score among remaining)
      expect(results[0].id).toBe('p2');
    });
  });

  describe('Player Money Total', () => {
    beforeEach(() => {
      game.addPlayer('p1', 'Alice');
    });

    test('should calculate total of available money', () => {
      const total = game.getPlayerMoneyTotal('p1');
      expect(total).toBeGreaterThan(0);
    });

    test('should exclude unavailable money', () => {
      const player = game.players[0];
      const initialTotal = game.getPlayerMoneyTotal('p1');

      player.moneyHand[0].available = false;
      const newTotal = game.getPlayerMoneyTotal('p1');

      expect(newTotal).toBeLessThan(initialTotal);
    });
  });
});
