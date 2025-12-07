// AI Player implementation for Low Society
// Simple rule-based AI that plays by the same rules as human players

import { CARD_TYPES } from '../models/cards.js';
import { AUCTION_TYPES } from '../models/game.js';

/**
 * AI Player class - makes bidding decisions based on simple weights and rules
 * All AI players use the same strategy for consistency
 */
export class AIPlayer {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.isAI = true;
  }

  /**
   * Make a bidding decision based on current game state
   * @param {Object} publicState - The public game state all players can see
   * @param {Object} privateState - The AI player's private state (money hand, etc)
   * @returns {Object} Decision object with action and optional cards
   */
  decideBid(publicState, privateState) {
    const { currentCard, currentAuction } = publicState;
    const { moneyHand } = privateState;

    // Get available money cards
    const availableMoney = moneyHand.filter(card => card.available);

    if (availableMoney.length === 0) {
      // No money left, must pass
      return { action: 'pass' };
    }

    // Determine auction type
    const isReverseAuction = currentAuction.type === AUCTION_TYPES.REVERSE;

    if (isReverseAuction) {
      return this.decideReverseAuctionBid(currentCard, currentAuction, availableMoney);
    } else {
      return this.decideStandardAuctionBid(currentCard, currentAuction, availableMoney, publicState);
    }
  }

  /**
   * Decide bid for reverse auction (trying to AVOID the card)
   * Strategy: Try to pass immediately to avoid disgrace
   */
  decideReverseAuctionBid(currentCard, currentAuction, availableMoney) {
    // In reverse auctions, we want to avoid getting the card
    // First to pass loses, so we try to pass immediately

    // If we're the only one left, we have to pass (no choice)
    if (currentAuction.activePlayers.length === 1) {
      return { action: 'pass' };
    }

    // If no one has bid yet, we might want to pass immediately
    // to try to make someone else take the disgrace
    if (currentAuction.highestBid === 0) {
      // 80% chance to pass immediately on disgrace cards
      if (Math.random() < 0.8) {
        return { action: 'pass' };
      }

      // 20% chance to make a small bid to try to force someone else to pass
      const smallBid = this.selectSmallestCards(availableMoney, 1);
      return { action: 'bid', cards: smallBid };
    }

    // If someone has already bid, we should pass
    // (We don't want to get stuck with the disgrace card)
    return { action: 'pass' };
  }

  /**
   * Decide bid for standard auction (trying to WIN the card)
   * Uses simple weighting system based on card value
   */
  decideStandardAuctionBid(currentCard, currentAuction, availableMoney, publicState) {
    // Calculate how much we think this card is worth
    const cardValue = this.evaluateCard(currentCard, publicState);

    // Calculate our available money total
    const availableMoneyTotal = availableMoney.reduce((sum, card) => sum + card.value, 0);

    // Calculate current highest bid
    const currentHighestBid = currentAuction.highestBid;

    // Decision weights (simple strategy)
    const PASS_THRESHOLD = 0.3; // 30% chance to pass on any card
    const MAX_BID_RATIO = 0.7;  // Don't spend more than 70% of remaining money

    // Random chance to pass (keeps AI unpredictable)
    if (Math.random() < PASS_THRESHOLD) {
      return { action: 'pass' };
    }

    // Don't bid if card value seems too low
    if (cardValue <= 2 && Math.random() < 0.5) {
      return { action: 'pass' };
    }

    // Calculate how much we're willing to bid
    // Simple formula: bid up to (card value * available money) / 20
    // This means higher value cards get higher bids
    const maxWillingToBid = Math.min(
      (cardValue * availableMoneyTotal) / 20,
      availableMoneyTotal * MAX_BID_RATIO
    );

    // If current bid is already too high, pass
    if (currentHighestBid >= maxWillingToBid) {
      return { action: 'pass' };
    }

    // Calculate our bid amount
    // We want to bid just enough to beat the current bid
    const targetBid = currentHighestBid + this.getMinimumIncrement(availableMoney);

    // If target bid exceeds what we're willing to pay, pass
    if (targetBid > maxWillingToBid) {
      return { action: 'pass' };
    }

    // Select cards that get us closest to target bid without going under
    const selectedCards = this.selectCardsForBid(availableMoney, targetBid, currentHighestBid);

    if (selectedCards.length === 0) {
      return { action: 'pass' };
    }

    return { action: 'bid', cards: selectedCards };
  }

  /**
   * Evaluate how valuable a card is to us
   * Simple heuristic based on card type and value
   */
  evaluateCard(card, publicState) {
    switch (card.type) {
      case CARD_TYPES.LUXURY:
        // Luxury cards are worth their face value
        return card.value;

      case CARD_TYPES.PRESTIGE:
        // Prestige cards are very valuable (they multiply score)
        // Worth about 10-15 points depending on how many luxury cards we might get
        return 12;

      case 'special':
        // Pawn Shop Trade - moderately valuable for strategic swaps
        return 5;

      case CARD_TYPES.DISGRACE:
        // Should never bid on disgrace in standard auction
        return 0;

      default:
        return 0;
    }
  }

  /**
   * Get minimum increment we need to beat current bid
   */
  getMinimumIncrement(availableMoney) {
    // Find the smallest available money card
    if (availableMoney.length === 0) return 0;
    return Math.min(...availableMoney.map(card => card.value));
  }

  /**
   * Select cards that add up to at least targetBid but beat currentBid
   * Uses greedy algorithm to get close to target
   */
  selectCardsForBid(availableMoney, targetBid, currentBid) {
    // Sort money cards by value (ascending)
    const sortedMoney = [...availableMoney].sort((a, b) => a.value - b.value);

    let selectedCards = [];
    let currentTotal = 0;

    // Try to find combination that beats current bid and gets close to target
    // Start with smallest cards and add until we beat the current bid
    for (let card of sortedMoney) {
      if (currentTotal >= targetBid) {
        break; // We've reached our target
      }

      selectedCards.push(card.id);
      currentTotal += card.value;

      // If we've beaten the current bid, we can stop
      // (unless we want to bid more to get closer to target)
      if (currentTotal > currentBid && currentTotal >= targetBid * 0.8) {
        break;
      }
    }

    // Verify we actually beat the current bid
    if (currentTotal <= currentBid) {
      return []; // Can't make a valid bid
    }

    return selectedCards;
  }

  /**
   * Select the N smallest cards from available money
   */
  selectSmallestCards(availableMoney, count) {
    const sorted = [...availableMoney].sort((a, b) => a.value - b.value);
    return sorted.slice(0, count).map(card => card.id);
  }

  /**
   * Decide which luxury card to discard (Repo Man effect)
   * Strategy: Discard the lowest value luxury card
   */
  decideLuxuryDiscard(wonCards) {
    const luxuryCards = wonCards.filter(card => card.type === CARD_TYPES.LUXURY);

    if (luxuryCards.length === 0) {
      return null; // No luxury cards to discard
    }

    // Find lowest value luxury card
    const lowestLuxury = luxuryCards.reduce((min, card) =>
      card.value < min.value ? card : min
    );

    return lowestLuxury.id;
  }

  /**
   * Decide which cards to swap (Pawn Shop Trade effect)
   * Strategy: Try to swap away disgrace cards or low-value luxuries
   * For simplicity in MVP, AI will skip the swap
   */
  decideCardSwap(publicState) {
    // For MVP, AI just skips the card swap
    // This can be enhanced later with strategic swapping
    return {
      player1Id: null,
      card1Id: null,
      player2Id: null,
      card2Id: null
    };
  }

  /**
   * Add a random delay to simulate thinking time
   * Returns a promise that resolves after delay
   */
  getThinkingDelay() {
    // Random delay between 1 second and 5 seconds for more human feel
    const minDelay = 1000;
    const maxDelay = 5000;
    const delay = Math.floor(Math.random() * (maxDelay - minDelay) + minDelay);
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

/**
 * AI Player Name Pool - Hillbilly Theme
 */
export const AI_NAMES = [
  'Billy Bob',
  'Cletus',
  'Bubba',
  'Earl',
  'Jethro',
  'Junior',
  'Skeeter',
  'Bo',
  'Hank',
  'Buck',
  'Jed',
  'Ray Ray',
  'Rufus',
  'Dwayne',
  'Virgil',
  'Darlene',
  'Tammy',
  'Jolene',
  'Bobbie Sue',
  'Dixie'
];

/**
 * Generate a unique AI player ID
 */
export function generateAIPlayerId(index) {
  return `ai_player_${index}_${Date.now()}`;
}

/**
 * Create an AI player instance
 */
export function createAIPlayer(index) {
  const id = generateAIPlayerId(index);
  const name = AI_NAMES[index % AI_NAMES.length];
  return new AIPlayer(id, name);
}
