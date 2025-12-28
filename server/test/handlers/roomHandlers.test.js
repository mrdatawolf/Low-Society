import { jest } from "@jest/globals";
/**
 * Tests for Room Handlers
 */

import {
  handleCreateRoom,
  handleJoinRoom,
  handleLeaveRoom,
  handleDisconnect
} from '../../src/handlers/roomHandlers.js';
import { roomManager } from '../../src/services/roomManager.js';
import { GAME_PHASES } from '../../src/models/game.js';

describe('Room Handlers', () => {
  let mockSocket;
  let mockIo;
  let emittedEvents;

  beforeEach(() => {
    // Clear all rooms before each test
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
  });

  describe('handleCreateRoom', () => {
    test('should create room with valid player name', (done) => {
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);

      handler({ playerName: 'Alice', aiEnabled: false }, (response) => {
        expect(response.success).toBe(true);
        expect(response.roomCode).toBeTruthy();
        expect(response.roomCode).toHaveLength(4);
        expect(response.publicState).toBeDefined();
        expect(response.privateState).toBeDefined();
        expect(mockSocket.join).toHaveBeenCalledWith(response.roomCode);
        done();
      });
    });

    test('should auto-fill with AI players when aiEnabled is true', (done) => {
      jest.useFakeTimers();
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);

      handler({ playerName: 'Alice', aiEnabled: true }, (response) => {
        expect(response.success).toBe(true);

        // Fast-forward timers to add AI players
        jest.runAllTimers();

        // Should have added 4 AI players (max 5 - 1 human = 4 AI)
        const game = roomManager.getGame(response.roomCode);
        expect(game.players.length).toBe(5);
        expect(game.players.filter(p => p.isAI).length).toBe(4);

        jest.useRealTimers();
        done();
      });
    });

    test('should reject empty player name', (done) => {
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);

      handler({ playerName: '', aiEnabled: false }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toBeTruthy();
        done();
      });
    });

    test('should reject player name that is too long', (done) => {
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);
      const longName = 'A'.repeat(21); // Max is 20

      handler({ playerName: longName, aiEnabled: false }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toBeTruthy();
        done();
      });
    });

    test('should reject player name with invalid characters', (done) => {
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);

      handler({ playerName: 'Alice<script>', aiEnabled: false }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toBeTruthy();
        done();
      });
    });

    test('should trim whitespace from player name', (done) => {
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);

      handler({ playerName: '  Bob  ', aiEnabled: false }, (response) => {
        expect(response.success).toBe(true);
        const game = roomManager.getGame(response.roomCode);
        expect(game.players[0].name).toBe('Bob');
        done();
      });
    });
  });

  describe('handleJoinRoom', () => {
    let existingRoomCode;

    beforeEach((done) => {
      // Create a room first
      const createHandler = handleCreateRoom(mockSocket, roomManager, mockIo);
      createHandler({ playerName: 'Alice', aiEnabled: false }, (response) => {
        existingRoomCode = response.roomCode;
        done();
      });
    });

    test('should join existing room with valid details', (done) => {
      const newSocket = {
        id: 'socket_456',
        join: jest.fn(),
        leave: jest.fn(),
      emit: jest.fn()
      };

      const handler = handleJoinRoom(newSocket, roomManager, mockIo);

      handler({ roomCode: existingRoomCode, playerName: 'Bob' }, (response) => {
        expect(response.success).toBe(true);
        expect(response.roomCode).toBe(existingRoomCode);
        expect(newSocket.join).toHaveBeenCalledWith(existingRoomCode);

        const game = roomManager.getGame(existingRoomCode);
        expect(game.players.length).toBe(2);
        expect(game.players.find(p => p.name === 'Bob')).toBeTruthy();
        done();
      });
    });

    test('should reject invalid room code', (done) => {
      const newSocket = {
        id: 'socket_456',
        join: jest.fn(),
        leave: jest.fn(),
      emit: jest.fn()
      };

      const handler = handleJoinRoom(newSocket, roomManager, mockIo);

      handler({ roomCode: 'INVALID', playerName: 'Bob' }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toBeTruthy();
        done();
      });
    });

    test('should normalize room code to uppercase', (done) => {
      const newSocket = {
        id: 'socket_456',
        join: jest.fn(),
        leave: jest.fn(),
      emit: jest.fn()
      };

      const handler = handleJoinRoom(newSocket, roomManager, mockIo);

      handler({ roomCode: existingRoomCode.toLowerCase(), playerName: 'Bob' }, (response) => {
        expect(response.success).toBe(true);
        expect(response.roomCode).toBe(existingRoomCode);
        done();
      });
    });

    test('should reject joining non-existent room', (done) => {
      const newSocket = {
        id: 'socket_456',
        join: jest.fn(),
        leave: jest.fn(),
      emit: jest.fn()
      };

      const handler = handleJoinRoom(newSocket, roomManager, mockIo);

      handler({ roomCode: 'ZZZZ', playerName: 'Bob' }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('not found');
        done();
      });
    });

    test('should reject empty player name', (done) => {
      const newSocket = {
        id: 'socket_456',
        join: jest.fn(),
        leave: jest.fn(),
      emit: jest.fn()
      };

      const handler = handleJoinRoom(newSocket, roomManager, mockIo);

      handler({ roomCode: existingRoomCode, playerName: '' }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toBeTruthy();
        done();
      });
    });
  });

  describe('handleLeaveRoom', () => {
    let roomCode;

    beforeEach((done) => {
      // Create a room first
      const createHandler = handleCreateRoom(mockSocket, roomManager, mockIo);
      createHandler({ playerName: 'Alice', aiEnabled: false }, (response) => {
        roomCode = response.roomCode;
        done();
      });
    });

    test('should leave room successfully', (done) => {
      const handler = handleLeaveRoom(mockSocket, roomManager, mockIo);

      handler({}, (response) => {
        expect(response.success).toBe(true);
        expect(mockSocket.leave).toHaveBeenCalledWith(roomCode);

        const game = roomManager.getGame(roomCode);
        expect(game).toBeNull(); // Room should be cleaned up if last player left
        done();
      });
    });

    test('should handle leaving when not in a room', (done) => {
      const newSocket = {
        id: 'socket_999',
        join: jest.fn(),
        leave: jest.fn(),
      emit: jest.fn()
      };

      const handler = handleLeaveRoom(newSocket, roomManager, mockIo);

      handler({}, (response) => {
        expect(response.success).toBe(true);
        done();
      });
    });

    test('should notify other players when someone leaves', (done) => {
      // Add a second player first
      const newSocket = {
        id: 'socket_456',
        join: jest.fn(),
        leave: jest.fn(),
      emit: jest.fn()
      };

      const joinHandler = handleJoinRoom(newSocket, roomManager, mockIo);
      joinHandler({ roomCode, playerName: 'Bob' }, () => {
        emittedEvents = []; // Clear previous events

        const leaveHandler = handleLeaveRoom(newSocket, roomManager, mockIo);
        leaveHandler({}, (response) => {
          expect(response.success).toBe(true);

          // Should have emitted player_left event
          const playerLeftEvent = emittedEvents.find(e => e.event === 'player_left');
          expect(playerLeftEvent).toBeTruthy();

          done();
        });
      });
    });
  });

  describe('handleDisconnect', () => {
    let roomCode;

    beforeEach((done) => {
      // Create a room first
      const createHandler = handleCreateRoom(mockSocket, roomManager, mockIo);
      createHandler({ playerName: 'Alice', aiEnabled: false }, (response) => {
        roomCode = response.roomCode;
        done();
      });
    });

    test('should remove player in WAITING phase', () => {
      const handler = handleDisconnect(mockSocket, roomManager, mockIo, GAME_PHASES);

      const game = roomManager.getGame(roomCode);
      expect(game.phase).toBe(GAME_PHASES.WAITING);
      expect(game.players.length).toBe(1);

      handler();

      const gameAfter = roomManager.getGame(roomCode);
      expect(gameAfter).toBeNull(); // Room cleaned up
    });

    test('should keep player in active game', () => {
      const game = roomManager.getGame(roomCode);

      // Add more players and start game
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');
      game.startGame();

      expect(game.phase).not.toBe(GAME_PHASES.WAITING);
      const playerCountBefore = game.players.length;

      const handler = handleDisconnect(mockSocket, roomManager, mockIo, GAME_PHASES);
      handler();

      const gameAfter = roomManager.getGame(roomCode);
      expect(gameAfter).toBeTruthy(); // Room still exists
      expect(gameAfter.players.length).toBe(playerCountBefore); // Players unchanged
    });

    test('should emit player_disconnected for active game', () => {
      const game = roomManager.getGame(roomCode);
      game.addPlayer('p2', 'Bob');
      game.addPlayer('p3', 'Charlie');
      game.startGame();

      emittedEvents = [];

      const handler = handleDisconnect(mockSocket, roomManager, mockIo, GAME_PHASES);
      handler();

      const disconnectEvent = emittedEvents.find(e => e.event === 'player_disconnected');
      expect(disconnectEvent).toBeTruthy();
      expect(disconnectEvent.data.playerId).toBe(mockSocket.id);
    });

    test('should handle disconnect when not in a room', () => {
      const newSocket = {
        id: 'socket_999',
        join: jest.fn(),
        leave: jest.fn(),
      emit: jest.fn()
      };

      const handler = handleDisconnect(newSocket, roomManager, mockIo, GAME_PHASES);

      // Should not throw error
      expect(() => handler()).not.toThrow();
    });
  });
});
