/**
 * TypeScript definitions for Socket.io events and payloads
 * @module types/socket
 */

import type {
  PublicGameState,
  PrivateGameState,
  Player,
  GameResults,
  CardSwapParams,
  ChatMessage,
  ChatMode
} from './game';

/**
 * Socket event callback type
 */
export type SocketCallback<T = any> = (response: T) => void;

/**
 * Success/error response interface
 */
export interface SocketResponse {
  success: boolean;
  error?: string;
}

/**
 * Room creation response
 */
export interface CreateRoomResponse extends SocketResponse {
  roomCode?: string;
  playerId?: string;
  playerName?: string;
}

/**
 * Join room response
 */
export interface JoinRoomResponse extends SocketResponse {
  publicState?: PublicGameState;
  privateState?: PrivateGameState;
  myPlayerId?: string;
}

/**
 * Start game response
 */
export interface StartGameResponse extends SocketResponse {
  publicState?: PublicGameState;
  privateState?: PrivateGameState;
}

/**
 * Bid placement response
 */
export interface PlaceBidResponse extends SocketResponse {
  bidTotal?: number;
}

/**
 * Pass response
 */
export interface PassResponse extends SocketResponse {}

/**
 * Card swap response
 */
export interface CardSwapResponse extends SocketResponse {}

/**
 * Discard luxury response
 */
export interface DiscardLuxuryResponse extends SocketResponse {}

/**
 * Chat mode response
 */
export interface ChatModeResponse extends SocketResponse {
  mode?: ChatMode;
}

/**
 * Client to Server events
 */
export interface ClientToServerEvents {
  // Room management
  create_room: (data: { playerName: string }, callback: SocketCallback<CreateRoomResponse>) => void;
  join_room: (data: { roomCode: string; playerName: string }, callback: SocketCallback<JoinRoomResponse>) => void;
  leave_room: (callback?: SocketCallback<SocketResponse>) => void;

  // Game control
  start_game: (data: { aiEnabled?: boolean; spectatorMode?: boolean }, callback: SocketCallback<StartGameResponse>) => void;

  // Game actions
  place_bid: (data: { moneyCardIds: string[] }, callback: SocketCallback<PlaceBidResponse>) => void;
  pass: (callback: SocketCallback<PassResponse>) => void;
  execute_card_swap: (data: CardSwapParams | { player1Id: null; card1Id: null; player2Id: null; card2Id: null }, callback: SocketCallback<CardSwapResponse>) => void;
  discard_luxury_card: (data: { cardId: string }, callback: SocketCallback<DiscardLuxuryResponse>) => void;

  // Chat
  set_chat_mode: (data: { mode: ChatMode }, callback?: SocketCallback<ChatModeResponse>) => void;

  // State queries
  get_state: (callback: SocketCallback<{ publicState: PublicGameState; privateState: PrivateGameState }>) => void;

  // Connection
  disconnect: () => void;
}

/**
 * Server to Client events
 */
export interface ServerToClientEvents {
  // State updates
  state_update: (data: { publicState: PublicGameState }) => void;
  private_state_update: (data: { privateState: PrivateGameState }) => void;

  // Room events
  player_joined: (data: { publicState: PublicGameState; playerName: string }) => void;
  player_left: (data: { publicState: PublicGameState; playerName: string }) => void;
  player_disconnected: (data: { playerName: string }) => void;
  player_reconnected: (data: { playerName: string }) => void;

  // Game events
  game_started: (data: { publicState: PublicGameState; privateState: PrivateGameState }) => void;
  game_over: (data: { results: GameResults }) => void;

  // Auction events
  bid_placed: (data: { publicState: PublicGameState; playerId: string; bidTotal: number }) => void;
  player_passed: (data: { publicState: PublicGameState; playerId: string }) => void;

  // Special events
  round_reset: (data: { publicState: PublicGameState }) => void;
  cards_swapped: (data: { publicState: PublicGameState }) => void;
  luxury_card_discarded: (data: { publicState: PublicGameState; playerId: string; cardId: string }) => void;

  // Chat events
  ai_chat_message: (data: { playerId: string; playerName: string; message: string; duration: number; mode: ChatMode }) => void;
  chat_mode_changed: (data: { mode: ChatMode }) => void;

  // Error events
  error: (data: { message: string; details?: any }) => void;
  game_error: (data: { message: string }) => void;
}

/**
 * Socket data stored on connection
 */
export interface SocketData {
  roomCode?: string;
  playerId?: string;
  playerName?: string;
}

/**
 * Extended Socket type with typed events
 */
import type { Socket as BaseSocket } from 'socket.io';

export type TypedSocket = BaseSocket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;

/**
 * Extended Server type with typed events
 */
import type { Server as BaseServer } from 'socket.io';

export type TypedServer = BaseServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
