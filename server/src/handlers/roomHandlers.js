/**
 * Room Management Handlers
 * Handles room creation, joining, and leaving
 */

import { GAME_CONFIG } from '../shared/constants/gameConfig.js';
import { SOCKET_EVENTS } from '../shared/constants/socketEvents.js';
import { handleSocketError, errors } from '../utils/errorHandler.js';
import { createAIPlayer } from '../ai/AIPlayer.js';
import { registerAIPlayer, removeAIPlayer } from '../ai/aiHandler.js';

/**
 * Sanitize and validate player name
 */
function sanitizePlayerName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Player name is required');
  }

  const trimmed = name.trim();

  if (trimmed.length < GAME_CONFIG.validation.playerNameMinLength) {
    throw new Error('Player name cannot be empty');
  }

  if (trimmed.length > GAME_CONFIG.validation.playerNameMaxLength) {
    throw new Error(`Player name too long (max ${GAME_CONFIG.validation.playerNameMaxLength} characters)`);
  }

  if (!GAME_CONFIG.validation.playerNamePattern.test(trimmed)) {
    throw new Error('Player name contains invalid characters (only letters, numbers, spaces, _, - allowed)');
  }

  return trimmed;
}

/**
 * Sanitize and validate room code
 */
function sanitizeRoomCode(code) {
  if (!code || typeof code !== 'string') {
    throw new Error('Room code is required');
  }

  const trimmed = code.trim().toUpperCase();

  if (trimmed.length !== GAME_CONFIG.room.codeLength) {
    throw new Error(`Room code must be ${GAME_CONFIG.room.codeLength} characters`);
  }

  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    throw new Error('Room code must be alphanumeric');
  }

  return trimmed;
}

/**
 * Handler for creating a new room
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} roomManager - Room manager instance
 * @param {Object} io - Socket.io server instance
 */
export function handleCreateRoom(socket, roomManager, io) {
  return ({ playerName, aiEnabled }, callback) => {
    try {
      const sanitizedName = sanitizePlayerName(playerName);
      const { roomCode, game } = roomManager.createRoom(socket.id, sanitizedName);

      // Join socket room
      socket.join(roomCode);

      // Send initial response
      callback({
        success: true,
        roomCode,
        publicState: game.getPublicState(),
        privateState: game.getPrivateState(socket.id)
      });

      // Auto-fill with AI players if enabled (default true)
      const shouldFillAI = aiEnabled !== undefined ? aiEnabled : true;
      if (shouldFillAI) {
        const currentPlayerCount = game.players.length;
        const aiPlayersNeeded = GAME_CONFIG.players.max - currentPlayerCount;

        if (aiPlayersNeeded > 0) {
          console.log(`[AI] Auto-filling room ${roomCode} with ${aiPlayersNeeded} AI players`);

          // Add AI players with staggered delays
          for (let i = 0; i < aiPlayersNeeded; i++) {
            setTimeout(() => {
              const aiPlayer = createAIPlayer(i);
              game.addPlayer(aiPlayer.id, aiPlayer.name, true);
              registerAIPlayer(roomCode, aiPlayer);
              console.log(`[AI] Added ${aiPlayer.name} to room ${roomCode}`);

              // Broadcast updated state to all players in room
              io.to(roomCode).emit(SOCKET_EVENTS.STATE_UPDATE, {
                publicState: game.getPublicState()
              });
            }, i * GAME_CONFIG.ai.playerAddDelay);
          }
        }
      }
    } catch (error) {
      handleSocketError(error, callback, socket, { event: 'create_room', playerName });
    }
  };
}

/**
 * Handler for joining an existing room
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} roomManager - Room manager instance
 * @param {Object} io - Socket.io server instance
 */
export function handleJoinRoom(socket, roomManager, io) {
  return ({ roomCode, playerName }, callback) => {
    try {
      const sanitizedCode = sanitizeRoomCode(roomCode);
      const sanitizedName = sanitizePlayerName(playerName);
      const { game, roundWasReset, removedAIPlayer } = roomManager.joinRoom(sanitizedCode, socket.id, sanitizedName);

      // If an AI player was removed to make room, clean up AI reference
      if (removedAIPlayer) {
        removeAIPlayer(sanitizedCode, removedAIPlayer);
      }

      // Join socket room
      socket.join(sanitizedCode);

      // If round was reset due to rejoin, emit round_reset event
      if (roundWasReset) {
        io.to(sanitizedCode).emit('round_reset', {
          playerName: sanitizedName
        });
      }

      // Broadcast updated state to ALL players
      // This ensures everyone has the updated player IDs and restarted auction if applicable
      io.to(sanitizedCode).emit('state_update', {
        publicState: game.getPublicState()
      });

      // Send private state updates to all players (bids were cleared if auction restarted)
      game.players.forEach(player => {
        io.to(player.id).emit('private_state_update', {
          privateState: game.getPrivateState(player.id)
        });
      });

      callback({
        success: true,
        roomCode: sanitizedCode,
        publicState: game.getPublicState(),
        privateState: game.getPrivateState(socket.id)
      });
    } catch (error) {
      handleSocketError(error, callback, socket, { event: 'join_room', roomCode, playerName });
    }
  };
}

/**
 * Handler for leaving a room
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} roomManager - Room manager instance
 * @param {Object} io - Socket.io server instance
 */
export function handleLeaveRoom(socket, roomManager, io) {
  return (data, callback) => {
    const result = roomManager.leaveRoom(socket.id);

    if (result) {
      const { roomCode, game } = result;

      // Leave socket room
      socket.leave(roomCode);

      // Notify remaining players
      io.to(roomCode).emit('player_left', {
        publicState: game.getPublicState()
      });

      callback({ success: true });
    } else {
      callback({ success: true });
    }
  };
}

/**
 * Handler for disconnection
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} roomManager - Room manager instance
 * @param {Object} io - Socket.io server instance
 * @param {string} GAME_PHASES - Game phases constant
 */
export function handleDisconnect(socket, roomManager, io, GAME_PHASES) {
  return () => {
    console.log(`Client disconnected: ${socket.id}`);

    const roomCode = roomManager.getPlayerRoom(socket.id);
    if (!roomCode) return;

    const game = roomManager.getGame(roomCode);
    if (!game) return;

    // Only remove player if game hasn't started (still in waiting phase)
    // Otherwise, keep player in game so they can rejoin
    if (game.phase === GAME_PHASES.WAITING) {
      const result = roomManager.leaveRoom(socket.id);

      if (result) {
        const { roomCode, game } = result;

        // Notify remaining players
        io.to(roomCode).emit('player_left', {
          publicState: game.getPublicState()
        });
      }
    } else {
      // Game in progress - just remove socket mapping but keep player in game
      roomManager.playerRooms.delete(socket.id);
      console.log(`Player ${socket.id} disconnected from active game ${roomCode} (can rejoin)`);

      // Notify other players that someone disconnected (but is still in game)
      io.to(roomCode).emit('player_disconnected', {
        playerId: socket.id,
        publicState: game.getPublicState()
      });
    }
  };
}
