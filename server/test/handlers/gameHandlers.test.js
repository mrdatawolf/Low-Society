import { jest } from "@jest/globals";
/**
 * Tests for Game Handlers
 */

import { handleStartGame, handleGetState } from '../../src/handlers/gameHandlers.js';
import { roomManager } from '../../src/services/roomManager.js';
import { GAME_PHASES } from '../../src/models/game.js';

describe('Game Handlers', () => {
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
  });

  describe('handleStartGame', () => {
    test('should start game when host with enough players', (done) => {
      // Add more players
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');

      const handler = handleStartGame(mockSocket, roomManager, mockIo);

      handler({ aiEnabled: false }, (response) => {
        expect(response.success).toBe(true);
        expect(game.phase).not.toBe(GAME_PHASES.WAITING);

        // Should emit game_started event
        const gameStartedEvent = emittedEvents.find(e => e.event === 'game_started');
        expect(gameStartedEvent).toBeTruthy();

        done();
      });
    });

    test('should reject start game when not host', (done) => {
      const nonHostSocket = {
        id: 'socket_456',
        join: jest.fn(),
        leave: jest.fn(),
      emit: jest.fn()
      };

      game.addPlayer(nonHostSocket.id, 'Bob');

      const handler = handleStartGame(nonHostSocket, roomManager, mockIo);

      handler({ aiEnabled: false }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('host');
        done();
      });
    });

    test('should reject start game with too few players when AI disabled', (done) => {
      // Only 1 player (host), need minimum 3
      const handler = handleStartGame(mockSocket, roomManager, mockIo);

      handler({ aiEnabled: false }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('Not enough players');
        done();
      });
    });

    test('should auto-fill with AI players when AI enabled', (done) => {
      const handler = handleStartGame(mockSocket, roomManager, mockIo);

      handler({ aiEnabled: true }, (response) => {
        expect(response.success).toBe(true);

        // Should have max players (5)
        expect(game.players.length).toBe(5);

        // Should have 4 AI players
        const aiPlayers = game.players.filter(p => p.isAI);
        expect(aiPlayers.length).toBe(4);

        done();
      });
    });

    test('should support spectator mode with all AI players', (done) => {
      // Add a second human player
      game.addPlayer('p2', 'Bob');

      const handler = handleStartGame(mockSocket, roomManager, mockIo);

      handler({ spectatorMode: true }, (response) => {
        expect(response.success).toBe(true);

        // Should have max players (5)
        expect(game.players.length).toBe(5);

        // All should be AI
        const aiPlayers = game.players.filter(p => p.isAI);
        expect(aiPlayers.length).toBe(5);

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

      const handler = handleStartGame(newSocket, roomManager, mockIo);

      handler({ aiEnabled: false }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('not in a room');
        done();
      });
    });

    test('should send private states to all players', (done) => {
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');

      const handler = handleStartGame(mockSocket, roomManager, mockIo);

      handler({ aiEnabled: false }, (response) => {
        expect(response.success).toBe(true);

        // Should emit private_state_update for each player
        const privateStateEvents = emittedEvents.filter(e => e.event === 'private_state_update');
        expect(privateStateEvents.length).toBeGreaterThan(0);

        done();
      });
    });

    test('should default aiEnabled to true', (done) => {
      const handler = handleStartGame(mockSocket, roomManager, mockIo);

      handler({}, (response) => {
        expect(response.success).toBe(true);

        // Should have auto-filled with AI
        expect(game.players.length).toBe(5);

        done();
      });
    });
  });

  describe('handleGetState', () => {
    test('should return game state when in a room', (done) => {
      const handler = handleGetState(mockSocket, roomManager);

      handler({}, (response) => {
        expect(response.success).toBe(true);
        expect(response.publicState).toBeDefined();
        expect(response.privateState).toBeDefined();
        expect(response.publicState.roomCode).toBe(roomCode);
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

      const handler = handleGetState(newSocket, roomManager);

      handler({}, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('not in a room');
        done();
      });
    });

    test('should return player-specific private state', (done) => {
      game.addPlayer('p2', 'Bob');

      const handler = handleGetState(mockSocket, roomManager);

      handler({}, (response) => {
        expect(response.success).toBe(true);
        expect(response.privateState).toBeDefined();
        expect(response.privateState.moneyHand).toBeDefined();
        done();
      });
    });
  });
});
