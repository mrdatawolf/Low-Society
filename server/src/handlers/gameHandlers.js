/**
 * Game Control Handlers
 * Handles game start and state retrieval
 */

import { GAME_CONFIG } from '../shared/constants/gameConfig.js';
import { handleSocketError, errors } from '../utils/errorHandler.js';
import { createAIPlayer } from '../ai/AIPlayer.js';
import { registerAIPlayer, removeAIPlayer, checkAndHandleAITurn } from '../ai/aiHandler.js';

/**
 * Handler for starting the game
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} roomManager - Room manager instance
 * @param {Object} io - Socket.io server instance
 */
export function handleStartGame(socket, roomManager, io) {
  return (data, callback) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) throw errors.notInRoom();

      const game = roomManager.getGame(roomCode);
      if (!game) throw errors.roomNotFound(roomCode);

      if (game.host !== socket.id) {
        throw errors.notHost();
      }

      // Get AI enabled flag (default to true for backwards compatibility)
      const aiEnabled = data.aiEnabled !== undefined ? data.aiEnabled : true;
      const spectatorMode = data.spectatorMode || false;

      // Auto-fill with AI players if needed and AI is enabled
      let currentPlayerCount = game.players.length;

      // If spectator mode, remove ALL existing players and add max AI players
      if (spectatorMode) {
        console.log(`[AI] Starting spectator mode - removing all players and adding ${GAME_CONFIG.players.max} AI players`);

        // Remove all existing players (human and AI)
        const playersCopy = [...game.players];
        playersCopy.forEach(player => {
          game.removePlayer(player.id);
          // Also remove from AI registry if it's an AI
          if (player.isAI) {
            removeAIPlayer(roomCode, player.id);
          }
          console.log(`[AI] Removed ${player.isAI ? 'AI' : 'human'} player ${player.name} for spectator mode`);
        });

        // Add max AI players
        for (let i = 0; i < GAME_CONFIG.players.max; i++) {
          const aiPlayer = createAIPlayer(i);
          game.addPlayer(aiPlayer.id, aiPlayer.name, true); // true = isAI
          registerAIPlayer(roomCode, aiPlayer);
          console.log(`[AI] Added ${aiPlayer.name} (${aiPlayer.id}) for spectator mode`);
        }
      } else if (aiEnabled && currentPlayerCount < GAME_CONFIG.players.max) {
        // Fill to max players when AI is enabled
        const aiPlayersNeeded = GAME_CONFIG.players.max - currentPlayerCount;
        console.log(`[AI] Adding ${aiPlayersNeeded} AI players to fill room to ${GAME_CONFIG.players.max}`);

        for (let i = 0; i < aiPlayersNeeded; i++) {
          const aiPlayer = createAIPlayer(i);
          game.addPlayer(aiPlayer.id, aiPlayer.name, true); // true = isAI
          registerAIPlayer(roomCode, aiPlayer);
          console.log(`[AI] Added ${aiPlayer.name} (${aiPlayer.id}) to room ${roomCode}`);
        }
      } else if (!aiEnabled && currentPlayerCount < GAME_CONFIG.players.min) {
        throw errors.notEnoughPlayers(GAME_CONFIG.players.min);
      }

      game.startGame();

      // Notify all players
      io.to(roomCode).emit('game_started', {
        publicState: game.getPublicState()
      });

      // Send private states to each player
      game.players.forEach(player => {
        io.to(player.id).emit('private_state_update', {
          privateState: game.getPrivateState(player.id)
        });
      });

      // Check if first turn is an AI player
      checkAndHandleAITurn(game, roomCode, io);

      callback({ success: true });
    } catch (error) {
      handleSocketError(error, callback, socket, { event: 'start_game' });
    }
  };
}

/**
 * Handler for getting current game state
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} roomManager - Room manager instance
 */
export function handleGetState(socket, roomManager) {
  return (data, callback) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) throw errors.notInRoom();

      const game = roomManager.getGame(roomCode);
      if (!game) throw errors.roomNotFound(roomCode);

      callback({
        success: true,
        publicState: game.getPublicState(),
        privateState: game.getPrivateState(socket.id)
      });
    } catch (error) {
      handleSocketError(error, callback, socket, { event: 'get_state' });
    }
  };
}
