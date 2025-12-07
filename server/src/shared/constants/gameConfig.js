/**
 * Game Configuration Constants
 * Centralized configuration values used throughout the application
 */

export const GAME_CONFIG = {
  // Player limits
  players: {
    min: 3,
    max: 5
  },

  // Money/card limits
  money: {
    startingTotal: 110,  // Sum of all money cards
    maxCardsInHand: 12,  // Maximum money cards a player can have
    minBillValue: 1,
    maxBillValue: 25
  },

  // Deck configuration
  deck: {
    totalCards: 15,       // Total cards in the item deck
    luxuryCards: 10,
    prestigeCards: 3,
    disgraceCards: 3,
    specialCards: 1
  },

  // AI configuration
  ai: {
    thinkingDelayMin: 1000,      // Minimum thinking time (ms)
    thinkingDelayMax: 5000,      // Maximum thinking time (ms)
    turnProcessingDelay: 100,    // Delay before processing AI turn (ms)
    playerAddDelay: 250          // Delay between adding AI players (ms)
  },

  // Room configuration
  room: {
    codeLength: 4,
    staleThresholdHours: 4,
    cleanupIntervalMs: 60 * 60 * 1000  // 1 hour
  },

  // UI timing configuration
  timing: {
    overlayDisplayDuration: 2000,   // How long overlays show (ms)
    overlayFadeDuration: 500,       // Fade in/out duration (ms)
    resetAnimationDuration: 500,    // Round reset fade duration (ms)
    resetMessageDuration: 4000      // How long reset message shows (ms)
  },

  // Validation limits
  validation: {
    playerNameMinLength: 1,
    playerNameMaxLength: 20,
    playerNamePattern: /^[a-zA-Z0-9\s_-]+$/
  }
};

// Helper to get calculated values
export const getGameConfig = () => ({
  ...GAME_CONFIG,
  // Add any computed values here
  calculated: {
    maxRounds: GAME_CONFIG.deck.totalCards,
    gameEndingCardCount: GAME_CONFIG.deck.prestigeCards + 1  // 3 prestige + Jerry Springer
  }
});
