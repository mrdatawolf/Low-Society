/**
 * Special Card Effect Handlers
 * Handles special card effects like card swaps and luxury discards
 */

import { handleSocketError, errors } from '../utils/errorHandler.js';
import { checkAndHandleAITurn } from '../ai/aiHandler.js';

/**
 * Validate card swap parameters
 */
function validateCardSwapParams(player1Id, card1Id, player2Id, card2Id) {
  // Allow null for skip
  if (player1Id === null && card1Id === null && player2Id === null && card2Id === null) {
    return { isSkip: true };
  }

  // If not skipping, all parameters must be provided
  if (!player1Id || !card1Id || !player2Id || !card2Id) {
    throw new Error('Card swap requires all parameters or all null to skip');
  }

  if (typeof player1Id !== 'string' || typeof player2Id !== 'string') {
    throw new Error('Player IDs must be strings');
  }

  if (typeof card1Id !== 'string' || typeof card2Id !== 'string') {
    throw new Error('Card IDs must be strings');
  }

  if (player1Id === player2Id && card1Id === card2Id) {
    throw new Error('Cannot swap a card with itself');
  }

  return { isSkip: false };
}

/**
 * Validate card ID
 */
function validateCardId(cardId) {
  if (!cardId || typeof cardId !== 'string' || cardId.trim().length === 0) {
    throw new Error('Invalid card ID');
  }
  return cardId;
}

/**
 * Handler for executing card swap (Pawn Shop Trade effect)
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} roomManager - Room manager instance
 * @param {Object} io - Socket.io server instance
 */
export function handleExecuteCardSwap(socket, roomManager, io) {
  return ({ player1Id, card1Id, player2Id, card2Id }, callback) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) throw errors.notInRoom();

      const game = roomManager.getGame(roomCode);
      if (!game) throw errors.roomNotFound(roomCode);

      // Validate card swap parameters
      validateCardSwapParams(player1Id, card1Id, player2Id, card2Id);

      game.executeCardSwap(socket.id, player1Id, card1Id, player2Id, card2Id);

      // Notify all players
      io.to(roomCode).emit('cards_swapped', {
        publicState: game.getPublicState(),
        player1Id,
        card1Id,
        player2Id,
        card2Id
      });

      // Check if next turn is an AI player
      checkAndHandleAITurn(game, roomCode, io);

      callback({ success: true });
    } catch (error) {
      handleSocketError(error, callback, socket, { event: 'execute_card_swap' });
    }
  };
}

/**
 * Handler for discarding luxury card (Repo Man effect)
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} roomManager - Room manager instance
 * @param {Object} io - Socket.io server instance
 */
export function handleDiscardLuxuryCard(socket, roomManager, io) {
  return ({ cardId }, callback) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) throw errors.notInRoom();

      const game = roomManager.getGame(roomCode);
      if (!game) throw errors.roomNotFound(roomCode);

      // Validate card ID
      const validatedCardId = validateCardId(cardId);

      game.discardLuxuryCard(socket.id, validatedCardId);

      // Notify all players
      io.to(roomCode).emit('luxury_card_discarded', {
        publicState: game.getPublicState(),
        playerId: socket.id,
        cardId
      });

      // Check if next turn is an AI player
      checkAndHandleAITurn(game, roomCode, io);

      callback({ success: true });
    } catch (error) {
      handleSocketError(error, callback, socket, { event: 'discard_luxury_card' });
    }
  };
}
