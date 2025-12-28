/**
 * Tests for Tutorial Messages
 */

import { getTutorialMessage } from '../../src/ai/tutorialMessages.js';

describe('Tutorial Messages', () => {
  describe('getTutorialMessage', () => {
    test('should return a message for BID action', () => {
      const context = {
        bidAmount: 5,
        cardName: 'Velvet Painting',
        cardType: 'luxury',
        cardValue: 3,
        reasoning: 'I need more luxury points'
      };

      const message = getTutorialMessage('BID', context);

      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    test('should return a message for PASS action', () => {
      const context = {
        reasoning: 'I need to conserve money'
      };

      const message = getTutorialMessage('PASS', context);

      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
    });

    test('should return a message for SWAP action', () => {
      const context = {
        reasoning: 'I want to help my position'
      };

      const message = getTutorialMessage('SWAP', context);

      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
    });

    test('should return a message for SKIP_SWAP action', () => {
      const context = {
        reasoning: 'The cards are distributed fairly'
      };

      const message = getTutorialMessage('SKIP_SWAP', context);

      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
    });

    test('should return a message for DISCARD action', () => {
      const context = {
        cardName: 'Bowling Trophy',
        reasoning: 'It has the lowest value'
      };

      const message = getTutorialMessage('DISCARD', context);

      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
    });

    test('should handle unknown action gracefully', () => {
      const message = getTutorialMessage('UNKNOWN_ACTION', {});

      // Should either return null or a default message
      expect(message === null || typeof message === 'string').toBe(true);
    });

    test('should handle empty context', () => {
      const message = getTutorialMessage('BID', {});

      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
    });
  });
});
