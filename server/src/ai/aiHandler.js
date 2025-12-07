// AI Handler - Manages AI player turns and decision execution
// This module integrates AI players with the game loop

import { AIPlayer } from './AIPlayer.js';
import { GAME_PHASES } from '../shared/constants/gamePhases.js';
import { GAME_CONFIG } from '../shared/constants/gameConfig.js';
import { SOCKET_EVENTS } from '../shared/constants/socketEvents.js';

/**
 * Store for active AI players by room
 * Format: { roomCode: { playerId: AIPlayer } }
 */
const aiPlayersByRoom = new Map();

/**
 * Processing queue for AI turns by room
 * Prevents race conditions when multiple AI turns happen quickly
 * Format: { roomCode: Promise }
 */
const aiTurnQueue = new Map();

/**
 * Register an AI player for a room
 */
export function registerAIPlayer(roomCode, aiPlayer) {
  if (!aiPlayersByRoom.has(roomCode)) {
    aiPlayersByRoom.set(roomCode, new Map());
  }
  aiPlayersByRoom.get(roomCode).set(aiPlayer.id, aiPlayer);
}

/**
 * Get AI player instance by ID
 */
export function getAIPlayer(roomCode, playerId) {
  const roomAIs = aiPlayersByRoom.get(roomCode);
  if (!roomAIs) return null;
  return roomAIs.get(playerId);
}

/**
 * Check if a player is an AI
 */
export function isAIPlayer(roomCode, playerId) {
  return getAIPlayer(roomCode, playerId) !== null;
}

/**
 * Remove all AI players for a room (when room is deleted)
 */
export function clearAIPlayers(roomCode) {
  const roomAIs = aiPlayersByRoom.get(roomCode);
  if (roomAIs) {
    const count = roomAIs.size;
    aiPlayersByRoom.delete(roomCode);
    // Also clear any pending AI turn queue
    aiTurnQueue.delete(roomCode);
    console.log(`[AI] Cleaned up ${count} AI players from room ${roomCode}`);
  }
}

/**
 * Remove a specific AI player from a room
 */
export function removeAIPlayer(roomCode, playerId) {
  const roomAIs = aiPlayersByRoom.get(roomCode);
  if (roomAIs) {
    roomAIs.delete(playerId);
    console.log(`[AI] Removed AI player ${playerId} from room ${roomCode}`);
  }
}

/**
 * Get count of AI players in a room
 */
export function getAIPlayerCount(roomCode) {
  const roomAIs = aiPlayersByRoom.get(roomCode);
  return roomAIs ? roomAIs.size : 0;
}

/**
 * Get a random AI player from a room
 */
export function getRandomAIPlayer(roomCode) {
  const roomAIs = aiPlayersByRoom.get(roomCode);
  if (!roomAIs || roomAIs.size === 0) return null;

  const aiPlayers = Array.from(roomAIs.values());
  return aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
}

/**
 * Handle AI player's turn in an auction
 * @param {Game} game - The game instance
 * @param {string} roomCode - The room code
 * @param {Object} io - Socket.io server instance
 * @returns {Promise<Object>} The updated public state
 */
