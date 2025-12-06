import { roomManager } from '../src/services/roomManager.js';
import { GAME_PHASES } from '../src/models/game.js';

describe('RoomManager', () => {
  beforeEach(() => {
    // Clear all rooms before each test
    roomManager.rooms.clear();
    roomManager.playerRooms.clear();
  });

  describe('Room Creation', () => {
    test('should create a room successfully', () => {
      const { roomCode, game } = roomManager.createRoom('player1', 'Alice');

      expect(roomCode).toBeDefined();
      expect(roomCode).toHaveLength(4);
      expect(game).toBeDefined();
      expect(game.players).toHaveLength(1);
      expect(game.host).toBe('player1');
    });

    test('should generate unique room codes', () => {
      const { roomCode: code1 } = roomManager.createRoom('player1', 'Alice');
      const { roomCode: code2 } = roomManager.createRoom('player2', 'Bob');

      expect(code1).not.toBe(code2);
    });

    test('should use uppercase letters and numbers only', () => {
      const { roomCode } = roomManager.createRoom('player1', 'Alice');
      expect(roomCode).toMatch(/^[A-Z2-9]{4}$/);
    });

    test('should track player in room', () => {
      const { roomCode } = roomManager.createRoom('player1', 'Alice');
      expect(roomManager.getPlayerRoom('player1')).toBe(roomCode);
    });
  });

  describe('Joining Rooms', () => {
    test('should join existing room', () => {
      const { roomCode } = roomManager.createRoom('player1', 'Alice');
      const { game, roundWasReset } = roomManager.joinRoom(roomCode, 'player2', 'Bob');

      expect(game.players).toHaveLength(2);
      expect(roundWasReset).toBe(false);
      expect(roomManager.getPlayerRoom('player2')).toBe(roomCode);
    });

    test('should be case insensitive', () => {
      const { roomCode } = roomManager.createRoom('player1', 'Alice');
      const { game, roundWasReset } = roomManager.joinRoom(roomCode.toLowerCase(), 'player2', 'Bob');

      expect(game).toBeDefined();
      expect(game.players).toHaveLength(2);
      expect(roundWasReset).toBe(false);
    });

    test('should throw error for non-existent room', () => {
      expect(() => {
        roomManager.joinRoom('XXXX', 'player1', 'Alice');
      }).toThrow('Room not found');
    });

    test('should prevent player from joining if already in room', () => {
      const { roomCode } = roomManager.createRoom('player1', 'Alice');

      expect(() => {
        roomManager.joinRoom(roomCode, 'player1', 'Alice');
      }).toThrow('already in a room');
    });

    test('should enforce max 5 players', () => {
      const { roomCode } = roomManager.createRoom('p1', 'Alice');
      roomManager.joinRoom(roomCode, 'p2', 'Bob');
      roomManager.joinRoom(roomCode, 'p3', 'Charlie');
      roomManager.joinRoom(roomCode, 'p4', 'Dave');
      roomManager.joinRoom(roomCode, 'p5', 'Eve');

      expect(() => {
        roomManager.joinRoom(roomCode, 'p6', 'Frank');
      }).toThrow('Room is full');
    });

    test('should prevent joining game in progress', () => {
      const { roomCode, game } = roomManager.createRoom('p1', 'Alice');
      roomManager.joinRoom(roomCode, 'p2', 'Bob');
      roomManager.joinRoom(roomCode, 'p3', 'Charlie');

      game.startGame();

      expect(() => {
        roomManager.joinRoom(roomCode, 'p4', 'Dave');
      }).toThrow('Game already in progress');
    });
  });

  describe('Leaving Rooms', () => {
    test('should leave room successfully', () => {
      const { roomCode } = roomManager.createRoom('player1', 'Alice');
      roomManager.joinRoom(roomCode, 'player2', 'Bob');

      const result = roomManager.leaveRoom('player2');

      expect(result).toBeDefined();
      expect(result.game.players).toHaveLength(1);
      expect(roomManager.getPlayerRoom('player2')).toBeUndefined();
    });

    test('should reassign host when host leaves', () => {
      const { roomCode } = roomManager.createRoom('player1', 'Alice');
      roomManager.joinRoom(roomCode, 'player2', 'Bob');

      roomManager.leaveRoom('player1');

      const game = roomManager.getGame(roomCode);
      expect(game.host).toBe('player2');
    });

    test('should delete room when last player leaves', () => {
      const { roomCode } = roomManager.createRoom('player1', 'Alice');

      roomManager.leaveRoom('player1');

      expect(roomManager.getGame(roomCode)).toBeUndefined();
    });

    test('should return null when player not in room', () => {
      const result = roomManager.leaveRoom('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('Getting Game', () => {
    test('should get game by room code', () => {
      const { roomCode, game } = roomManager.createRoom('player1', 'Alice');
      const retrieved = roomManager.getGame(roomCode);

      expect(retrieved).toBe(game);
    });

    test('should be case insensitive', () => {
      const { roomCode, game } = roomManager.createRoom('player1', 'Alice');
      const retrieved = roomManager.getGame(roomCode.toLowerCase());

      expect(retrieved).toBe(game);
    });

    test('should return undefined for non-existent room', () => {
      const game = roomManager.getGame('XXXX');
      expect(game).toBeUndefined();
    });
  });

  describe('Player Room Tracking', () => {
    test('should track which room a player is in', () => {
      const { roomCode } = roomManager.createRoom('player1', 'Alice');
      expect(roomManager.getPlayerRoom('player1')).toBe(roomCode);
    });

    test('should return undefined for player not in room', () => {
      expect(roomManager.getPlayerRoom('nonexistent')).toBeUndefined();
    });

    test('should check if player is in room', () => {
      roomManager.createRoom('player1', 'Alice');
      expect(roomManager.isPlayerInRoom('player1')).toBe(true);
      expect(roomManager.isPlayerInRoom('player2')).toBe(false);
    });
  });

  describe('Get All Rooms', () => {
    test('should return empty array when no rooms', () => {
      const rooms = roomManager.getAllRooms();
      expect(rooms).toEqual([]);
    });

    test('should return all active rooms', () => {
      roomManager.createRoom('p1', 'Alice');
      roomManager.createRoom('p2', 'Bob');

      const rooms = roomManager.getAllRooms();
      expect(rooms).toHaveLength(2);
    });

    test('should return room info', () => {
      const { roomCode } = roomManager.createRoom('p1', 'Alice');

      const rooms = roomManager.getAllRooms();
      const room = rooms[0];

      expect(room.roomCode).toBe(roomCode);
      expect(room.playerCount).toBe(1);
      expect(room.phase).toBe(GAME_PHASES.WAITING);
      expect(room.host).toBe('p1');
    });
  });

  describe('Cleanup Stale Rooms', () => {
    test('should remove rooms older than 4 hours', () => {
      const { roomCode, game } = roomManager.createRoom('player1', 'Alice');

      // Set creation time to 5 hours ago
      game.createdAt = Date.now() - (5 * 60 * 60 * 1000);

      roomManager.cleanupStaleRooms();

      expect(roomManager.getGame(roomCode)).toBeUndefined();
      expect(roomManager.getPlayerRoom('player1')).toBeUndefined();
    });

    test('should keep recent rooms', () => {
      const { roomCode } = roomManager.createRoom('player1', 'Alice');

      roomManager.cleanupStaleRooms();

      expect(roomManager.getGame(roomCode)).toBeDefined();
    });
  });
});
