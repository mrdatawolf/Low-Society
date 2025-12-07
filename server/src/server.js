// Main server file
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { roomManager } from './services/roomManager.js';
import { GAME_PHASES } from './shared/constants/gamePhases.js';
import { SOCKET_EVENTS } from './shared/constants/socketEvents.js';
import { GAME_CONFIG } from './shared/constants/gameConfig.js';
import { checkAndHandleAITurn, registerAIPlayer, removeAIPlayer, clearAIPlayers } from './ai/aiHandler.js';
import { createAIPlayer } from './ai/AIPlayer.js';
import { handleSocketError, errors } from './utils/errorHandler.js';

// Set up AI cleanup when rooms are deleted
roomManager.on('roomDeleted', (roomCode) => {
  clearAIPlayers(roomCode);
});

// Input validation helpers
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

function validateCardId(cardId) {
  if (!cardId || typeof cardId !== 'string' || cardId.trim().length === 0) {
    throw new Error('Invalid card ID');
  }
  return cardId;
}

// Load config
const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, '..', '..', 'config.js');
let config;
try {
  // Read as CommonJS module and convert to JSON-safe format
  const configContent = readFileSync(configPath, 'utf8');
  // Extract the object literal using regex and convert to JSON
  const match = configContent.match(/module\.exports\s*=\s*(\{[\s\S]*\});/);
  if (match) {
    // Use Function constructor instead of eval for safer parsing
    // This still evaluates code but is more controlled than eval
    // Better solution would be to use ES modules or JSON config files
    const configString = match[1];
    // Replace JavaScript object syntax with JSON-compatible syntax
    const jsonString = configString
      .replace(/(\w+):/g, '"$1":')  // Quote keys
      .replace(/'/g, '"');           // Replace single quotes with double quotes

    try {
      config = JSON.parse(jsonString);
    } catch (jsonError) {
      // Fallback to Function constructor if JSON parsing fails
      // This is safer than eval as it doesn't have access to local scope
      const configFunc = new Function('return ' + configString);
      config = configFunc();
      console.warn('Config parsed using Function constructor. Consider migrating to JSON or ES modules.');
    }
  } else {
    throw new Error('Could not parse config file');
  }
} catch (error) {
  console.error('Warning: Could not load config.js, using defaults:', error.message);
  config = {
    server: { port: 3003, host: '0.0.0.0', corsOrigins: '*' },
    game: { minPlayers: 3, maxPlayers: 5, startingMoney: 40, deckSize: 15 }
  };
}

console.log('Server configuration:', {
  host: config.server.host,
  port: config.server.port,
  cors: config.server.corsOrigins
});

const app = express();
const httpServer = createServer(app);

// Configure CORS based on config
app.use(cors({
  origin: config.server.corsOrigins,
  credentials: true
}));
app.use(express.json());

// Socket.io setup with configured CORS
const io = new Server(httpServer, {
  cors: {
    origin: config.server.corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', rooms: roomManager.getAllRooms().length });
});

app.get('/api/rooms', (req, res) => {
  res.json({ rooms: roomManager.getAllRooms() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Create a new room
  socket.on('create_room', ({ playerName, aiEnabled }, callback) => {
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
  });

  // Join an existing room
  socket.on('join_room', ({ roomCode, playerName }, callback) => {
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
  });

  // Start the game
  socket.on('start_game', (data, callback) => {
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
  });

  // Place a bid
  socket.on('place_bid', ({ moneyCardIds }, callback) => {
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
  });

  // Pass on current auction
  socket.on('pass', (data, callback) => {
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
  });

  // Execute card swap (Pawn Shop Trade)
  socket.on('execute_card_swap', ({ player1Id, card1Id, player2Id, card2Id }, callback) => {
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
  });

  // Discard luxury card (Repo Man)
  socket.on('discard_luxury_card', ({ cardId }, callback) => {
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
  });

  // Get current game state
  socket.on('get_state', (data, callback) => {
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
  });

  // Leave room
  socket.on('leave_room', (data, callback) => {
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
  });

  // Handle disconnection
  socket.on('disconnect', () => {
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
  });
});

// Start server
const PORT = process.env.PORT || config.server.port;
const HOST = config.server.host || '0.0.0.0';
httpServer.listen(PORT, HOST, () => {
  console.log(`Low Society server running on ${HOST}:${PORT}`);
  console.log(`WebSocket server ready for connections`);
  console.log(`Game settings: ${config.game.minPlayers}-${config.game.maxPlayers} players, $${config.game.startingMoney} starting money`);
});

export { app, io };
