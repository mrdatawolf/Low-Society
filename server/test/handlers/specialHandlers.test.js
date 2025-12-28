import { jest } from "@jest/globals";
/**
 * Tests for Special Card Handlers
 */

import { handleExecuteCardSwap, handleDiscardLuxuryCard } from '../../src/handlers/specialHandlers.js';
import { roomManager } from '../../src/services/roomManager.js';
import { CARD_TYPES } from '../../src/models/cards.js';

describe('Special Card Handlers', () => {
  // roomManager is imported singleton
  let mockSocket;
  let mockIo;
  let emittedEvents;
  let roomCode;
  let game;

  beforeEach(() => {
    roomManager.rooms.clear();
    roomManager.playerRooms.clear();
    emittedEvents = [];

    mockSocket = {
      id: 'socket_123',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn()
    };

    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn((event, data) => {
        emittedEvents.push({ event, data });
      })
    };

    // Create a game and room
    const result = roomManager.createRoom(mockSocket.id, 'Alice');
    roomCode = result.roomCode;
    game = result.game;

    // Add more players and start game
    game.addPlayer('p2', 'Bob');
    game.addPlayer('p3', 'Charlie');
    game.startGame();
  });

  describe('handleExecuteCardSwap', () => {
    beforeEach(() => {
      // Give players some won cards
      game.players[0].wonCards.push({ id: 'lux-1', type: CARD_TYPES.LUXURY, value: 5 });
      game.players[1].wonCards.push({ id: 'lux-2', type: CARD_TYPES.LUXURY, value: 3 });
      game.swappingPlayerId = mockSocket.id;
      game.phase = 'card_swap';
    });

    test('should execute valid card swap', (done) => {
      const handler = handleExecuteCardSwap(mockSocket, roomManager, mockIo);

      handler({
        player1Id: game.players[0].id,
        card1Id: 'lux-1',
        player2Id: game.players[1].id,
        card2Id: 'lux-2'
      }, (response) => {
        expect(response.success).toBe(true);

        // Should emit cards_swapped event
        const swapEvent = emittedEvents.find(e => e.event === 'cards_swapped');
        expect(swapEvent).toBeTruthy();

        done();
      });
    });

    test('should allow skipping card swap', (done) => {
      const handler = handleExecuteCardSwap(mockSocket, roomManager, mockIo);

      handler({
        player1Id: null,
        card1Id: null,
        player2Id: null,
        card2Id: null
      }, (response) => {
        expect(response.success).toBe(true);
        done();
      });
    });

    test('should reject partial parameters', (done) => {
      const handler = handleExecuteCardSwap(mockSocket, roomManager, mockIo);

      handler({
        player1Id: game.players[0].id,
        card1Id: 'lux-1',
        player2Id: null,
        card2Id: null
      }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('all parameters');
        done();
      });
    });

    test('should reject non-string player IDs', (done) => {
      const handler = handleExecuteCardSwap(mockSocket, roomManager, mockIo);

      handler({
        player1Id: 123,
        card1Id: 'lux-1',
        player2Id: game.players[1].id,
        card2Id: 'lux-2'
      }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('strings');
        done();
      });
    });

    test('should reject swapping card with itself', (done) => {
      const handler = handleExecuteCardSwap(mockSocket, roomManager, mockIo);

      handler({
        player1Id: game.players[0].id,
        card1Id: 'lux-1',
        player2Id: game.players[0].id,
        card2Id: 'lux-1'
      }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('itself');
        done();
      });
    });

    test('should reject when not in a room', (done) => {
      const newSocket = {
        id: 'socket_999',
        join: jest.fn(),
        leave: jest.fn(),
      emit: jest.fn()
      };

      const handler = handleExecuteCardSwap(newSocket, roomManager, mockIo);

      handler({
        player1Id: game.players[0].id,
        card1Id: 'lux-1',
        player2Id: game.players[1].id,
        card2Id: 'lux-2'
      }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('not in a room');
        done();
      });
    });
  });

  describe('handleDiscardLuxuryCard', () => {
    beforeEach(() => {
      // Give player some won cards including luxuries
      game.players[0].wonCards.push({ id: 'lux-1', type: CARD_TYPES.LUXURY, value: 5 });
      game.players[0].wonCards.push({ id: 'lux-2', type: CARD_TYPES.LUXURY, value: 3 });
      game.players[0].wonCards.push({ id: 'lux-3', type: CARD_TYPES.LUXURY, value: 7 });
      game.players[0].wonCards.push({ id: 'lux-4', type: CARD_TYPES.LUXURY, value: 2 });
      game.discardingPlayerId = mockSocket.id;
      game.phase = 'discard_luxury';
    });

    test('should discard luxury card successfully', (done) => {
      const handler = handleDiscardLuxuryCard(mockSocket, roomManager, mockIo);

      handler({ cardId: 'lux-1' }, (response) => {
        expect(response.success).toBe(true);

        // Should emit luxury_card_discarded event
        const discardEvent = emittedEvents.find(e => e.event === 'luxury_card_discarded');
        expect(discardEvent).toBeTruthy();
        expect(discardEvent.data.cardId).toBe('lux-1');

        done();
      });
    });

    test('should reject empty card ID', (done) => {
      const handler = handleDiscardLuxuryCard(mockSocket, roomManager, mockIo);

      handler({ cardId: '' }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('Invalid card ID');
        done();
      });
    });

    test('should reject non-string card ID', (done) => {
      const handler = handleDiscardLuxuryCard(mockSocket, roomManager, mockIo);

      handler({ cardId: 123 }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toBeTruthy();
        done();
      });
    });

    test('should reject when not in a room', (done) => {
      const newSocket = {
        id: 'socket_999',
        join: jest.fn(),
        leave: jest.fn(),
      emit: jest.fn()
      };

      const handler = handleDiscardLuxuryCard(newSocket, roomManager, mockIo);

      handler({ cardId: 'lux-1' }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('not in a room');
        done();
      });
    });
  });
});
