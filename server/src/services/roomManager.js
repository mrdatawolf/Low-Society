// Room management service
import { Game, GAME_PHASES } from '../models/game.js';

class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> Game
    this.playerRooms = new Map(); // playerId -> roomCode
  }

  // Generate a unique 4-character room code
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like I, O, 0, 1
    let code;
    let attempts = 0;

    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      attempts++;
    } while (this.rooms.has(code) && attempts < 100);

    if (attempts >= 100) {
      throw new Error('Unable to generate unique room code');
    }

    return code;
  }

  // Create a new room
  createRoom(hostId, hostName) {
    const roomCode = this.generateRoomCode();
    const game = new Game(roomCode);

    // Add host as first player
    game.addPlayer(hostId, hostName);

    this.rooms.set(roomCode, game);
    this.playerRooms.set(hostId, roomCode);

    console.log(`Room ${roomCode} created by ${hostName} (${hostId})`);

    return { roomCode, game };
  }

  // Join an existing room
  joinRoom(roomCode, playerId, playerName) {
    roomCode = roomCode.toUpperCase();

    const game = this.rooms.get(roomCode);
    if (!game) {
      throw new Error('Room not found');
    }

    // Check if player is already in a room
    if (this.playerRooms.has(playerId)) {
      throw new Error('You are already in a room');
    }

    // Check if this is a rejoin attempt (same name, game in progress)
    // Use case-insensitive comparison
    const existingPlayer = game.players.find(p => p.name.toLowerCase() === playerName.toLowerCase());

    // If game is in progress and this is NOT a rejoin, prevent joining
    if (!existingPlayer && game.phase !== GAME_PHASES.WAITING) {
      throw new Error('Game already in progress');
    }

    if (existingPlayer && game.phase !== GAME_PHASES.WAITING) {
      // Allow rejoin - update the player's socket ID
      console.log(`${playerName} rejoining room ${roomCode} (old: ${existingPlayer.id}, new: ${playerId})`);

      // Store old ID for host check
      const oldPlayerId = existingPlayer.id;

      // Remove old player ID from tracking
      this.playerRooms.delete(existingPlayer.id);

      // Update player ID
      existingPlayer.id = playerId;
      this.playerRooms.set(playerId, roomCode);

      // Update host if this was the host
      if (game.host === oldPlayerId) {
        game.host = playerId;
      }

      // Update currentTurnPlayerId in auction if this was the current turn player
      if (game.currentAuction && game.currentAuction.currentTurnPlayerId === oldPlayerId) {
        game.currentAuction.currentTurnPlayerId = playerId;
      }

      // Update swapWinner if this was the swap winner
      if (game.currentAuction && game.currentAuction.swapWinner === oldPlayerId) {
        game.currentAuction.swapWinner = playerId;
      }

      // Update discardingPlayerId if this was the discarding player
      if (game.discardingPlayerId === oldPlayerId) {
        game.discardingPlayerId = playerId;
      }

      // Update nextStartingPlayerId if this was the next starting player
      if (game.nextStartingPlayerId === oldPlayerId) {
        game.nextStartingPlayerId = playerId;
      }

      // Restart the current auction to ensure clean state
      console.log(`Rejoin - Game phase: ${game.phase}, Has auction: ${!!game.currentAuction}`);
      let roundWasReset = false;
      if (game.phase === 'auction') {
        game.restartCurrentAuction();
        roundWasReset = true;
        console.log(`Auction restarted due to ${playerName} rejoining`);
        console.log(`After restart - Turn player: ${game.currentAuction?.currentTurnPlayerId}`);
      }

      console.log(`${playerName} (${playerId}) rejoined room ${roomCode}`);
      return { game, roundWasReset };
    }

    // Add player to game
    game.addPlayer(playerId, playerName);
    this.playerRooms.set(playerId, roomCode);

    console.log(`${playerName} (${playerId}) joined room ${roomCode}`);

    return { game, roundWasReset: false };
  }

  // Leave a room
  leaveRoom(playerId) {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return null;

    const game = this.rooms.get(roomCode);
    if (!game) return null;

    // Remove player from game
    game.removePlayer(playerId);
    this.playerRooms.delete(playerId);

    console.log(`Player ${playerId} left room ${roomCode}`);

    // If room is empty, delete it
    if (game.players.length === 0) {
      this.rooms.delete(roomCode);
      console.log(`Room ${roomCode} deleted (empty)`);
      return null;
    }

    return { roomCode, game };
  }

  // Get game by room code
  getGame(roomCode) {
    return this.rooms.get(roomCode.toUpperCase());
  }

  // Get room code for a player
  getPlayerRoom(playerId) {
    return this.playerRooms.get(playerId);
  }

  // Check if player is in a room
  isPlayerInRoom(playerId) {
    return this.playerRooms.has(playerId);
  }

  // Get all active rooms (for debugging/admin)
  getAllRooms() {
    return Array.from(this.rooms.values()).map(game => ({
      roomCode: game.roomCode,
      playerCount: game.players.length,
      phase: game.phase,
      host: game.host
    }));
  }

  // Clean up stale rooms (rooms older than 4 hours)
  cleanupStaleRooms() {
    const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);

    this.rooms.forEach((game, roomCode) => {
      if (game.createdAt < fourHoursAgo) {
        // Remove all players from tracking
        game.players.forEach(player => {
          this.playerRooms.delete(player.id);
        });

        // Delete room
        this.rooms.delete(roomCode);
        console.log(`Room ${roomCode} cleaned up (stale)`);
      }
    });
  }
}

// Singleton instance
export const roomManager = new RoomManager();

// Run cleanup every hour
setInterval(() => {
  roomManager.cleanupStaleRooms();
}, 60 * 60 * 1000);
