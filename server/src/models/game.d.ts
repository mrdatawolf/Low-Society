/**
 * Type definitions for Game model
 * Low Society game state management
 */

/**
 * Money card representing currency in the game
 */
export interface MoneyCard {
  id: string;
  value: number;  // 1, 2, 3, 4, 6, 8, 10, 12, 15, 20, or 25
}

/**
 * Card types in the game
 */
export type CardType = 'luxury' | 'prestige' | 'disgrace' | 'special';

/**
 * Item card (luxury, prestige, disgrace, or special)
 */
export interface Card {
  id: string;
  name: string;
  type: CardType;
  value?: number;
  effectDescription?: string;
}

/**
 * Game phases
 */
export type GamePhase =
  | 'waiting'
  | 'starting'
  | 'auction'
  | 'card_swap'
  | 'discard_luxury'
  | 'game_over';

/**
 * Auction types
 */
export type AuctionType = 'standard' | 'reverse';

/**
 * Player object (internal representation)
 */
export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  moneyHand: MoneyCard[];
  wonCards: Card[];
  currentBid: MoneyCard[];
  hasPassed: boolean;
  removedBill: MoneyCard | null;
}

/**
 * Public player information (visible to all)
 */
export interface PublicPlayer {
  id: string;
  name: string;
  isAI: boolean;
  remainingMoney: number;
  wonCardsCount: number;
  wonCards: Card[];
  hasPassed: boolean;
  currentBidTotal: number;
}

/**
 * Current auction state
 */
export interface Auction {
  type: AuctionType;
  highestBid: number;
  highestBidder: string | null;
  activePlayers: string[];
  currentTurnIndex: number;
  currentTurnPlayerId: string;
  swapWinner?: string;  // For card swap phase
}

/**
 * Player score for game results
 */
export interface PlayerScore {
  id: string;
  name: string;
  prestigeScore: number;
  luxuryScore: number;
  disgraceScore: number;
  totalScore: number;
  remainingMoney: number;
  wonCards: Card[];
  isLoser: boolean;
  loserReason?: string;
}

/**
 * Game results
 */
export interface GameResults {
  winner: PlayerScore;
  players: PlayerScore[];
}

/**
 * Public game state (visible to all players)
 */
export interface PublicState {
  roomCode: string;
  phase: GamePhase;
  playerCount: number;
  players: PublicPlayer[];
  currentCard: Card | null;
  deckSize: number;
  currentAuction: Auction | null;
  results: GameResults | null;
  host: string;
  discardingPlayerId: string | null;
}

/**
 * Private game state (visible only to specific player)
 */
export interface PrivateState {
  moneyHand: MoneyCard[];
  removedBill: MoneyCard | null;
  currentBid: MoneyCard[];
}

/**
 * Game class - manages game state and logic
 */
export class Game {
  roomCode: string;
  players: Player[];
  phase: GamePhase;
  itemDeck: Card[];
  currentCard: Card | null;
  currentAuction: Auction | null;
  host: string | null;
  createdAt: number;
  results: GameResults | null;
  nextStartingPlayerId: string | null;
  discardingPlayerId: string | null;

  /**
   * Create a new game instance
   * @param roomCode - Unique room code for this game
   */
  constructor(roomCode: string);

  /**
   * Add a player to the game
   * @param playerId - Unique player identifier (socket ID)
   * @param playerName - Player's display name
   * @param isAI - Whether this player is AI-controlled
   * @returns The created player object
   * @throws Error if room is full or game already started
   */
  addPlayer(playerId: string, playerName: string, isAI?: boolean): Player;

  /**
   * Remove a player from the game
   * @param playerId - ID of player to remove
   */
  removePlayer(playerId: string): void;

  /**
   * Start the game
   * Initializes deck, removes random bills, starts first auction
   * @throws Error if not enough players
   */
  startGame(): void;

  /**
   * Start the next auction
   * Draws next card and initializes auction state
   * Ends game if deck is empty
   */
  startNextAuction(): void;

  /**
   * Restart the current auction
   * Used when a player rejoins during an active auction
   */
  restartCurrentAuction(): void;

  /**
   * Place a bid in the current auction
   * @param playerId - ID of player placing bid
   * @param moneyCardIds - Array of money card IDs to bid
   * @returns Total value of the bid
   * @throws Error if not player's turn, already passed, or bid invalid
   */
  placeBid(playerId: string, moneyCardIds: string[]): number;

  /**
   * Pass on the current auction
   * @param playerId - ID of player passing
   * @throws Error if not player's turn or already passed
   */
  pass(playerId: string): void;

  /**
   * Execute a card swap (Pawn Shop Trade effect)
   * @param executingPlayerId - ID of player executing swap
   * @param player1Id - First player ID (or null to skip)
   * @param card1Id - First card ID (or null to skip)
   * @param player2Id - Second player ID (or null to skip)
   * @param card2Id - Second card ID (or null to skip)
   * @throws Error if swap is invalid
   */
  executeCardSwap(
    executingPlayerId: string,
    player1Id: string | null,
    card1Id: string | null,
    player2Id: string | null,
    card2Id: string | null
  ): void;

  /**
   * Discard a luxury card (Repo Man effect)
   * @param playerId - ID of player discarding
   * @param cardId - ID of card to discard
   * @throws Error if player doesn't have card or not their turn
   */
  discardLuxuryCard(playerId: string, cardId: string): void;

  /**
   * Get total money value for a player
   * @param playerId - Player ID
   * @returns Total money value
   */
  getPlayerMoneyTotal(playerId: string): number;

  /**
   * Calculate bid total for a player with given cards
   * @param playerId - Player ID
   * @param moneyCardIds - Array of money card IDs
   * @returns Total bid value
   */
  calculatePlayerBidTotal(playerId: string, moneyCardIds: string[]): number;

  /**
   * Get public game state (visible to all players)
   * @returns Public state object
   */
  getPublicState(): PublicState;

  /**
   * Get private state for a specific player
   * @param playerId - Player ID
   * @returns Private state or null if player not found
   */
  getPrivateState(playerId: string): PrivateState | null;

  /**
   * End the game and calculate results
   * @returns Game results
   */
  endGame(): GameResults;
}

/**
 * Auction type constants
 */
export const AUCTION_TYPES: {
  STANDARD: 'standard';
  REVERSE: 'reverse';
};

/**
 * Game phase constants (re-exported from shared constants)
 */
export const GAME_PHASES: {
  WAITING: 'waiting';
  STARTING: 'starting';
  AUCTION: 'auction';
  CARD_SWAP: 'card_swap';
  DISCARD_LUXURY: 'discard_luxury';
  GAME_OVER: 'game_over';
};
