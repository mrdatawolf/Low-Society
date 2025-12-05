import {
  CARD_TYPES,
  LUXURY_CARDS,
  PRESTIGE_CARDS,
  DISGRACE_CARDS,
  SPECIAL_CARDS,
  MONEY_DENOMINATIONS,
  buildItemDeck,
  createMoneyHand,
  removeRandomBill,
  isGameEndingCard,
  calculateScore
} from '../src/models/cards.js';

describe('Cards Module', () => {
  describe('Card Definitions', () => {
    test('should have 10 luxury cards', () => {
      expect(LUXURY_CARDS).toHaveLength(10);
    });

    test('luxury cards should have values 1-10', () => {
      const values = LUXURY_CARDS.map(c => c.value).sort((a, b) => a - b);
      expect(values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    test('should have 2 prestige cards', () => {
      expect(PRESTIGE_CARDS).toHaveLength(2);
    });

    test('prestige cards should have 2x multiplier', () => {
      PRESTIGE_CARDS.forEach(card => {
        expect(card.multiplier).toBe(2);
      });
    });

    test('should have 2 disgrace cards', () => {
      expect(DISGRACE_CARDS).toHaveLength(2);
    });

    test('disgrace cards should have correct effects', () => {
      const effects = DISGRACE_CARDS.map(c => c.effect).sort();
      expect(effects).toEqual(['faux-pas', 'passe']);
    });

    test('should have 1 special card', () => {
      expect(SPECIAL_CARDS).toHaveLength(1);
    });

    test('special card should be card-swap', () => {
      expect(SPECIAL_CARDS[0].effect).toBe('card-swap');
    });

    test('money denominations should be correct', () => {
      expect(MONEY_DENOMINATIONS).toEqual([1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25]);
    });
  });

  describe('buildItemDeck', () => {
    test('should build a deck of 15 cards', () => {
      const deck = buildItemDeck();
      expect(deck).toHaveLength(15); // 10 luxury + 2 prestige + 2 disgrace + 1 special
    });

    test('should shuffle the deck', () => {
      const deck1 = buildItemDeck();
      const deck2 = buildItemDeck();

      // It's theoretically possible they're the same, but very unlikely
      const same = deck1.every((card, i) => card.id === deck2[i].id);
      expect(same).toBe(false);
    });
  });

  describe('createMoneyHand', () => {
    test('should create a hand with 12 money cards', () => {
      const hand = createMoneyHand();
      expect(hand).toHaveLength(12);
    });

    test('all money cards should be available initially', () => {
      const hand = createMoneyHand();
      hand.forEach(card => {
        expect(card.available).toBe(true);
      });
    });

    test('money cards should have correct values', () => {
      const hand = createMoneyHand();
      const values = hand.map(c => c.value);
      expect(values).toEqual(MONEY_DENOMINATIONS);
    });
  });

  describe('removeRandomBill - Low Society Rule', () => {
    test('should remove one bill from hand', () => {
      const hand = createMoneyHand();
      const originalLength = hand.length;
      removeRandomBill(hand);
      expect(hand).toHaveLength(originalLength - 1);
    });

    test('should never remove $1 bill', () => {
      for (let i = 0; i < 100; i++) {
        const hand = createMoneyHand();
        removeRandomBill(hand);
        const hasOneDollar = hand.some(bill => bill.value === 1);
        expect(hasOneDollar).toBe(true);
      }
    });

    test('should never remove $25 bill', () => {
      for (let i = 0; i < 100; i++) {
        const hand = createMoneyHand();
        removeRandomBill(hand);
        const hasTwentyFive = hand.some(bill => bill.value === 25);
        expect(hasTwentyFive).toBe(true);
      }
    });

    test('should return the removed bill', () => {
      const hand = createMoneyHand();
      const removed = removeRandomBill(hand);
      expect(removed).toBeDefined();
      expect(removed.value).toBeGreaterThan(1);
      expect(removed.value).toBeLessThan(25);
    });
  });

  describe('isGameEndingCard', () => {
    test('no cards should end the game (play entire deck)', () => {
      // LOW SOCIETY RULE: Game ends when deck is empty, not after specific cards
      [...LUXURY_CARDS, ...PRESTIGE_CARDS, ...DISGRACE_CARDS, ...SPECIAL_CARDS].forEach(card => {
        expect(isGameEndingCard(card)).toBe(false);
      });
    });
  });

  describe('calculateScore', () => {
    test('should calculate score from luxury cards only', () => {
      const player = {
        wonCards: [
          LUXURY_CARDS[0], // value 1
          LUXURY_CARDS[4], // value 5
          LUXURY_CARDS[9], // value 10
        ]
      };
      expect(calculateScore(player)).toBe(16);
    });

    test('should apply prestige multiplier', () => {
      const player = {
        wonCards: [
          LUXURY_CARDS[0], // value 1
          LUXURY_CARDS[4], // value 5
          PRESTIGE_CARDS[0], // 2x multiplier
        ]
      };
      expect(calculateScore(player)).toBe(12); // (1 + 5) * 2
    });

    test('should apply multiple prestige multipliers', () => {
      const player = {
        wonCards: [
          LUXURY_CARDS[0], // value 1
          LUXURY_CARDS[4], // value 5
          PRESTIGE_CARDS[0], // 2x
          PRESTIGE_CARDS[1], // 2x (total 4x)
        ]
      };
      expect(calculateScore(player)).toBe(24); // (1 + 5) * 2 * 2
    });

    test('should subtract passe penalty', () => {
      const passe = DISGRACE_CARDS.find(c => c.effect === 'passe');
      const player = {
        wonCards: [
          LUXURY_CARDS[9], // value 10
          passe, // -5
        ]
      };
      expect(calculateScore(player)).toBe(5);
    });


    test('should never return negative score', () => {
      const passe = DISGRACE_CARDS.find(c => c.effect === 'passe');
      const player = {
        wonCards: [
          LUXURY_CARDS[0], // value 1
          passe, // -5
        ]
      };
      expect(calculateScore(player)).toBe(0);
    });

    test('complex scoring example', () => {
      const passe = DISGRACE_CARDS.find(c => c.effect === 'passe');
      const player = {
        wonCards: [
          LUXURY_CARDS[0], // 1
          LUXURY_CARDS[2], // 3
          LUXURY_CARDS[5], // 6
          PRESTIGE_CARDS[0], // 2x
          PRESTIGE_CARDS[1], // 2x (total 4x)
          passe, // -5
        ]
      };
      // (1 + 3 + 6) * 4 - 5 = 40 - 5 = 35
      expect(calculateScore(player)).toBe(35);
    });
  });
});
