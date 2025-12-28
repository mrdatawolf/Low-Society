/**
 * Tests for Chat Configuration
 */

import {
  CHAT_MODES,
  CHAT_CONFIG,
  calculateChatDelay,
  secondsToMs
} from '../../src/shared/constants/chatConfig.js';

describe('Chat Configuration', () => {
  describe('CHAT_MODES', () => {
    test('should have tutorial and commentary modes', () => {
      expect(CHAT_MODES.TUTORIAL).toBe('tutorial');
      expect(CHAT_MODES.COMMENTARY).toBe('commentary');
    });
  });

  describe('CHAT_CONFIG', () => {
    test('should have modes property', () => {
      expect(CHAT_CONFIG.modes).toBeTruthy();
      expect(CHAT_CONFIG.modes.TUTORIAL).toBe('tutorial');
      expect(CHAT_CONFIG.modes.COMMENTARY).toBe('commentary');
    });

    test('should have timing configuration', () => {
      expect(CHAT_CONFIG.timing).toBeTruthy();
      expect(typeof CHAT_CONFIG.timing.perCharacterPause).toBe('number');
      expect(typeof CHAT_CONFIG.timing.finalPause).toBe('number');
      expect(typeof CHAT_CONFIG.timing.minDelay).toBe('number');
      expect(typeof CHAT_CONFIG.timing.maxDelay).toBe('number');
    });

    test('timing should have sensible values', () => {
      expect(CHAT_CONFIG.timing.perCharacterPause).toBeGreaterThan(0);
      expect(CHAT_CONFIG.timing.finalPause).toBeGreaterThan(0);
      expect(CHAT_CONFIG.timing.minDelay).toBeGreaterThan(0);
      expect(CHAT_CONFIG.timing.maxDelay).toBeGreaterThan(CHAT_CONFIG.timing.minDelay);
    });
  });

  describe('calculateChatDelay', () => {
    test('should calculate delay based on message length', () => {
      const shortMessage = "Hi!";
      const longMessage = "This is a much longer message that should take more time to read and understand.";

      const shortDelay = calculateChatDelay(shortMessage);
      const longDelay = calculateChatDelay(longMessage);

      expect(longDelay).toBeGreaterThan(shortDelay);
    });

    test('should respect minimum delay', () => {
      const veryShortMessage = "a";
      const delay = calculateChatDelay(veryShortMessage);

      expect(delay).toBeGreaterThanOrEqual(CHAT_CONFIG.timing.minDelay);
    });

    test('should respect maximum delay', () => {
      const veryLongMessage = "a".repeat(1000);
      const delay = calculateChatDelay(veryLongMessage);

      expect(delay).toBeLessThanOrEqual(CHAT_CONFIG.timing.maxDelay);
    });

    test('should follow formula: (charCount * perCharacterPause) + finalPause', () => {
      const message = "Hello world!"; // 12 characters
      const expectedDelay = (12 * CHAT_CONFIG.timing.perCharacterPause) + CHAT_CONFIG.timing.finalPause;
      const delay = calculateChatDelay(message);

      // Should match expected delay (within min/max bounds)
      const bounded = Math.max(
        CHAT_CONFIG.timing.minDelay,
        Math.min(expectedDelay, CHAT_CONFIG.timing.maxDelay)
      );

      expect(delay).toBe(bounded);
    });

    test('should handle empty message', () => {
      const delay = calculateChatDelay("");

      expect(delay).toBeGreaterThanOrEqual(CHAT_CONFIG.timing.minDelay);
      expect(delay).toBeLessThanOrEqual(CHAT_CONFIG.timing.maxDelay);
    });
  });

  describe('secondsToMs', () => {
    test('should convert seconds to milliseconds', () => {
      expect(secondsToMs(1)).toBe(1000);
      expect(secondsToMs(2.5)).toBe(2500);
      expect(secondsToMs(0.5)).toBe(500);
    });

    test('should handle zero', () => {
      expect(secondsToMs(0)).toBe(0);
    });

    test('should handle negative values', () => {
      expect(secondsToMs(-1)).toBe(-1000);
    });
  });
});
