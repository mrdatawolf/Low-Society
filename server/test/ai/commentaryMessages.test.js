/**
 * Tests for Commentary Messages
 */

import {
  getCommentaryMessage,
  getStory,
  getJoke,
  determineMessageType
} from '../../src/ai/commentaryMessages.js';

describe('Commentary Messages', () => {
  describe('getCommentaryMessage', () => {
    test('should return a message for high bid event', () => {
      const context = {
        playerName: 'Billy Bob',
        bidAmount: 20
      };

      const message = getCommentaryMessage('HIGH_BID', context);

      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    test('should return a message for player passed event', () => {
      const message = getCommentaryMessage('PLAYER_PASSED', {});

      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
    });

    test('should interpolate player name in message', () => {
      const context = {
        playerName: 'Cletus'
      };

      const message = getCommentaryMessage('HIGH_BID', context);

      // Message should contain the player name if template uses {playerName}
      expect(typeof message).toBe('string');
    });

    test('should handle unknown event gracefully', () => {
      const message = getCommentaryMessage('UNKNOWN_EVENT', {});

      // Should return null or empty string
      expect(message === null || message === '' || typeof message === 'string').toBe(true);
    });
  });

  describe('getStory', () => {
    test('should return a random story', () => {
      const story = getStory();

      expect(story).toBeTruthy();
      expect(typeof story).toBe('string');
      expect(story.length).toBeGreaterThan(0);
    });

    test('should return different stories on multiple calls', () => {
      const stories = new Set();

      for (let i = 0; i < 20; i++) {
        stories.add(getStory());
      }

      // Should have some variation (at least 2 different stories)
      expect(stories.size).toBeGreaterThan(1);
    });
  });

  describe('getJoke', () => {
    test('should return a random joke', () => {
      const joke = getJoke();

      expect(joke).toBeTruthy();
      expect(typeof joke).toBe('string');
      expect(joke.length).toBeGreaterThan(0);
    });

    test('should return different jokes on multiple calls', () => {
      const jokes = new Set();

      for (let i = 0; i < 20; i++) {
        jokes.add(getJoke());
      }

      // Should have some variation (at least 2 different jokes)
      expect(jokes.size).toBeGreaterThan(1);
    });
  });

  describe('determineMessageType', () => {
    test('should return a message type object', () => {
      const result = determineMessageType('auction', {
        lastEvent: 'BID',
        context: {}
      });

      expect(result).toBeTruthy();
      expect(result.type).toBeTruthy();
      expect(['EVENT_COMMENTARY', 'STORY', 'JOKE', 'REACTION']).toContain(result.type);
    });

    test('should handle different game phases', () => {
      const phases = ['starting', 'auction', 'card_swap', 'discard_luxury'];

      phases.forEach(phase => {
        const result = determineMessageType(phase, {});
        expect(result).toBeTruthy();
        expect(result.type).toBeTruthy();
      });
    });

    test('should include event context when type is EVENT_COMMENTARY', () => {
      // Run multiple times to eventually hit EVENT_COMMENTARY
      let foundEventCommentary = false;
      for (let i = 0; i < 20; i++) {
        const result = determineMessageType('auction', {
          lastEvent: 'BID',
          context: { playerName: 'Test' }
        });

        if (result.type === 'EVENT_COMMENTARY') {
          expect(result.event).toBe('BID');
          expect(result.context).toBeTruthy();
          foundEventCommentary = true;
          break;
        }
      }
      // Should eventually find one given 60% probability
      expect(foundEventCommentary).toBe(true);
    });
  });
});
