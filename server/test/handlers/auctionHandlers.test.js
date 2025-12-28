import { jest } from "@jest/globals";
/**
 * Tests for Auction Handlers
 */

import { handlePlaceBid, handlePass } from '../../src/handlers/auctionHandlers.js';
import { roomManager } from '../../src/services/roomManager.js';

describe('Auction Handlers', () => {
  let mockSocket;
  let mockIo;
  let emittedEvents;
  let roomCode;
  let game;

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

    // Create a game and room
    const result = roomManager.createRoom(mockSocket.id, 'Alice');
    roomCode = result.roomCode;
    game = result.game;

    // Add more players and start game
    game.addPlayer('p2', 'Bob');
    game.addPlayer('p3', 'Charlie');
    game.startGame();
  });

  describe('handlePlaceBid', () => {
    test('should place valid bid', (done) => {
      const handler = handlePlaceBid(mockSocket, roomManager, mockIo);
      const p1Money = game.players[0].moneyHand;

      handler({ moneyCardIds: [p1Money[0].id] }, (response) => {
        expect(response.success).toBe(true);
        expect(response.bidTotal).toBeGreaterThan(0);

        // Should emit bid_placed event
        const bidEvent = emittedEvents.find(e => e.event === 'bid_placed');
        expect(bidEvent).toBeTruthy();
        expect(bidEvent.data.bidTotal).toBe(response.bidTotal);

        done();
      });
    });

    test('should reject bid with empty array', (done) => {
      const handler = handlePlaceBid(mockSocket, roomManager, mockIo);

      handler({ moneyCardIds: [] }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('at least one');
        done();
      });
    });

    test('should reject bid with non-array input', (done) => {
      const handler = handlePlaceBid(mockSocket, roomManager, mockIo);

      handler({ moneyCardIds: 'not-an-array' }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('must be an array');
        done();
      });
    });

    test('should reject bid with invalid card ID', (done) => {
      const handler = handlePlaceBid(mockSocket, roomManager, mockIo);

      handler({ moneyCardIds: [''] }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toBeTruthy();
        done();
      });
    });

    test('should reject bid with too many cards', (done) => {
      const handler = handlePlaceBid(mockSocket, roomManager, mockIo);
      const p1Money = game.players[0].moneyHand;
      const tooManyCards = p1Money.map(c => c.id); // All 11 cards

      handler({ moneyCardIds: tooManyCards }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('Cannot bid more than');
        done();
      });
    });

    test('should reject bid when not in a room', (done) => {
      const newSocket = {
        id: 'socket_999',
        join: jest.fn(),
        leave: jest.fn(),
      emit: jest.fn()
      };

      const handler = handlePlaceBid(newSocket, roomManager, mockIo);

      handler({ moneyCardIds: ['money-1'] }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('not in a room');
        done();
      });
    });

    test('should update private state after bid', (done) => {
      const handler = handlePlaceBid(mockSocket, roomManager, mockIo);
      const p1Money = game.players[0].moneyHand;

      handler({ moneyCardIds: [p1Money[0].id] }, (response) => {
        expect(response.success).toBe(true);

        // Should emit private_state_update
        const privateStateEvent = emittedEvents.find(e => e.event === 'private_state_update');
        expect(privateStateEvent).toBeTruthy();
        expect(privateStateEvent.data.privateState).toBeDefined();

        done();
      });
    });

    test('should allow multiple cards in bid', (done) => {
      const handler = handlePlaceBid(mockSocket, roomManager, mockIo);
      const p1Money = game.players[0].moneyHand;

      handler({ moneyCardIds: [p1Money[0].id, p1Money[1].id] }, (response) => {
        expect(response.success).toBe(true);
        expect(response.bidTotal).toBe(p1Money[0].value + p1Money[1].value);
        done();
      });
    });
  });

  describe('handlePass', () => {
    test('should pass successfully', (done) => {
      const handler = handlePass(mockSocket, roomManager, mockIo);

      handler({}, (response) => {
        expect(response.success).toBe(true);

        // Should emit player_passed event
        const passEvent = emittedEvents.find(e => e.event === 'player_passed');
        expect(passEvent).toBeTruthy();
        expect(passEvent.data.playerId).toBe(mockSocket.id);

        done();
      });
    });

    test('should reject pass when not in a room', (done) => {
      const newSocket = {
        id: 'socket_999',
        join: jest.fn(),
        leave: jest.fn(),
      emit: jest.fn()
      };

      const handler = handlePass(newSocket, roomManager, mockIo);

      handler({}, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('not in a room');
        done();
      });
    });

    test('should update all player private states after pass', (done) => {
      const handler = handlePass(mockSocket, roomManager, mockIo);

      handler({}, (response) => {
        expect(response.success).toBe(true);

        // Should emit private_state_update for all players
        const privateStateEvents = emittedEvents.filter(e => e.event === 'private_state_update');
        expect(privateStateEvents.length).toBeGreaterThan(0);

        done();
      });
    });

    test('should mark player as passed', (done) => {
      const handler = handlePass(mockSocket, roomManager, mockIo);

      handler({}, (response) => {
        expect(response.success).toBe(true);

        const player = game.players.find(p => p.id === mockSocket.id);
        expect(player.hasPassed).toBe(true);

        done();
      });
    });

    test('should reject double pass', (done) => {
      const handler = handlePass(mockSocket, roomManager, mockIo);

      handler({}, (firstResponse) => {
        expect(firstResponse.success).toBe(true);

        // Try to pass again
        handler({}, (secondResponse) => {
          expect(secondResponse.success).toBe(false);
          expect(secondResponse.error).toContain('already passed');
          done();
        });
      });
    });
  });
});
