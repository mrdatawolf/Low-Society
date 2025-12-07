/**
 * Integration tests for room handlers
 * Tests room creation, joining, leaving, and disconnection
 */

import { handleCreateRoom, handleJoinRoom, handleLeaveRoom } from '../../src/handlers/roomHandlers.js';
import { roomManager } from '../../src/services/roomManager.js';

describe('Room Handlers', () => {
  let mockSocket;
  let mockIo;
  let emittedEvents;

  beforeEach(() => {
    // Clear room manager state
    roomManager.rooms.clear();
    roomManager.playerRooms.clear();

    // Track emitted events
    emittedEvents = [];

    // Create mock socket
    mockSocket = {
      id: 'test-player-1',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn((event, data) => {
        emittedEvents.push({ event, data, to: 'socket' });
      })
    };

    // Create mock io with to() chaining
    mockIo = {
      to: jest.fn((room) => ({
        emit: jest.fn((event, data) => {
          emittedEvents.push({ event, data, to: room });
        })
      }))
    };
  });

  afterEach(() => {
    // Clean up
    roomManager.rooms.clear();
    roomManager.playerRooms.clear();
  });

  describe('handleCreateRoom', () => {
    test('should create room with valid player name', (done) => {
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);

      handler({ playerName: 'Alice', aiEnabled: false }, (response) => {
        expect(response.success).toBe(true);
        expect(response.roomCode).toBeDefined();
        expect(response.roomCode).toHaveLength(4);
        expect(response.publicState).toBeDefined();
        expect(response.privateState).toBeDefined();

        // Verify room was created
        const game = roomManager.getGame(response.roomCode);
        expect(game).toBeDefined();
        expect(game.players).toHaveLength(1);
        expect(game.players[0].name).toBe('Alice');

        // Verify socket joined room
        expect(mockSocket.join).toHaveBeenCalledWith(response.roomCode);

        done();
      });
    });

    test('should create room with AI players when aiEnabled is true', (done) => {
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);

      handler({ playerName: 'Bob', aiEnabled: true }, (response) => {
        expect(response.success).toBe(true);

        // AI players are added with setTimeout, so we need to wait
        setTimeout(() => {
          const game = roomManager.getGame(response.roomCode);
          // Should have 1 human + 4 AI players = 5 total
          expect(game.players.length).toBe(5);

          // Check that AI players were added
          const aiPlayers = game.players.filter(p => p.isAI);
          expect(aiPlayers).toHaveLength(4);

          done();
        }, 1500); // Wait for all AI players to be added (4 * 250ms + buffer)
      });
    }, 3000);

    test('should reject empty player name', (done) => {
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);

      handler({ playerName: '', aiEnabled: false }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('name');
        done();
      });
    });

    test('should reject player name with only whitespace', (done) => {
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);

      handler({ playerName: '   ', aiEnabled: false }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('empty');
        done();
      });
    });

    test('should reject player name that is too long', (done) => {
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);
      const longName = 'A'.repeat(21);

      handler({ playerName: longName, aiEnabled: false }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('too long');
        done();
      });
    });

    test('should reject player name with invalid characters', (done) => {
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);

      handler({ playerName: 'Alice@#$', aiEnabled: false }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('invalid characters');
        done();
      });
    });

    test('should trim whitespace from player name', (done) => {
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);

      handler({ playerName: '  Alice  ', aiEnabled: false }, (response) => {
        expect(response.success).toBe(true);

        const game = roomManager.getGame(response.roomCode);
        expect(game.players[0].name).toBe('Alice');

        done();
      });
    });

    test('should default aiEnabled to true if not provided', (done) => {
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);

      handler({ playerName: 'Charlie' }, (response) => {
        expect(response.success).toBe(true);

        // Should add AI players
        setTimeout(() => {
          const game = roomManager.getGame(response.roomCode);
          expect(game.players.length).toBeGreaterThan(1);
          done();
        }, 1500);
      }, 3000);
    });
  });

  describe('handleJoinRoom', () => {
    let existingRoomCode;

    beforeEach((done) => {
      // Create a room first
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);
      handler({ playerName: 'Host', aiEnabled: false }, (response) => {
        existingRoomCode = response.roomCode;
        done();
      });
    });

    test('should join existing room with valid credentials', (done) => {
      const newSocket = { ...mockSocket, id: 'test-player-2' };
      const handler = handleJoinRoom(newSocket, roomManager, mockIo);

      handler(
        { roomCode: existingRoomCode, playerName: 'Joiner' },
        (response) => {
          expect(response.success).toBe(true);
          expect(response.roomCode).toBe(existingRoomCode);

          const game = roomManager.getGame(existingRoomCode);
          expect(game.players).toHaveLength(2);
          expect(game.players[1].name).toBe('Joiner');

          done();
        }
      );
    });

    test('should reject non-existent room code', (done) => {
      const newSocket = { ...mockSocket, id: 'test-player-2' };
      const handler = handleJoinRoom(newSocket, roomManager, mockIo);

      handler({ roomCode: 'FAKE', playerName: 'Joiner' }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('not found');
        done();
      });
    });

    test('should reject invalid room code format', (done) => {
      const newSocket = { ...mockSocket, id: 'test-player-2' };
      const handler = handleJoinRoom(newSocket, roomManager, mockIo);

      handler({ roomCode: '12', playerName: 'Joiner' }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('4 characters');
        done();
      });
    });

    test('should sanitize room code to uppercase', (done) => {
      const newSocket = { ...mockSocket, id: 'test-player-2' };
      const handler = handleJoinRoom(newSocket, roomManager, mockIo);

      handler(
        { roomCode: existingRoomCode.toLowerCase(), playerName: 'Joiner' },
        (response) => {
          expect(response.success).toBe(true);
          expect(response.roomCode).toBe(existingRoomCode);
          done();
        }
      );
    });

    test('should broadcast state_update when player joins', (done) => {
      const newSocket = { ...mockSocket, id: 'test-player-2' };
      const handler = handleJoinRoom(newSocket, roomManager, mockIo);

      handler(
        { roomCode: existingRoomCode, playerName: 'Joiner' },
        (response) => {
          expect(response.success).toBe(true);

          // Check that state_update was emitted to room
          const stateUpdates = emittedEvents.filter(
            e => e.event === 'state_update' && e.to === existingRoomCode
          );
          expect(stateUpdates.length).toBeGreaterThan(0);

          done();
        }
      );
    });
  });

  describe('handleLeaveRoom', () => {
    let roomCode;

    beforeEach((done) => {
      // Create a room with two players
      const handler1 = handleCreateRoom(mockSocket, roomManager, mockIo);
      handler1({ playerName: 'Player1', aiEnabled: false }, (response) => {
        roomCode = response.roomCode;

        const newSocket = { ...mockSocket, id: 'test-player-2' };
        const handler2 = handleJoinRoom(newSocket, roomManager, mockIo);
        handler2({ roomCode, playerName: 'Player2' }, () => {
          // Reset emitted events after setup
          emittedEvents = [];
          done();
        });
      });
    });

    test('should remove player from room', (done) => {
      const handler = handleLeaveRoom(mockSocket, roomManager, mockIo);

      handler({}, (response) => {
        expect(response.success).toBe(true);

        const game = roomManager.getGame(roomCode);
        expect(game.players).toHaveLength(1);
        expect(game.players[0].id).toBe('test-player-2');

        done();
      });
    });

    test('should broadcast player_left event', (done) => {
      const handler = handleLeaveRoom(mockSocket, roomManager, mockIo);

      handler({}, (response) => {
        expect(response.success).toBe(true);

        const playerLeftEvents = emittedEvents.filter(
          e => e.event === 'player_left'
        );
        expect(playerLeftEvents.length).toBeGreaterThan(0);

        done();
      });
    });

    test('should delete room when last player leaves', (done) => {
      // First player leaves
      const handler1 = handleLeaveRoom(mockSocket, roomManager, mockIo);
      handler1({}, () => {
        // Second player leaves
        const newSocket = { ...mockSocket, id: 'test-player-2' };
        const handler2 = handleLeaveRoom(newSocket, roomManager, mockIo);
        handler2({}, (response) => {
          expect(response.success).toBe(true);

          // Room should be deleted
          const game = roomManager.getGame(roomCode);
          expect(game).toBeUndefined();

          done();
        });
      });
    });

    test('should handle leaving when not in a room', (done) => {
      const notInRoomSocket = { ...mockSocket, id: 'not-in-room' };
      const handler = handleLeaveRoom(notInRoomSocket, roomManager, mockIo);

      handler({}, (response) => {
        expect(response.success).toBe(true);
        done();
      });
    });
  });
});
