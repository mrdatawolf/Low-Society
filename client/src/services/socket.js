// Socket.io client service
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(serverUrl = 'http://localhost:3003') {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Event listeners
  on(event, callback) {
    if (!this.socket) return;

    this.socket.on(event, callback);

    // Track listeners for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);

    // Remove from tracked listeners
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  removeAllListeners() {
    if (!this.socket) return;

    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket.off(event, callback);
      });
    });

    this.listeners.clear();
  }

  // Emit events with promise support
  emit(event, data) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(event, data, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Unknown error'));
        }
      });
    });
  }

  // Game-specific methods
  async createRoom(playerName) {
    return this.emit('create_room', { playerName });
  }

  async joinRoom(roomCode, playerName) {
    return this.emit('join_room', { roomCode, playerName });
  }

  async startGame() {
    return this.emit('start_game', {});
  }

  async placeBid(moneyCardIds) {
    return this.emit('place_bid', { moneyCardIds });
  }

  async pass() {
    return this.emit('pass', {});
  }

  async executeCardSwap(player1Id, card1Id, player2Id, card2Id) {
    return this.emit('execute_card_swap', { player1Id, card1Id, player2Id, card2Id });
  }

  async getState() {
    return this.emit('get_state', {});
  }

  async leaveRoom() {
    return this.emit('leave_room', {});
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getSocketId() {
    return this.socket?.id;
  }
}

// Export class for testing
export { SocketService };

// Singleton instance
export const socketService = new SocketService();
