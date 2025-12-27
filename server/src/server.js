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
import { clearAIPlayers } from './ai/aiHandler.js';
import {
  handleCreateRoom,
  handleJoinRoom,
  handleLeaveRoom,
  handleDisconnect,
  handleStartGame,
  handleGetState,
  handlePlaceBid,
  handlePass,
  handleExecuteCardSwap,
  handleDiscardLuxuryCard,
  handleSetChatMode
} from './handlers/index.js';

// Set up AI cleanup when rooms are deleted
roomManager.on('roomDeleted', (roomCode) => {
  clearAIPlayers(roomCode);
});

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

  // Room management handlers
  socket.on('create_room', handleCreateRoom(socket, roomManager, io));
  socket.on('join_room', handleJoinRoom(socket, roomManager, io));
  socket.on('leave_room', handleLeaveRoom(socket, roomManager, io));

  // Game control handlers
  socket.on('start_game', handleStartGame(socket, roomManager, io));
  socket.on('get_state', handleGetState(socket, roomManager));

  // Auction handlers
  socket.on('place_bid', handlePlaceBid(socket, roomManager, io));
  socket.on('pass', handlePass(socket, roomManager, io));

  // Special card effect handlers
  socket.on('execute_card_swap', handleExecuteCardSwap(socket, roomManager, io));
  socket.on('discard_luxury_card', handleDiscardLuxuryCard(socket, roomManager, io));

  // Chat handlers
  socket.on('set_chat_mode', handleSetChatMode(socket, roomManager, io));

  // Disconnection handler
  socket.on('disconnect', handleDisconnect(socket, roomManager, io, GAME_PHASES));
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
