import { vi } from 'vitest';

/**
 * Creates a mock Socket.IO client for testing
 */
export function createMockSocket() {
  const eventHandlers = new Map();

  const mockSocket = {
    connected: true,
    id: 'mock-socket-id',

    // Store event listeners
    on: vi.fn((event, handler) => {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, []);
      }
      eventHandlers.get(event).push(handler);
    }),

    // Remove event listener
    off: vi.fn((event, handler) => {
      if (eventHandlers.has(event)) {
        const handlers = eventHandlers.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }),

    // Emit event to server
    emit: vi.fn((event, data, callback) => {
      // Simulate async response
      if (callback) {
        setTimeout(() => callback({ success: true }), 0);
      }
    }),

    // Disconnect
    disconnect: vi.fn(),

    // Helper to trigger events from server
    _trigger: (event, data) => {
      const handlers = eventHandlers.get(event);
      if (handlers) {
        handlers.forEach(handler => handler(data));
      }
    },

    // Helper to get registered handlers
    _getHandlers: (event) => {
      return eventHandlers.get(event) || [];
    },

    // Helper to reset mock
    _reset: () => {
      eventHandlers.clear();
      mockSocket.emit.mockClear();
      mockSocket.on.mockClear();
      mockSocket.off.mockClear();
      mockSocket.disconnect.mockClear();
    }
  };

  return mockSocket;
}
