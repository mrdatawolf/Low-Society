// Main server file
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { roomManager } from './services/roomManager.js';
import { GAME_PHASES } from './models/game.js';

// Input validation helpers
function sanitizePlayerName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Player name is required');
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    throw new Error('Player name cannot be empty');
  }

  if (trimmed.length > 20) {
    throw new Error('Player name too long (max 20 characters)');
  }

  // Allow letters, numbers, spaces, underscores, hyphens
  if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmed)) {
    throw new Error('Player name contains invalid characters (only letters, numbers, spaces, _, - allowed)');
  }

  return trimmed;
}

function sanitizeRoomCode(code) {
  if (!code || typeof code !== 'string') {
    throw new Error('Room code is required');
  }

  const trimmed = code.trim().toUpperCase();

  if (trimmed.length !== 4) {
    throw new Error('Room code must be 4 characters');
  }

  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    throw new Error('Room code must be alphanumeric');
  }

  return trimmed;
}

// Load config
const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, '..', '..', 'config.js');
let config;
try {
  // Read as CommonJS module
  const configContent = readFileSync(configPath, 'utf8');
  // Simple eval to get the config (since it's a CommonJS module.exports)
  const match = configContent.match(/module\.exports\s*=\s*(\{[\s\S]*\});/);
  if (match) {
    config = eval('(' + match[1] + ')');
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
  socket.on('create_room', ({ playerName }, callback) => {
    try {
      const sanitizedName = sanitizePlayerName(playerName);
      const { roomCode, game } = roomManager.createRoom(socket.id, sanitizedName);

      // Join socket room
      socket.join(roomCode);

      callback({
        success: true,
        roomCode,
        publicState: game.getPublicState(),
        privateState: game.getPrivateState(socket.id)
      });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Join an existing room
  socket.on('join_room', ({ roomCode, playerName }, callback) => {
    try {
      const sanitizedCode = sanitizeRoomCode(roomCode);
      const sanitizedName = sanitizePlayerName(playerName);
      const { game, roundWasReset } = roomManager.joinRoom(sanitizedCode, socket.id, sanitizedName);

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
      callback({ success: false, error: error.message });
    }
  });

  // Start the game
  socket.on('start_game', (data, callback) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) throw new Error('You are not in a room');

      const game = roomManager.getGame(roomCode);
      if (!game) throw new Error('Room not found');

      if (game.host !== socket.id) {
        throw new Error('Only the host can start the game');
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

      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Place a bid
  socket.on('place_bid', ({ moneyCardIds }, callback) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) throw new Error('You are not in a room');

      const game = roomManager.getGame(roomCode);
      if (!game) throw new Error('Room not found');

      const bidTotal = game.placeBid(socket.id, moneyCardIds);

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

      callback({ success: true, bidTotal });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Pass on current auction
  socket.on('pass', (data, callback) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) throw new Error('You are not in a room');

      const game = roomManager.getGame(roomCode);
      if (!game) throw new Error('Room not found');

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

      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Execute card swap (Pawn Shop Trade)
  socket.on('execute_card_swap', ({ player1Id, card1Id, player2Id, card2Id }, callback) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) throw new Error('You are not in a room');

      const game = roomManager.getGame(roomCode);
      if (!game) throw new Error('Room not found');

      game.executeCardSwap(socket.id, player1Id, card1Id, player2Id, card2Id);

      // Notify all players
      io.to(roomCode).emit('cards_swapped', {
        publicState: game.getPublicState(),
        player1Id,
        card1Id,
        player2Id,
        card2Id
      });

      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Discard luxury card (Repo Man)
  socket.on('discard_luxury_card', ({ cardId }, callback) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) throw new Error('You are not in a room');

      const game = roomManager.getGame(roomCode);
      if (!game) throw new Error('Room not found');

      game.discardLuxuryCard(socket.id, cardId);

      // Notify all players
      io.to(roomCode).emit('luxury_card_discarded', {
        publicState: game.getPublicState(),
        playerId: socket.id,
        cardId
      });

      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Get current game state
  socket.on('get_state', (data, callback) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) throw new Error('You are not in a room');

      const game = roomManager.getGame(roomCode);
      if (!game) throw new Error('Room not found');

      callback({
        success: true,
        publicState: game.getPublicState(),
        privateState: game.getPrivateState(socket.id)
      });
    } catch (error) {
      callback({ success: false, error: error.message });
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
