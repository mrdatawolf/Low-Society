import { useState, useEffect, useRef } from 'react';
import '../styles/HomeScreen.css';

export function HomeScreen({ onCreateRoom, onJoinRoom, error }) {
  // Load player name from localStorage on mount
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('lowSocietyPlayerName') || '';
  });
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const roomCodeInputRef = useRef(null);

  // Save player name to localStorage whenever it changes
  useEffect(() => {
    if (playerName.trim()) {
      localStorage.setItem('lowSocietyPlayerName', playerName.trim());
    }
  }, [playerName]);

  // Focus room code input when joining mode is activated
  useEffect(() => {
    if (isJoining && roomCodeInputRef.current) {
      roomCodeInputRef.current.focus();
    }
  }, [isJoining]);

  const handleCreateRoom = () => {
    if (playerName.trim()) {
      // Load AI preference from localStorage
      const saved = localStorage.getItem('lowsociety_ai_enabled');
      const aiEnabled = saved !== null ? JSON.parse(saved) : true;
      onCreateRoom(playerName.trim(), { aiEnabled });
    }
  };

  const handleJoinRoom = () => {
    if (playerName.trim() && roomCode.trim()) {
      onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
    }
  };

  return (
    <div className="home-screen">
      <h1 className="game-title">Low Society</h1>
      <p className="game-subtitle">The Trailer Park Auction Game</p>

      <div className="name-input-section">
        <div className="input-group">
          <label>Your Name:</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            autoFocus
          />
        </div>

        {!isJoining ? (
          <div className="button-group">
            <button
              className="btn btn-primary"
              onClick={handleCreateRoom}
              disabled={!playerName.trim()}
            >
              Create Room
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setIsJoining(true)}
              disabled={!playerName.trim()}
            >
              Join Room
            </button>
          </div>
        ) : (
          <>
            <div className="input-group">
              <label>Room Code:</label>
              <input
                ref={roomCodeInputRef}
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 4-letter code"
                maxLength={4}
                style={{ textAlign: 'center', letterSpacing: '8px' }}
              />
            </div>
            <div className="button-group">
              <button
                className="btn btn-primary"
                onClick={handleJoinRoom}
                disabled={!playerName.trim() || roomCode.length !== 4}
              >
                Join Game
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsJoining(false);
                  setRoomCode('');
                }}
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div style={{ marginTop: '60px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        <p>A white trash game</p>
        <p>3-5 players • Bid with food stamps • Collect trailer park treasures</p>
      </div>
    </div>
  );
}
