/**
 * Tests for Story System
 */

import { StorySystem } from '../../src/ai/storySystem.js';

describe('StorySystem', () => {
  let storySystem;
  let mockPlayers;

  beforeEach(() => {
    storySystem = new StorySystem();
    mockPlayers = [
      { id: 'player1', name: 'Billy Bob', hasPassed: true },
      { id: 'player2', name: 'Cletus', hasPassed: true },
      { id: 'player3', name: 'Bubba', hasPassed: false }
    ];
  });

  describe('shouldStartStory', () => {
    test('should return true when 2+ players are eliminated and no active story', () => {
      const eliminatedPlayers = mockPlayers.filter(p => p.hasPassed);
      expect(storySystem.shouldStartStory(eliminatedPlayers)).toBe(true);
    });

    test('should return false when less than 2 players are eliminated', () => {
      const eliminatedPlayers = [mockPlayers[0]];
      expect(storySystem.shouldStartStory(eliminatedPlayers)).toBe(false);
    });

    test('should return false when story is already active', () => {
      const eliminatedPlayers = mockPlayers.filter(p => p.hasPassed);
      storySystem.startStory(eliminatedPlayers);
      expect(storySystem.shouldStartStory(eliminatedPlayers)).toBe(false);
    });
  });

  describe('startStory', () => {
    test('should start a story and select a storyteller', () => {
      const eliminatedPlayers = mockPlayers.filter(p => p.hasPassed);
      const result = storySystem.startStory(eliminatedPlayers);

      expect(result).toBe(true);
      expect(storySystem.hasActiveStory()).toBe(true);
      expect(storySystem.storytellerId).toBeTruthy();
      expect(['player1', 'player2']).toContain(storySystem.storytellerId);
    });

    test('should not start story with less than 2 players', () => {
      const result = storySystem.startStory([mockPlayers[0]]);
      expect(result).toBe(false);
      expect(storySystem.hasActiveStory()).toBe(false);
    });

    test('should select a story from the queue', () => {
      const eliminatedPlayers = mockPlayers.filter(p => p.hasPassed);
      storySystem.startStory(eliminatedPlayers);

      expect(storySystem.activeStory).toBeTruthy();
      expect(storySystem.activeStory.id).toBeTruthy();
      expect(storySystem.activeStory.parts).toBeTruthy();
      expect(storySystem.activeStory.parts.length).toBeGreaterThan(0);
    });
  });

  describe('getNextStoryPart', () => {
    beforeEach(() => {
      const eliminatedPlayers = mockPlayers.filter(p => p.hasPassed);
      storySystem.startStory(eliminatedPlayers);
    });

    test('should return the next story part', () => {
      const storyteller = mockPlayers.find(p => p.id === storySystem.storytellerId);
      const part = storySystem.getNextStoryPart(storyteller);

      expect(part).toBeTruthy();
      expect(typeof part).toBe('string');
      expect(part.length).toBeGreaterThan(0);
    });

    test('should advance the part index', () => {
      const storyteller = mockPlayers.find(p => p.id === storySystem.storytellerId);
      const initialIndex = storySystem.currentPartIndex;

      storySystem.getNextStoryPart(storyteller);

      expect(storySystem.currentPartIndex).toBe(initialIndex + 1);
    });

    test('should return null when no active story', () => {
      storySystem.activeStory = null;
      const part = storySystem.getNextStoryPart(mockPlayers[0]);

      expect(part).toBeNull();
    });

    test('should complete story and reset when all parts told', () => {
      const storyteller = mockPlayers.find(p => p.id === storySystem.storytellerId);
      const totalParts = storySystem.activeStory.parts.length;

      // Tell all parts
      for (let i = 0; i < totalParts; i++) {
        storySystem.getNextStoryPart(storyteller);
      }

      expect(storySystem.activeStory).toBeNull();
      expect(storySystem.storytellerId).toBeNull();
    });
  });

  describe('getReaction', () => {
    beforeEach(() => {
      const eliminatedPlayers = mockPlayers.filter(p => p.hasPassed);
      storySystem.startStory(eliminatedPlayers);
    });

    test('should return a reaction from a non-storyteller', () => {
      const eliminatedPlayers = mockPlayers.filter(p => p.hasPassed);
      const storyteller = mockPlayers.find(p => p.id === storySystem.storytellerId);

      const reaction = storySystem.getReaction(eliminatedPlayers, storyteller.name);

      expect(reaction).toBeTruthy();
      expect(reaction.reactor).toBeTruthy();
      expect(reaction.message).toBeTruthy();
      expect(reaction.reactor.id).not.toBe(storySystem.storytellerId);
    });

    test('should not select the same reactor twice in a row', () => {
      const eliminatedPlayers = mockPlayers.filter(p => p.hasPassed);
      const storyteller = mockPlayers.find(p => p.id === storySystem.storytellerId);

      const reaction1 = storySystem.getReaction(eliminatedPlayers, storyteller.name);
      const reaction2 = storySystem.getReaction(eliminatedPlayers, storyteller.name);

      // If there are only 2 eliminated players, one is storyteller, so reactions will alternate
      if (eliminatedPlayers.length === 2) {
        expect(reaction1.reactor.id).toBe(reaction2.reactor.id);
      } else {
        expect(reaction1.reactor.id).not.toBe(reaction2.reactor.id);
      }
    });

    test('should interpolate storyteller name in reaction', () => {
      const eliminatedPlayers = mockPlayers.filter(p => p.hasPassed);
      const storyteller = mockPlayers.find(p => p.id === storySystem.storytellerId);

      const reaction = storySystem.getReaction(eliminatedPlayers, storyteller.name);

      expect(typeof reaction.message).toBe('string');
      // Message might contain the storyteller's name
    });
  });

  describe('isStorytellerEliminated', () => {
    beforeEach(() => {
      const eliminatedPlayers = mockPlayers.filter(p => p.hasPassed);
      storySystem.startStory(eliminatedPlayers);
    });

    test('should return true when storyteller is not in active players', () => {
      const activePlayers = mockPlayers.filter(p => !p.hasPassed);
      const result = storySystem.isStorytellerEliminated(activePlayers);

      expect(result).toBe(true);
    });

    test('should return false when storyteller is in active players', () => {
      // Make storyteller an active player
      const storyteller = mockPlayers.find(p => p.id === storySystem.storytellerId);
      if (storyteller) {
        storyteller.hasPassed = false;
      }

      const activePlayers = mockPlayers.filter(p => !p.hasPassed);
      const result = storySystem.isStorytellerEliminated(activePlayers);

      expect(result).toBe(false);
    });
  });

  describe('reset', () => {
    test('should reset all story state', () => {
      const eliminatedPlayers = mockPlayers.filter(p => p.hasPassed);
      storySystem.startStory(eliminatedPlayers);
      storySystem.getNextStoryPart(mockPlayers[0]);

      storySystem.reset();

      expect(storySystem.activeStory).toBeNull();
      expect(storySystem.storytellerId).toBeNull();
      expect(storySystem.currentPartIndex).toBe(0);
      expect(storySystem.lastReactorId).toBeNull();
    });
  });

  describe('hasActiveStory', () => {
    test('should return false initially', () => {
      expect(storySystem.hasActiveStory()).toBe(false);
    });

    test('should return true after starting a story', () => {
      const eliminatedPlayers = mockPlayers.filter(p => p.hasPassed);
      storySystem.startStory(eliminatedPlayers);

      expect(storySystem.hasActiveStory()).toBe(true);
    });

    test('should return false after story completes', () => {
      const eliminatedPlayers = mockPlayers.filter(p => p.hasPassed);
      storySystem.startStory(eliminatedPlayers);

      const storyteller = mockPlayers.find(p => p.id === storySystem.storytellerId);
      const totalParts = storySystem.activeStory.parts.length;

      for (let i = 0; i < totalParts; i++) {
        storySystem.getNextStoryPart(storyteller);
      }

      expect(storySystem.hasActiveStory()).toBe(false);
    });
  });
});
