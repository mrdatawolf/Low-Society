/**
 * Client-side TypeScript definitions for Low Society
 * @module types/game
 */

/**
 * Game phase constants
 */
export type GamePhase = 'home' | 'lobby' | 'starting' | 'auction' | 'card_swap' | 'discard_luxury' | 'game_over';

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
 * Player seat position
 */
export type SeatPosition = 'seat-bottom' | 'seat-left' | 'seat-top-left' | 'seat-top' | 'seat-top-right' | 'seat-right';

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
  moneyCount: number;
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
  phase: string;
  players: Player[];
  currentCard: ItemCard | null;
  currentAuction: AuctionState | null;
  cardsRemaining: number;
  discardingPlayerId: string | null;
  swapWinnerId: string | null;
  host: string;
  chatMode: ChatMode;
  playerCount?: number;
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
  winner: PlayerResult | null;
  players: PlayerResult[];
  eliminatedInRound: PlayerResult | null;
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
 * Chat message interface
 */
export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  duration: number;
  mode: ChatMode;
  timestamp: number;
}

/**
 * Card swap parameters
 */
export interface CardSwapSelection {
  playerId: string;
  cardId: string;
}

/**
 * Component props interfaces
 */

export interface PokerTableProps {
  players: Player[];
  currentPlayerId: string;
  currentTurnPlayerId: string | null;
  currentCard: ItemCard | null;
  cardsRemaining: number;
  tableImage?: string | null;
  onPlayerClick?: ((playerId: string) => void) | null;
  showStats?: boolean;
}

export interface ChatBubbleProps {
  playerId: string;
  playerName: string;
  message: string;
  duration: number;
  onComplete?: () => void;
  mode?: ChatMode;
  playerPosition?: SeatPosition;
}

export interface GameScreenProps {
  gameState: PublicGameState;
  privateState: PrivateGameState;
  myPlayerId: string;
  onPlaceBid: (moneyCardIds: string[]) => void;
  onPass: () => void;
  onExecuteCardSwap: (data: any) => void;
  onDiscardLuxuryCard: (cardId: string) => void;
  onLeaveRoom: () => void;
  roundReset: any;
  gameDisconnected: boolean;
  chatMessage: ChatMessage | null;
  onClearChatMessage: () => void;
}

export interface LobbyScreenProps {
  gameState: PublicGameState;
  isHost: boolean;
  onStartGame: (options: { aiEnabled: boolean; spectatorMode?: boolean }) => void;
  onLeaveRoom: () => void;
}

export interface GameOverScreenProps {
  results: GameResults;
  onNewGame: () => void;
  onLeaveRoom: () => void;
}
