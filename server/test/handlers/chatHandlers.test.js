import { jest } from "@jest/globals";
/**
 * Tests for Chat Handlers
 */

import { handleSetChatMode } from '../../src/handlers/chatHandlers.js';
import { roomManager } from '../../src/services/roomManager.js';
import { CHAT_MODES } from '../../src/shared/constants/chatConfig.js';

describe('Chat Handlers', () => {
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

  describe('handleSetChatMode', () => {
    test('should set chat mode to tutorial when host', (done) => {
      const handler = handleSetChatMode(mockSocket, roomManager, mockIo);

      handler({ mode: CHAT_MODES.TUTORIAL }, (response) => {
        expect(response.success).toBe(true);
        expect(response.mode).toBe(CHAT_MODES.TUTORIAL);
        expect(game.chatMode).toBe(CHAT_MODES.TUTORIAL);

        // Should emit chat_mode_changed event
        const modeChangedEvent = emittedEvents.find(e => e.event === 'chat_mode_changed');
        expect(modeChangedEvent).toBeTruthy();
        expect(modeChangedEvent.data.mode).toBe(CHAT_MODES.TUTORIAL);

        done();
      });
    });

    test('should set chat mode to commentary when host', (done) => {
      const handler = handleSetChatMode(mockSocket, roomManager, mockIo);

      handler({ mode: CHAT_MODES.COMMENTARY }, (response) => {
        expect(response.success).toBe(true);
        expect(response.mode).toBe(CHAT_MODES.COMMENTARY);
        expect(game.chatMode).toBe(CHAT_MODES.COMMENTARY);
        done();
      });
    });

    test('should reject invalid chat mode', (done) => {
      const handler = handleSetChatMode(mockSocket, roomManager, mockIo);

      handler({ mode: 'invalid_mode' }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('Invalid chat mode');
        done();
      });
    });

    test('should reject when not host', (done) => {
      const nonHostSocket = {
        id: 'socket_456',
        join: jest.fn(),
        leave: jest.fn(),
      emit: jest.fn()
      };

      game.addPlayer(nonHostSocket.id, 'Bob');

      const handler = handleSetChatMode(nonHostSocket, roomManager, mockIo);

      handler({ mode: CHAT_MODES.TUTORIAL }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('host');
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

      const handler = handleSetChatMode(newSocket, roomManager, mockIo);

      handler({ mode: CHAT_MODES.TUTORIAL }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('not in a room');
        done();
      });
    });

    test('should broadcast state update after mode change', (done) => {
      const handler = handleSetChatMode(mockSocket, roomManager, mockIo);

      handler({ mode: CHAT_MODES.TUTORIAL }, (response) => {
        expect(response.success).toBe(true);

        // Should emit state_update event
        const stateUpdateEvent = emittedEvents.find(e => e.event === 'state_update');
        expect(stateUpdateEvent).toBeTruthy();
        expect(stateUpdateEvent.data.publicState).toBeDefined();

        done();
      });
    });
  });
});
