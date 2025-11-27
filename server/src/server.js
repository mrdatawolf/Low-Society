// Main server file
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { roomManager } from './services/roomManager.js';
import { GAME_PHASES } from './models/game.js';

const app = express();
const httpServer = createServer(app);

// Configure CORS
app.use(cors());
app.use(express.json());

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
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
      const { roomCode, game } = roomManager.createRoom(socket.id, playerName);

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
      const game = roomManager.joinRoom(roomCode, socket.id, playerName);

      // Join socket room
      socket.join(roomCode);

      // Notify other players
      socket.to(roomCode).emit('player_joined', {
        publicState: game.getPublicState()
      });

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

    const result = roomManager.leaveRoom(socket.id);

    if (result) {
      const { roomCode, game } = result;

      // Notify remaining players
      io.to(roomCode).emit('player_left', {
        publicState: game.getPublicState()
      });
    }
  });
});

// Start server
const PORT = process.env.PORT || 3003;
httpServer.listen(PORT, () => {
  console.log(`Low Society server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});

export { app, io };
