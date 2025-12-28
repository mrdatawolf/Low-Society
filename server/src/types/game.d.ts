/**
 * TypeScript definitions for Low Society game types
 * @module types/game
 */

/**
 * Game phase constants
 */
export type GamePhase = 'waiting' | 'starting' | 'auction' | 'card_swap' | 'discard_luxury' | 'game_over';

/**
 * Auction type constants
 */
export type AuctionType = 'standard' | 'reverse';

/**
 * Card type constants
 */
export type CardType = 'money' | 'luxury' | 'disgrace' | 'prestige';

/**
 * Chat mode constants
 */
export type ChatMode = 'tutorial' | 'commentary';

/**
 * Money card interface
 */
export interface MoneyCard {
  id: string;
  type: 'money';
  value: number;
  name: string;
}

/**
 * Item card interface (luxury, disgrace, prestige)
 */
export interface ItemCard {
  id: string;
  type: CardType;
  value: number;
  name: string;
  description: string;
  specialEffect?: 'pawn_shop' | 'repo_man';
}

/**
 * Union type for all card types
 */
export type Card = MoneyCard | ItemCard;

/**
 * Player interface
 */
export interface Player {
  id: string;
  name: string;
  moneyHand: MoneyCard[];
  currentBid: string[];
  wonCards: ItemCard[];
  hasPassed: boolean;
  isEliminated: boolean;
  ai: boolean;
  finalScore?: number;
}

/**
 * Auction state interface
 */
export interface AuctionState {
  currentCard: ItemCard;
  auctionType: AuctionType;
  currentTurnPlayerId: string;
  highestBid: number;
  highestBidderId: string | null;
  turnOrder: string[];
}

/**
 * Public game state (visible to all players)
 */
export interface PublicGameState {
  roomCode: string;
  phase: GamePhase;
  players: PublicPlayer[];
  currentCard: ItemCard | null;
  currentAuction: AuctionState | null;
  cardsRemaining: number;
  discardingPlayerId: string | null;
  swapWinnerId: string | null;
  host: string;
  chatMode: ChatMode;
}

/**
 * Public player data (visible to all)
 */
export interface PublicPlayer {
  id: string;
  name: string;
  moneyCount: number;
  currentBid: string[];
  wonCards: ItemCard[];
  hasPassed: boolean;
  isEliminated: boolean;
  ai: boolean;
  finalScore?: number;
}

/**
 * Private game state (visible only to specific player)
 */
export interface PrivateGameState {
  moneyHand: MoneyCard[];
  removedBill: MoneyCard | null;
}

/**
 * Game results interface
 */
export interface GameResults {
  winner: Player | null;
  players: PlayerResult[];
  eliminatedInRound: Player | null;
}

/**
 * Player result interface
 */
export interface PlayerResult {
  id: string;
  name: string;
  totalMoney: number;
  luxuryScore: number;
  disgraceScore: number;
  prestigeScore: number;
  finalScore: number;
  isEliminated: boolean;
  wonCards: ItemCard[];
}

/**
 * Card swap parameters
 */
export interface CardSwapParams {
  player1Id: string;
  card1Id: string;
  player2Id: string;
  card2Id: string;
}

/**
 * Chat message interface
 */
export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  mode: ChatMode;
  timestamp?: number;
}

/**
 * Game configuration
 */
export interface GameConfig {
  players: {
    min: number;
    max: number;
  };
  money: {
    startingAmount: number;
    bills: number[];
  };
  ai: {
    thinkingDelayMin: number;
    thinkingDelayMax: number;
    turnProcessingDelay: number;
  };
  timing: {
    aiPlayerAddDelay: number;
    overlayDisplayDuration: number;
    overlayFadeDuration: number;
  };
}

/**
 * Chat configuration
 */
export interface ChatConfig {
  modes: {
    TUTORIAL: ChatMode;
    COMMENTARY: ChatMode;
  };
  timing: {
    perCharacterPause: number;
    finalPause: number;
    minDelay: number;
    maxDelay: number;
  };
}