export async function handleAITurn(game, roomCode, io) {
  const currentPlayerId = game.currentAuction?.currentTurnPlayerId;

  if (!currentPlayerId) {
    console.log('[AI] No current turn player');
    return null;
  }

  const aiPlayer = getAIPlayer(roomCode, currentPlayerId);

  if (!aiPlayer) {
    console.log('[AI] Current player is not an AI');
    return null;
  }

  console.log(`[AI] ${aiPlayer.name} (${aiPlayer.id}) is thinking...`);

  // Get game state
  const publicState = game.getPublicState();
  const privateState = game.getPrivateState(aiPlayer.id);

  if (!privateState) {
    console.error(`[AI] Could not get private state for ${aiPlayer.id}`);
    return null;
  }

  try {
    // Add thinking delay to make it feel more natural
    await aiPlayer.getThinkingDelay();

    // Make decision
    const decision = aiPlayer.decideBid(publicState, privateState);

    console.log(`[AI] ${aiPlayer.name} decided to ${decision.action}`,
                decision.cards ? `with cards: ${decision.cards}` : '');

    // Execute action and broadcast exactly like human players would
    if (decision.action === 'pass') {
      game.pass(aiPlayer.id);

      // Broadcast player_passed event (same as human player)
      io.to(roomCode).emit(SOCKET_EVENTS.PLAYER_PASSED, {
        publicState: game.getPublicState(),
        playerId: aiPlayer.id
      });

      // Update all private states (money may have changed)
      game.players.forEach(player => {
        if (!isAIPlayer(roomCode, player.id)) {
          io.to(player.id).emit(SOCKET_EVENTS.PRIVATE_STATE_UPDATE, {
            privateState: game.getPrivateState(player.id)
          });
        }
      });
    } else if (decision.action === 'bid') {
      const bidTotal = game.placeBid(aiPlayer.id, decision.cards);

      // Broadcast bid_placed event (same as human player)
      io.to(roomCode).emit(SOCKET_EVENTS.BID_PLACED, {
        publicState: game.getPublicState(),
        playerId: aiPlayer.id,
        bidTotal
      });

      // Update AI player's private state (even though they won't see it)
      io.to(aiPlayer.id).emit(SOCKET_EVENTS.PRIVATE_STATE_UPDATE, {
        privateState: game.getPrivateState(aiPlayer.id)
      });
    }

    // Get updated state
    const updatedPublicState = game.getPublicState();
    return updatedPublicState;

  } catch (error) {
    console.error(`[AI] Error handling AI turn for ${aiPlayer.name}:`, error.message);

    // If AI fails, force them to pass
    try {
      game.pass(aiPlayer.id);
      const updatedPublicState = game.getPublicState();
      io.to(roomCode).emit(SOCKET_EVENTS.STATE_UPDATE, { publicState: updatedPublicState });
      return updatedPublicState;
    } catch (passError) {
      console.error(`[AI] Could not force pass:`, passError.message);
      return null;
    }
  }
}

/**
 * Handle AI player's luxury discard decision (Repo Man effect)
 * @param {Game} game - The game instance
 * @param {string} roomCode - The room code
 * @param {Object} io - Socket.io server instance
 */
export async function handleAILuxuryDiscard(game, roomCode, io) {
  const discardingPlayerId = game.discardingPlayerId;

  if (!discardingPlayerId) {
    return null;
  }

  const aiPlayer = getAIPlayer(roomCode, discardingPlayerId);

  if (!aiPlayer) {
    // Not an AI, skip
    return null;
  }

  console.log(`[AI] ${aiPlayer.name} is deciding which luxury to discard...`);

  try {
    // Add thinking delay
    await aiPlayer.getThinkingDelay();

    // Get player's won cards
    const player = game.players.find(p => p.id === aiPlayer.id);
    if (!player) {
      console.error(`[AI] Player not found for luxury discard`);
      return null;
    }

    // Decide which card to discard
    const cardToDiscard = aiPlayer.decideLuxuryDiscard(player.wonCards);

    if (!cardToDiscard) {
      console.log(`[AI] ${aiPlayer.name} has no luxury cards to discard`);
      // Skip to next auction
      game.startNextAuction();
    } else {
      console.log(`[AI] ${aiPlayer.name} discarding card: ${cardToDiscard}`);
      game.discardLuxuryCard(aiPlayer.id, cardToDiscard);
    }

    // Broadcast state update
    const updatedPublicState = game.getPublicState();
    io.to(roomCode).emit(SOCKET_EVENTS.STATE_UPDATE, { publicState: updatedPublicState });

    // Send private states
    game.players.forEach(player => {
      if (!isAIPlayer(roomCode, player.id)) {
        const playerPrivateState = game.getPrivateState(player.id);
        io.to(player.id).emit(SOCKET_EVENTS.PRIVATE_STATE_UPDATE, {
          privateState: playerPrivateState
        });
      }
    });

    return updatedPublicState;

  } catch (error) {
    console.error(`[AI] Error handling AI luxury discard:`, error.message);
    return null;
  }
}

/**
 * Handle AI player's card swap decision (Pawn Shop Trade effect)
 * @param {Game} game - The game instance
 * @param {string} roomCode - The room code
 * @param {Object} io - Socket.io server instance
 */
