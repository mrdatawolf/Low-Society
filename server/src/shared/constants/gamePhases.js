/**
 * Game Phase Constants
 * Shared between client and server to ensure consistency
 */

export const GAME_PHASES = {
  WAITING: 'waiting',           // Waiting for players to join
  STARTING: 'starting',         // Game is starting (removing random bills)
  AUCTION: 'auction',           // Active auction phase
  CARD_SWAP: 'card_swap',       // Pawn Shop Trade - winner selecting cards to swap
  DISCARD_LUXURY: 'discard_luxury', // Repo Man - player selecting luxury to discard
  GAME_OVER: 'game_over'        // Game has ended
};

// For backwards compatibility and type checking
export const isValidPhase = (phase) => {
  return Object.values(GAME_PHASES).includes(phase);
};

// Home phase is client-only (not a server game state)
export const CLIENT_PHASES = {
  HOME: 'home',
  ...GAME_PHASES
};
