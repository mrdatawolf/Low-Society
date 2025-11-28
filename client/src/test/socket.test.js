import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { io } from 'socket.io-client';
import { createMockSocket } from './mocks/socket';

// Mock socket.io-client
vi.mock('socket.io-client');

// Import after mocking
import { SocketService } from '../services/socket';

describe('SocketService', () => {
  let socketService;
  let mockSocket;

  beforeEach(() => {
    mockSocket = createMockSocket();
    io.mockReturnValue(mockSocket);
    socketService = new SocketService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Connection', () => {
    it('should connect to server with default URL', () => {
      socketService.connect();

      expect(io).toHaveBeenCalledWith('http://localhost:3003', expect.objectContaining({
        autoConnect: true,
        reconnection: true
      }));
    });

    it('should connect to server with custom URL', () => {
      socketService.connect('http://example.com:3000');

      expect(io).toHaveBeenCalledWith('http://example.com:3000', expect.any(Object));
    });

    it('should not reconnect if already connected', () => {
      socketService.connect();
      socketService.connect();

      expect(io).toHaveBeenCalledTimes(1);
    });

    it('should disconnect from server', () => {
      socketService.connect();
      socketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(socketService.socket).toBeNull();
    });

    it('should check if connected', () => {
      expect(socketService.isConnected()).toBe(false);

      socketService.connect();
      expect(socketService.isConnected()).toBe(true);
    });

    it('should get socket ID', () => {
      socketService.connect();
      expect(socketService.getSocketId()).toBe('mock-socket-id');
    });
  });

  describe('Event Listeners', () => {
    beforeEach(() => {
      socketService.connect();
    });

    it('should register event listener', () => {
      const callback = vi.fn();
      socketService.on('test_event', callback);

      expect(mockSocket.on).toHaveBeenCalledWith('test_event', callback);
    });

    it('should remove event listener', () => {
      const callback = vi.fn();
      socketService.on('test_event', callback);
      socketService.off('test_event', callback);

      expect(mockSocket.off).toHaveBeenCalledWith('test_event', callback);
    });

    it('should remove all listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      socketService.on('event1', callback1);
      socketService.on('event2', callback2);
      socketService.removeAllListeners();

      expect(mockSocket.off).toHaveBeenCalledWith('event1', callback1);
      expect(mockSocket.off).toHaveBeenCalledWith('event2', callback2);
    });
  });

  describe('Emit with Promises', () => {
    beforeEach(() => {
      socketService.connect();
    });

    it('should emit event and resolve promise on success', async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        callback({ success: true, data: 'test' });
      });

      const result = await socketService.emit('test_event', { foo: 'bar' });

      expect(mockSocket.emit).toHaveBeenCalledWith('test_event', { foo: 'bar' }, expect.any(Function));
      expect(result).toEqual({ success: true, data: 'test' });
    });

    it('should reject promise on error', async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        callback({ success: false, error: 'Test error' });
      });

      await expect(socketService.emit('test_event', {})).rejects.toThrow('Test error');
    });

    it('should reject if socket not connected', async () => {
      socketService.disconnect();

      await expect(socketService.emit('test_event', {})).rejects.toThrow('Socket not connected');
    });
  });

  describe('Game Methods', () => {
    beforeEach(() => {
      socketService.connect();
      mockSocket.emit.mockImplementation((event, data, callback) => {
        callback({ success: true });
      });
    });

    it('should create room', async () => {
      await socketService.createRoom('Alice');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'create_room',
        { playerName: 'Alice' },
        expect.any(Function)
      );
    });

    it('should join room', async () => {
      await socketService.joinRoom('ABC1', 'Bob');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'join_room',
        { roomCode: 'ABC1', playerName: 'Bob' },
        expect.any(Function)
      );
    });

    it('should start game', async () => {
      await socketService.startGame();

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'start_game',
        {},
        expect.any(Function)
      );
    });

    it('should place bid', async () => {
      await socketService.placeBid(['money-1', 'money-2']);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'place_bid',
        { moneyCardIds: ['money-1', 'money-2'] },
        expect.any(Function)
      );
    });

    it('should pass', async () => {
      await socketService.pass();

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'pass',
        {},
        expect.any(Function)
      );
    });

    it('should execute card swap', async () => {
      await socketService.executeCardSwap('p1', 'card1', 'p2', 'card2');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'execute_card_swap',
        { player1Id: 'p1', card1Id: 'card1', player2Id: 'p2', card2Id: 'card2' },
        expect.any(Function)
      );
    });

    it('should get state', async () => {
      await socketService.getState();

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'get_state',
        {},
        expect.any(Function)
      );
    });

    it('should leave room', async () => {
      await socketService.leaveRoom();

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'leave_room',
        {},
        expect.any(Function)
      );
    });
  });
});
