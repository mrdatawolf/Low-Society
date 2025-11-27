// Card definitions for Low Society
// Based on High Society mechanics but themed for Low Society

export const CARD_TYPES = {
  LUXURY: 'luxury',
  PRESTIGE: 'prestige',
  DISGRACE: 'disgrace'
};

// Low Society themed luxury items (replaces high-end art)
export const LUXURY_CARDS = [
  { id: 'lux-1', type: CARD_TYPES.LUXURY, value: 1, name: 'Pabst Blue Ribbon 6-Pack', description: 'The beer of choice' },
  { id: 'lux-2', type: CARD_TYPES.LUXURY, value: 2, name: 'NASCAR Baseball Cap', description: 'Limited edition' },
  { id: 'lux-3', type: CARD_TYPES.LUXURY, value: 3, name: 'Muddin\' Truck Tires', description: 'Barely used' },
  { id: 'lux-4', type: CARD_TYPES.LUXURY, value: 4, name: 'Velvet Elvis Painting', description: 'True art' },
  { id: 'lux-5', type: CARD_TYPES.LUXURY, value: 5, name: 'Strange Mongrel Dog', description: 'Best friend material' },
  { id: 'lux-6', type: CARD_TYPES.LUXURY, value: 6, name: 'Jack Daniel\'s Whiskey', description: 'The good stuff' },
  { id: 'lux-7', type: CARD_TYPES.LUXURY, value: 7, name: 'Camouflage Couch', description: 'You can\'t even see it' },
  { id: 'lux-8', type: CARD_TYPES.LUXURY, value: 8, name: 'Above Ground Pool', description: 'Luxury living' },
  { id: 'lux-9', type: CARD_TYPES.LUXURY, value: 9, name: 'Lifted Pickup Truck', description: 'With truck nuts' },
  { id: 'lux-10', type: CARD_TYPES.LUXURY, value: 10, name: 'Double Wide Trailer', description: 'Prime real estate' }
];

// Prestige cards - doubles your status (theme: ultimate achievements)
export const PRESTIGE_CARDS = [
  { id: 'pres-1', type: CARD_TYPES.PRESTIGE, multiplier: 2, name: 'Mullet Hairstyle', description: 'Business in front, party in back' },
  { id: 'pres-2', type: CARD_TYPES.PRESTIGE, multiplier: 2, name: 'Monster Truck Rally Tickets', description: 'VIP section' },
  { id: 'pres-3', type: CARD_TYPES.PRESTIGE, multiplier: 2, name: 'Confederate Flag Collection', description: 'Heritage not hate' }
];

// Disgrace cards - negative effects
export const DISGRACE_CARDS = [
  { id: 'disg-1', type: CARD_TYPES.DISGRACE, effect: 'faux-pas', name: 'Repo Man', description: 'Lose one luxury item' },
  { id: 'disg-2', type: CARD_TYPES.DISGRACE, effect: 'passe', penalty: -5, name: 'DUI Citation', description: 'Lose 5 status' },
  { id: 'disg-3', type: CARD_TYPES.DISGRACE, effect: 'scandale', penalty: 0.5, name: 'Jerry Springer Episode', description: 'Halve your status' }
];

// NEW: Low Society specific card - Card Trading
export const SPECIAL_CARDS = [
  { id: 'spec-1', type: 'special', effect: 'card-swap', name: 'Pawn Shop Trade', description: 'Winner swaps two cards between players' }
];

// Money cards (Food Stamp Bills in Low Society theme)
// Each player gets these denominations
export const MONEY_DENOMINATIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25];

// Build the complete item deck
export function buildItemDeck() {
  const deck = [
    ...LUXURY_CARDS,
    ...PRESTIGE_CARDS,
    ...DISGRACE_CARDS,
    ...SPECIAL_CARDS
  ];

  return shuffleDeck(deck);
}

// Shuffle utility
function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Create a player's money hand
export function createMoneyHand() {
  return MONEY_DENOMINATIONS.map((value, index) => ({
    id: `money-${value}`,
    value,
    available: true
  }));
}

// LOW SOCIETY RULE: Remove one random money bill (not lowest or highest)
export function removeRandomBill(moneyHand) {
  const eligibleIndices = [];

  // Find indices of bills that are not the lowest (1) or highest (25)
  moneyHand.forEach((bill, index) => {
    if (bill.value !== 1 && bill.value !== 25) {
      eligibleIndices.push(index);
    }
  });

  // Randomly select one to remove
  if (eligibleIndices.length > 0) {
    const randomIndex = eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)];
    const removedBill = moneyHand[randomIndex];
    moneyHand.splice(randomIndex, 1);
    return removedBill;
  }

  return null;
}

// Check if a card ends the game (4th green-backed card)
export function isGameEndingCard(card) {
  return card.type === CARD_TYPES.PRESTIGE ||
         (card.type === CARD_TYPES.DISGRACE && card.effect === 'scandale');
}

// Calculate player's final score
export function calculateScore(player) {
  let score = 0;
  let prestigeMultiplier = 1;

  // Count luxury cards
  player.wonCards.forEach(card => {
    if (card.type === CARD_TYPES.LUXURY) {
      score += card.value;
    }
  });

  // Count prestige multipliers
  player.wonCards.forEach(card => {
    if (card.type === CARD_TYPES.PRESTIGE) {
      prestigeMultiplier *= card.multiplier;
    }
  });

  // Apply prestige multiplier
  score *= prestigeMultiplier;

  // Apply disgrace penalties
  player.wonCards.forEach(card => {
    if (card.type === CARD_TYPES.DISGRACE) {
      if (card.effect === 'passe') {
        score += card.penalty; // penalty is negative
      } else if (card.effect === 'scandale') {
        score *= card.penalty; // penalty is 0.5 (halves score)
      }
    }
  });

  return Math.max(0, Math.floor(score));
}
