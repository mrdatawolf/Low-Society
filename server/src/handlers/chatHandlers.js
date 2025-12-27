/**
 * Chat Handlers
 * Handles chat-related socket events
 */

import { SOCKET_EVENTS } from '../shared/constants/socketEvents.js';
import { CHAT_MODES } from '../shared/constants/chatConfig.js';
import { handleSocketError } from '../utils/errorHandler.js';

/**
 * Handle setting the chat mode for a game
 * @param {Object} socket - Socket.io socket instance
 * @param {Map} roomManager - Room manager instance
 * @param {Object} io - Socket.io server instance
 * @returns {Function} Handler function
 */
export function handleSetChatMode(socket, roomManager, io) {
  return ({ mode }, callback) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);

      if (!roomCode) {
        callback({ success: false, error: 'You are not in a room' });
        return;
      }

      const game = roomManager.getGame(roomCode);

      if (!game) {
        callback({ success: false, error: 'Game not found' });
        return;
      }

      // Validate mode
      if (mode !== CHAT_MODES.TUTORIAL && mode !== CHAT_MODES.COMMENTARY) {
        callback({ success: false, error: 'Invalid chat mode' });
        return;
      }

      // Only host can change chat mode
      if (game.host !== socket.id) {
        callback({ success: false, error: 'Only the host can change chat mode' });
        return;
      }

      // Set the chat mode
      const success = game.setChatMode(mode);

      if (!success) {
        callback({ success: false, error: 'Failed to set chat mode' });
        return;
      }

      // Broadcast mode change to all players
      io.to(roomCode).emit(SOCKET_EVENTS.CHAT_MODE_CHANGED, {
        mode: game.chatMode
      });

      // Send updated public state
      io.to(roomCode).emit(SOCKET_EVENTS.STATE_UPDATE, {
        publicState: game.getPublicState()
      });

      callback({ success: true, mode: game.chatMode });

      console.log(`[Chat] Room ${roomCode} chat mode changed to ${mode}`);

    } catch (error) {
      handleSocketError(error, callback, socket, { event: 'set_chat_mode' });
    }
  };
}
