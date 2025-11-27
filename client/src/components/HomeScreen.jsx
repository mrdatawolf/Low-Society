import { useState } from 'react';

export function HomeScreen({ onCreateRoom, onJoinRoom, error }) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateRoom = () => {
    if (playerName.trim()) {
      onCreateRoom(playerName.trim());
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
        <p>A white trash twist on the classic High Society</p>
        <p>3-5 players • Bid with food stamps • Collect trailer park treasures</p>
      </div>
    </div>
  );
}
