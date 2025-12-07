// Tests for AI Player implementation

import { AIPlayer, createAIPlayer, generateAIPlayerId, AI_NAMES } from '../src/ai/AIPlayer.js';
import { CARD_TYPES } from '../src/models/cards.js';
import { AUCTION_TYPES } from '../src/models/game.js';

describe('AIPlayer', () => {
  let aiPlayer;

  beforeEach(() => {
    aiPlayer = new AIPlayer('ai_test_1', 'Test Bot');
  });

  describe('Constructor', () => {
    test('should create AI player with correct properties', () => {
      expect(aiPlayer.id).toBe('ai_test_1');
      expect(aiPlayer.name).toBe('Test Bot');
      expect(aiPlayer.isAI).toBe(true);
    });
  });

  describe('Reverse Auction Bidding', () => {
    test('should prefer to pass immediately on disgrace cards', () => {
      const currentCard = {
        id: 'disg-1',
        type: CARD_TYPES.DISGRACE,
        name: 'Repo Man'
      };

      const currentAuction = {
        type: AUCTION_TYPES.REVERSE,
        highestBid: 0,
        activePlayers: ['ai_test_1', 'player_2', 'player_3']
      };

      const availableMoney = [
        { id: 'money-1', value: 1, available: true },
        { id: 'money-2', value: 2, available: true },
        { id: 'money-3', value: 3, available: true }
      ];

      // Run multiple times to check probability
      let passCount = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const decision = aiPlayer.decideReverseAuctionBid(currentCard, currentAuction, availableMoney);
        if (decision.action === 'pass') {
          passCount++;
        }
      }

      // Should pass at least 70% of the time (80% probability minus variance)
      expect(passCount).toBeGreaterThan(70);
    });

    test('should pass if someone has already bid in reverse auction', () => {
      const currentCard = {
        id: 'disg-1',
        type: CARD_TYPES.DISGRACE,
        name: 'Repo Man'
      };

      const currentAuction = {
        type: AUCTION_TYPES.REVERSE,
        highestBid: 5,
        activePlayers: ['ai_test_1', 'player_2']
      };

      const availableMoney = [
        { id: 'money-1', value: 1, available: true },
        { id: 'money-2', value: 2, available: true }
      ];

      const decision = aiPlayer.decideReverseAuctionBid(currentCard, currentAuction, availableMoney);

      expect(decision.action).toBe('pass');
    });

    test('should pass if only one player left (must pass)', () => {
      const currentCard = {
        id: 'disg-1',
        type: CARD_TYPES.DISGRACE,
        name: 'Repo Man'
      };

      const currentAuction = {
        type: AUCTION_TYPES.REVERSE,
        highestBid: 0,
        activePlayers: ['ai_test_1']
      };

      const availableMoney = [
        { id: 'money-1', value: 1, available: true }
      ];

      const decision = aiPlayer.decideReverseAuctionBid(currentCard, currentAuction, availableMoney);

      expect(decision.action).toBe('pass');
    });
  });

  describe('Standard Auction Bidding', () => {
    test('should make valid bids on luxury cards', () => {
      const currentCard = {
        id: 'lux-5',
        type: CARD_TYPES.LUXURY,
        value: 5,
        name: 'Strange Mongrel Dog'
      };

      const currentAuction = {
        type: AUCTION_TYPES.STANDARD,
        highestBid: 0,
        activePlayers: ['ai_test_1', 'player_2']
      };

      const publicState = {
        currentCard,
        currentAuction,
        players: [
          { id: 'ai_test_1', wonCards: [] },
          { id: 'player_2', wonCards: [] }
        ]
      };

      const availableMoney = [
        { id: 'money-1', value: 1, available: true },
        { id: 'money-2', value: 2, available: true },
        { id: 'money-3', value: 3, available: true },
        { id: 'money-4', value: 4, available: true }
      ];

      const decision = aiPlayer.decideStandardAuctionBid(currentCard, currentAuction, availableMoney, publicState);

      // Should either bid or pass
      expect(['bid', 'pass']).toContain(decision.action);

      // If bid, should have cards selected
      if (decision.action === 'bid') {
        expect(decision.cards).toBeDefined();
        expect(Array.isArray(decision.cards)).toBe(true);
        expect(decision.cards.length).toBeGreaterThan(0);
      }
    });

    test('should pass if current bid is too high', () => {
      const currentCard = {
        id: 'lux-2',
        type: CARD_TYPES.LUXURY,
        value: 2,
        name: 'NASCAR Baseball Cap'
      };

      const currentAuction = {
        type: AUCTION_TYPES.STANDARD,
        highestBid: 50,
        activePlayers: ['ai_test_1', 'player_2']
      };

      const publicState = {
        currentCard,
        currentAuction,
        players: []
      };

      const availableMoney = [
        { id: 'money-1', value: 1, available: true },
        { id: 'money-2', value: 2, available: true }
      ];

      const decision = aiPlayer.decideStandardAuctionBid(currentCard, currentAuction, availableMoney, publicState);

      expect(decision.action).toBe('pass');
    });

    test('should pass if no money left', () => {
      const currentCard = {
        id: 'lux-5',
        type: CARD_TYPES.LUXURY,
        value: 5
      };

      const currentAuction = {
        type: AUCTION_TYPES.STANDARD,
        highestBid: 0,
        activePlayers: ['ai_test_1']
      };

      const publicState = { currentCard, currentAuction, players: [] };
      const privateState = { moneyHand: [] };

      const decision = aiPlayer.decideBid(publicState, privateState);

      expect(decision.action).toBe('pass');
    });

    test('should value prestige cards highly', () => {
      const prestigeCard = {
        id: 'pres-1',
        type: CARD_TYPES.PRESTIGE,
        multiplier: 2,
        name: 'Mullet Hairstyle'
      };

      const publicState = {
        currentCard: prestigeCard,
        players: []
      };

      const value = aiPlayer.evaluateCard(prestigeCard, publicState);

      // Prestige should be valued around 12
      expect(value).toBe(12);
    });
  });

  describe('Card Selection', () => {
    test('should select cards that beat current bid', () => {
      const availableMoney = [
        { id: 'money-1', value: 1, available: true },
        { id: 'money-2', value: 2, available: true },
        { id: 'money-3', value: 3, available: true },
        { id: 'money-5', value: 5, available: true }
      ];

      const selectedCards = aiPlayer.selectCardsForBid(availableMoney, 4, 0);

      // Calculate total
      const total = selectedCards.reduce((sum, cardId) => {
        const card = availableMoney.find(m => m.id === cardId);
        return sum + card.value;
      }, 0);

      // Should beat the current bid (0) and be close to target (4)
      expect(total).toBeGreaterThan(0);
      expect(total).toBeLessThanOrEqual(11); // Shouldn't overspend too much
    });

    test('should return empty array if cannot beat current bid', () => {
      const availableMoney = [
        { id: 'money-1', value: 1, available: true }
      ];

      const selectedCards = aiPlayer.selectCardsForBid(availableMoney, 10, 9);

      expect(selectedCards).toEqual([]);
    });

    test('should select smallest cards', () => {
      const availableMoney = [
        { id: 'money-5', value: 5, available: true },
        { id: 'money-1', value: 1, available: true },
        { id: 'money-3', value: 3, available: true }
      ];

      const smallest = aiPlayer.selectSmallestCards(availableMoney, 2);

      expect(smallest).toHaveLength(2);
      expect(smallest).toContain('money-1');
      expect(smallest).toContain('money-3');
    });
  });

  describe('Luxury Discard Decision', () => {
    test('should discard lowest value luxury card', () => {
      const wonCards = [
        { id: 'lux-2', type: CARD_TYPES.LUXURY, value: 2, name: 'NASCAR Cap' },
        { id: 'lux-5', type: CARD_TYPES.LUXURY, value: 5, name: 'Dog' },
        { id: 'lux-8', type: CARD_TYPES.LUXURY, value: 8, name: 'Pool' },
        { id: 'pres-1', type: CARD_TYPES.PRESTIGE, multiplier: 2, name: 'Mullet' }
      ];

      const cardToDiscard = aiPlayer.decideLuxuryDiscard(wonCards);

      // Should discard the lowest value luxury (lux-2)
      expect(cardToDiscard).toBe('lux-2');
    });

    test('should return null if no luxury cards', () => {
      const wonCards = [
        { id: 'pres-1', type: CARD_TYPES.PRESTIGE, multiplier: 2, name: 'Mullet' },
        { id: 'disg-1', type: CARD_TYPES.DISGRACE, effect: 'passe', name: 'DUI' }
      ];

      const cardToDiscard = aiPlayer.decideLuxuryDiscard(wonCards);

      expect(cardToDiscard).toBeNull();
    });
  });

  describe('Card Swap Decision', () => {
    test('should skip card swap in MVP', () => {
      const publicState = {
        players: [
          { id: 'ai_test_1', wonCards: [] },
          { id: 'player_2', wonCards: [] }
        ]
      };

      const swapDecision = aiPlayer.decideCardSwap(publicState);

      expect(swapDecision).toEqual({
        player1Id: null,
        card1Id: null,
        player2Id: null,
        card2Id: null
      });
    });
  });

  describe('Thinking Delay', () => {
    test('should return a promise', () => {
      const delay = aiPlayer.getThinkingDelay();
      expect(delay).toBeInstanceOf(Promise);
    });

    test('should delay for at least 500ms', async () => {
      const startTime = Date.now();
      await aiPlayer.getThinkingDelay();
      const endTime = Date.now();
      const elapsed = endTime - startTime;

      expect(elapsed).toBeGreaterThanOrEqual(490); // Allow small margin
      expect(elapsed).toBeLessThanOrEqual(1600); // Max delay + margin
    });
  });

  describe('Card Evaluation', () => {
    test('should evaluate luxury cards by their face value', () => {
      const card = { id: 'lux-7', type: CARD_TYPES.LUXURY, value: 7 };
      const value = aiPlayer.evaluateCard(card, {});
      expect(value).toBe(7);
    });

    test('should value special cards moderately', () => {
      const card = { id: 'spec-1', type: 'special', effect: 'card-swap' };
      const value = aiPlayer.evaluateCard(card, {});
      expect(value).toBe(5);
    });

    test('should value disgrace cards at 0', () => {
      const card = { id: 'disg-1', type: CARD_TYPES.DISGRACE };
      const value = aiPlayer.evaluateCard(card, {});
      expect(value).toBe(0);
    });
  });
});

describe('AI Player Factory Functions', () => {
  test('generateAIPlayerId should create unique IDs', async () => {
    const id1 = generateAIPlayerId(0);
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 2));
    const id2 = generateAIPlayerId(0);

    expect(id1).toContain('ai_player_0');
    expect(id2).toContain('ai_player_0');
    expect(id1).not.toBe(id2); // Should be different due to timestamp
  });

  test('createAIPlayer should create AIPlayer instance', () => {
    const aiPlayer = createAIPlayer(0);

    expect(aiPlayer).toBeInstanceOf(AIPlayer);
    expect(aiPlayer.name).toBe(AI_NAMES[0]);
    expect(aiPlayer.isAI).toBe(true);
  });

  test('createAIPlayer should cycle through names', () => {
    const aiPlayer1 = createAIPlayer(0);
    const aiPlayer2 = createAIPlayer(1);
    const aiPlayer3 = createAIPlayer(5); // Should wrap around

    expect(aiPlayer1.name).toBe(AI_NAMES[0]);
    expect(aiPlayer2.name).toBe(AI_NAMES[1]);
    expect(aiPlayer3.name).toBe(AI_NAMES[0]); // 5 % 5 = 0
  });
});