export async function handleAICardSwap(game, roomCode, io) {
  const swapWinnerId = game.currentAuction?.swapWinner;

  if (!swapWinnerId) {
    return null;
  }

  const aiPlayer = getAIPlayer(roomCode, swapWinnerId);

  if (!aiPlayer) {
    // Not an AI, skip
    return null;
  }

  console.log(`[AI] ${aiPlayer.name} is deciding card swap...`);

  try {
    // Add thinking delay
    await aiPlayer.getThinkingDelay();

    // Get public state
    const publicState = game.getPublicState();

    // Decide swap (for MVP, AI skips the swap)
    const swapDecision = aiPlayer.decideCardSwap(publicState);

    console.log(`[AI] ${aiPlayer.name} decided to skip card swap`);

    // Execute swap (which will be a skip in MVP)
    game.executeCardSwap(
      aiPlayer.id,
      swapDecision.player1Id,
      swapDecision.card1Id,
      swapDecision.player2Id,
      swapDecision.card2Id
    );

    // Broadcast state update
    const updatedPublicState = game.getPublicState();
    io.to(roomCode).emit(SOCKET_EVENTS.STATE_UPDATE, { publicState: updatedPublicState });

    // Send private states
    game.players.forEach(player => {
      if (!isAIPlayer(roomCode, player.id)) {
        const playerPrivateState = game.getPrivateState(player.id);
        io.to(player.id).emit(SOCKET_EVENTS.PRIVATE_STATE_UPDATE, {
          privateState: playerPrivateState
        });
      }
    });

    return updatedPublicState;

  } catch (error) {
    console.error(`[AI] Error handling AI card swap:`, error.message);
    return null;
  }
}

/**
 * Queue an AI turn for processing
 * Ensures AI turns are processed sequentially to prevent race conditions
 * @param {Function} handler - The async function to execute
 * @param {string} roomCode - The room code
 * @returns {Promise} Promise that resolves when the handler completes
 */
async function queueAITurn(handler, roomCode) {
  // Get or create the queue promise for this room
  const currentQueue = aiTurnQueue.get(roomCode) || Promise.resolve();

  // Chain the new handler onto the existing queue
  const newQueue = currentQueue
    .then(() => handler())
    .catch((error) => {
      console.error(`[AI] Error in queued AI turn for room ${roomCode}:`, error);
    });

  // Update the queue
  aiTurnQueue.set(roomCode, newQueue);

  return newQueue;
}

/**
 * Check if it's an AI player's turn and handle it
 * This should be called after each state update
 * @param {Game} game - The game instance
 * @param {string} roomCode - The room code
 * @param {Object} io - Socket.io server instance
 */
export async function checkAndHandleAITurn(game, roomCode, io) {
  // Check game phase and handle AI accordingly
  switch (game.phase) {
    case GAME_PHASES.AUCTION:
      // Check if current turn is an AI player
      if (game.currentAuction?.currentTurnPlayerId) {
        const isAI = isAIPlayer(roomCode, game.currentAuction.currentTurnPlayerId);
        if (isAI) {
          // Queue the AI turn to prevent race conditions
          queueAITurn(async () => {
            // Small delay before processing to ensure state is settled
            await new Promise(resolve => setTimeout(resolve, GAME_CONFIG.ai.turnProcessingDelay));

            try {
              const updatedState = await handleAITurn(game, roomCode, io);
              // Check if there's another AI turn to handle
              if (updatedState) {
                await checkAndHandleAITurn(game, roomCode, io);
              }
            } catch (error) {
              console.error('[AI] Error in checkAndHandleAITurn:', error);
            }
          }, roomCode);
        }
      }
      break;

    case GAME_PHASES.DISCARD_LUXURY:
      // Check if discarding player is an AI
      if (game.discardingPlayerId) {
        const isAI = isAIPlayer(roomCode, game.discardingPlayerId);
        if (isAI) {
          queueAITurn(async () => {
            await new Promise(resolve => setTimeout(resolve, GAME_CONFIG.ai.turnProcessingDelay));

            try {
              const updatedState = await handleAILuxuryDiscard(game, roomCode, io);
              if (updatedState) {
                await checkAndHandleAITurn(game, roomCode, io);
              }
            } catch (error) {
              console.error('[AI] Error in handleAILuxuryDiscard:', error);
            }
          }, roomCode);
        }
      }
      break;

    case GAME_PHASES.CARD_SWAP:
      // Check if swap winner is an AI
      if (game.currentAuction?.swapWinner) {
        const isAI = isAIPlayer(roomCode, game.currentAuction.swapWinner);
        if (isAI) {
          queueAITurn(async () => {
            await new Promise(resolve => setTimeout(resolve, GAME_CONFIG.ai.turnProcessingDelay));

            try {
              const updatedState = await handleAICardSwap(game, roomCode, io);
              if (updatedState) {
                await checkAndHandleAITurn(game, roomCode, io);
              }
            } catch (error) {
              console.error('[AI] Error in handleAICardSwap:', error);
            }
          }, roomCode);
        }
      }
      break;

    default:
      // No AI handling needed for other phases
      break;
  }
}
