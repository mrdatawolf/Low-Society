/**
 * Centralized Error Handler
 * Provides consistent error handling across socket events
 */

import { SOCKET_EVENTS } from '../shared/constants/socketEvents.js';

/**
 * Error types for categorization
 */
export const ERROR_TYPES = {
  VALIDATION: 'validation',
  NOT_FOUND: 'not_found',
  PERMISSION: 'permission',
  GAME_STATE: 'game_state',
  INTERNAL: 'internal'
};

/**
 * Custom error class with type information
 */
export class GameError extends Error {
  constructor(message, type = ERROR_TYPES.INTERNAL, details = {}) {
    super(message);
    this.name = 'GameError';
    this.type = type;
    this.details = details;
    this.timestamp = Date.now();
  }
}

/**
 * Handle socket event errors consistently
 * @param {Error} error - The error that occurred
 * @param {Function} callback - Socket callback function
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} context - Additional context for logging
 */
export function handleSocketError(error, callback, socket = null, context = {}) {
  // Determine error type
  const errorType = error instanceof GameError ? error.type : ERROR_TYPES.INTERNAL;

  // Log the error with context
  const logContext = {
    type: errorType,
    message: error.message,
    socketId: socket?.id,
    ...context,
    ...(error.details || {})
  };

  if (errorType === ERROR_TYPES.INTERNAL) {
    console.error('[ERROR]', JSON.stringify(logContext, null, 2));
    if (error.stack) {
      console.error(error.stack);
    }
  } else {
    console.warn('[WARN]', JSON.stringify(logContext, null, 2));
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: error.message,
    type: errorType,
    timestamp: Date.now()
  };

  // Send error via callback if provided
  if (callback && typeof callback === 'function') {
    callback(errorResponse);
  }

  // Optionally emit error event to client
  if (socket && errorType === ERROR_TYPES.INTERNAL) {
    socket.emit(SOCKET_EVENTS.ERROR, {
      message: 'An unexpected error occurred',
      type: errorType
    });
  }

  return errorResponse;
}

/**
 * Wrap a socket handler with error handling
 * @param {Function} handler - The handler function to wrap
 * @returns {Function} Wrapped handler with error handling
 */
export function withErrorHandling(handler) {
  return async function(data, callback) {
    try {
      await handler.call(this, data, callback);
    } catch (error) {
      handleSocketError(error, callback, this, {
        handler: handler.name,
        data: safeStringify(data)
      });
    }
  };
}

/**
 * Safe JSON stringify that handles circular references
 */
function safeStringify(obj, maxLength = 200) {
  try {
    const seen = new WeakSet();
    const str = JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    });
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  } catch (e) {
    return '[Unstringifiable]';
  }
}

/**
 * Common error factory functions
 */
export const errors = {
  notInRoom: () => new GameError(
    'You are not in a room',
    ERROR_TYPES.NOT_FOUND
  ),

  roomNotFound: (roomCode) => new GameError(
    `Room ${roomCode} not found`,
    ERROR_TYPES.NOT_FOUND,
    { roomCode }
  ),

  notYourTurn: () => new GameError(
    'Not your turn',
    ERROR_TYPES.GAME_STATE
  ),

  gameInProgress: () => new GameError(
    'Game already in progress',
    ERROR_TYPES.GAME_STATE
  ),

  notHost: () => new GameError(
    'Only the host can start the game',
    ERROR_TYPES.PERMISSION
  ),

  invalidInput: (field, reason) => new GameError(
    `Invalid ${field}: ${reason}`,
    ERROR_TYPES.VALIDATION,
    { field, reason }
  ),

  roomFull: (maxPlayers) => new GameError(
    `Room is full (max ${maxPlayers} players)`,
    ERROR_TYPES.GAME_STATE,
    { maxPlayers }
  ),

  notEnoughPlayers: (minPlayers) => new GameError(
    `Need at least ${minPlayers} players to start`,
    ERROR_TYPES.GAME_STATE,
    { minPlayers }
  )
};
