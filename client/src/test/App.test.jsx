import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { socketService } from '../services/socket';

// Mock the socket service
vi.mock('../services/socket', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    startGame: vi.fn(),
    placeBid: vi.fn(),
    pass: vi.fn(),
    leaveRoom: vi.fn(),
    getSocketId: vi.fn(() => 'test-socket-id'),
  }
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render HomeScreen initially', () => {
    render(<App />);
    expect(screen.getByText(/Low Society/i)).toBeInTheDocument();
  });

  it('should connect to socket on mount', () => {
    render(<App />);
    expect(socketService.connect).toHaveBeenCalled();
  });

  it('should disconnect from socket on unmount', () => {
    const { unmount } = render(<App />);
    unmount();
    expect(socketService.disconnect).toHaveBeenCalled();
    expect(socketService.removeAllListeners).toHaveBeenCalled();
  });

  it('should register socket event listeners', () => {
    render(<App />);

    expect(socketService.on).toHaveBeenCalledWith('player_joined', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('player_left', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('game_started', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('private_state_update', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('bid_placed', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('player_passed', expect.any(Function));
  });

  it('should handle room creation', async () => {
    const mockResponse = {
      publicState: {
        phase: 'waiting',
        roomCode: 'ABC1',
        players: [{ id: 'test-socket-id', name: 'Alice' }],
        host: 'test-socket-id'
      },
      privateState: {
        moneyHand: []
      }
    };

    socketService.createRoom.mockResolvedValue(mockResponse);

    render(<App />);

    const nameInput = screen.getByPlaceholderText(/your name/i);
    const createButton = screen.getByRole('button', { name: /create room/i });

    await userEvent.type(nameInput, 'Alice');
    await userEvent.click(createButton);

    await waitFor(() => {
      expect(socketService.createRoom).toHaveBeenCalledWith('Alice');
    });
  });

  it('should handle room join', async () => {
    const mockResponse = {
      publicState: {
        phase: 'waiting',
        roomCode: 'ABC1',
        players: [
          { id: 'other-id', name: 'Bob' },
          { id: 'test-socket-id', name: 'Alice' }
        ],
        host: 'other-id'
      },
      privateState: {
        moneyHand: []
      }
    };

    socketService.joinRoom.mockResolvedValue(mockResponse);

    render(<App />);

    const nameInput = screen.getByPlaceholderText(/your name/i);
    await userEvent.type(nameInput, 'Alice');

    // Click "Join Room" button to show room code input
    const joinRoomButton = screen.getByRole('button', { name: /join room/i });
    await userEvent.click(joinRoomButton);

    // Now room code input should be visible
    const roomCodeInput = await screen.findByPlaceholderText(/4-letter code/i);
    await userEvent.type(roomCodeInput, 'ABC1');

    // Click the final "Join Game" button
    const submitButton = await screen.findByRole('button', { name: /join game/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(socketService.joinRoom).toHaveBeenCalledWith('ABC1', 'Alice');
    });
  });

  it('should display error message when room creation fails', async () => {
    socketService.createRoom.mockRejectedValue(new Error('Failed to create room'));

    render(<App />);

    const nameInput = screen.getByPlaceholderText(/your name/i);
    const createButton = screen.getByRole('button', { name: /create room/i });

    await userEvent.type(nameInput, 'Alice');
    await userEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to create room/i)).toBeInTheDocument();
    });
  });

  it('should render LobbyScreen when in waiting phase', async () => {
    const mockResponse = {
      publicState: {
        phase: 'waiting',
        roomCode: 'ABC1',
        players: [{ id: 'test-socket-id', name: 'Alice' }],
        host: 'test-socket-id'
      },
      privateState: {
        moneyHand: []
      }
    };

    socketService.createRoom.mockResolvedValue(mockResponse);

    render(<App />);

    const nameInput = screen.getByPlaceholderText(/your name/i);
    const createButton = screen.getByRole('button', { name: /create room/i });

    await userEvent.type(nameInput, 'Alice');
    await userEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/Room Code:/i)).toBeInTheDocument();
    });
  });
});
