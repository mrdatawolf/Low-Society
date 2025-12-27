/**
 * Socket Event Name Constants
 * Shared between client and server to prevent typos and ensure consistency
 */

export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  // Room events
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',

  // Game control events
  START_GAME: 'start_game',
  GET_STATE: 'get_state',

  // Player action events
  PLACE_BID: 'place_bid',
  PASS: 'pass',
  EXECUTE_CARD_SWAP: 'execute_card_swap',
  DISCARD_LUXURY_CARD: 'discard_luxury_card',

  // Server -> Client state update events
  STATE_UPDATE: 'state_update',
  PRIVATE_STATE_UPDATE: 'private_state_update',
  GAME_STARTED: 'game_started',

  // Player event broadcasts
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  PLAYER_PASSED: 'player_passed',
  PLAYER_DISCONNECTED: 'player_disconnected',

  // Game action broadcasts
  BID_PLACED: 'bid_placed',
  CARDS_SWAPPED: 'cards_swapped',
  LUXURY_CARD_DISCARDED: 'luxury_card_discarded',

  // Special events
  ROUND_RESET: 'round_reset',
  ERROR: 'error',

  // Chat events
  AI_CHAT_MESSAGE: 'ai_chat_message',
  SET_CHAT_MODE: 'set_chat_mode',
  CHAT_MODE_CHANGED: 'chat_mode_changed'
};

// Helper to validate event names (useful for debugging)
export const isValidEvent = (eventName) => {
  return Object.values(SOCKET_EVENTS).includes(eventName);
};
