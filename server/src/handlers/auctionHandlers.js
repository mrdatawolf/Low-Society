/**
 * Auction Handlers
 * Handles bidding and passing during auctions
 */

import { GAME_CONFIG } from '../shared/constants/gameConfig.js';
import { handleSocketError, errors } from '../utils/errorHandler.js';
import { checkAndHandleAITurn } from '../ai/aiHandler.js';

/**
 * Validate money card IDs for bidding
 */
function validateMoneyCardIds(moneyCardIds) {
  if (!Array.isArray(moneyCardIds)) {
    throw new Error('Money card IDs must be an array');
  }

  if (moneyCardIds.length === 0) {
    throw new Error('Must select at least one money card');
  }

  if (moneyCardIds.length > GAME_CONFIG.money.maxCardsInHand) {
    throw new Error(`Cannot bid more than ${GAME_CONFIG.money.maxCardsInHand} cards`);
  }

  // Validate each ID is a string
  moneyCardIds.forEach((id, index) => {
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new Error(`Invalid money card ID at index ${index}`);
    }
  });

  return moneyCardIds;
}

/**
 * Handler for placing a bid
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} roomManager - Room manager instance
 * @param {Object} io - Socket.io server instance
 */
export function handlePlaceBid(socket, roomManager, io) {
  return ({ moneyCardIds }, callback) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) throw errors.notInRoom();

      const game = roomManager.getGame(roomCode);
      if (!game) throw errors.roomNotFound(roomCode);

      // Validate money card IDs
      const validatedCardIds = validateMoneyCardIds(moneyCardIds);

      const bidTotal = game.placeBid(socket.id, validatedCardIds);

      // Notify all players of new bid
      io.to(roomCode).emit('bid_placed', {
        publicState: game.getPublicState(),
        playerId: socket.id,
        bidTotal
      });

      // Update bidder's private state
      io.to(socket.id).emit('private_state_update', {
        privateState: game.getPrivateState(socket.id)
      });

      // Check if next turn is an AI player
      checkAndHandleAITurn(game, roomCode, io);

      callback({ success: true, bidTotal });
    } catch (error) {
      handleSocketError(error, callback, socket, { event: 'place_bid' });
    }
  };
}

/**
 * Handler for passing on current auction
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} roomManager - Room manager instance
 * @param {Object} io - Socket.io server instance
 */
export function handlePass(socket, roomManager, io) {
  return (data, callback) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) throw errors.notInRoom();

      const game = roomManager.getGame(roomCode);
      if (!game) throw errors.roomNotFound(roomCode);

      game.pass(socket.id);

      // Notify all players
      io.to(roomCode).emit('player_passed', {
        publicState: game.getPublicState(),
        playerId: socket.id
      });

      // Update all private states (money may have changed)
      game.players.forEach(player => {
        io.to(player.id).emit('private_state_update', {
          privateState: game.getPrivateState(player.id)
        });
      });

      // Check if next turn is an AI player (or if auction ended, check next phase)
      checkAndHandleAITurn(game, roomCode, io);

      callback({ success: true });
    } catch (error) {
      handleSocketError(error, callback, socket, { event: 'pass' });
    }
  };
}
