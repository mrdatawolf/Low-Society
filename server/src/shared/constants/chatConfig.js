/**
 * Chat System Configuration
 *
 * Defines constants for the Chatty Cathy chat bubble system.
 * Supports two mutually exclusive modes: Tutorial and Commentary.
 */

export const CHAT_MODES = {
  TUTORIAL: 'tutorial',
  COMMENTARY: 'commentary'
};

export const CHAT_CONFIG = {
  modes: CHAT_MODES,

  timing: {
    perCharacterPause: 0.05,  // seconds per character (50ms)
    finalPause: 1.0,          // seconds after message completes (1s)
    minDelay: 0.5,            // minimum delay (500ms)
    maxDelay: 5.0             // maximum delay (5s)
  },

  display: {
    maxBubbleWidth: 300,      // pixels
    fontSize: 14,             // pixels
    fadeInDuration: 300,      // milliseconds
    fadeOutDuration: 300      // milliseconds
  }
};

/**
 * Calculate how long to display a chat message based on its length
 * Formula: (charCount × perCharacterPause) + finalPause
 *
 * @param {string} message - The chat message
 * @returns {number} Duration in seconds
 *
 * @example
 * // "I'll bid $5 because I need this luxury card!" (45 chars)
 * // Returns: (45 × 0.05) + 1.0 = 2.25 + 1.0 = 3.25 seconds
 * calculateChatDelay("I'll bid $5 because I need this luxury card!")
 */
export function calculateChatDelay(message) {
  const charCount = message.length;
  const delay = (charCount * CHAT_CONFIG.timing.perCharacterPause) + CHAT_CONFIG.timing.finalPause;

  // Clamp between min and max
  return Math.max(
    CHAT_CONFIG.timing.minDelay,
    Math.min(delay, CHAT_CONFIG.timing.maxDelay)
  );
}

/**
 * Convert seconds to milliseconds for setTimeout
 *
 * @param {number} seconds - Duration in seconds
 * @returns {number} Duration in milliseconds
 */
export function secondsToMs(seconds) {
  return seconds * 1000;
}
