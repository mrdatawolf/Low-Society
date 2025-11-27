export function LobbyScreen({ gameState, isHost, onStartGame, onLeaveRoom }) {
  return (
    <div className="lobby-screen">
      <div className="lobby-header">
        <h1 className="game-title" style={{ fontSize: '2.5rem' }}>Low Society</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Room Code:</p>
        <div className="room-code">{gameState.roomCode}</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Share this code with your friends to join
        </p>
      </div>

      <div className="player-list">
        <h3>Players ({gameState.playerCount}/5)</h3>
        {gameState.players.map((player) => (
          <div key={player.id} className="player-item">
            <span className="player-name">{player.name}</span>
            {player.id === gameState.host && (
              <span className="host-badge">HOST</span>
            )}
          </div>
        ))}
        {gameState.playerCount < 3 && (
          <p style={{ color: 'var(--text-secondary)', marginTop: '15px', fontStyle: 'italic' }}>
            Waiting for at least 3 players...
          </p>
        )}
      </div>

      <div className="lobby-actions">
        {isHost ? (
          <button
            className="btn btn-primary"
            onClick={onStartGame}
            disabled={gameState.playerCount < 3}
          >
            Start Game
          </button>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>
            Waiting for host to start the game...
          </p>
        )}
        <button className="btn btn-danger" onClick={onLeaveRoom}>
          Leave Room
        </button>
      </div>

      <div style={{ marginTop: '40px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        <h3 style={{ color: 'var(--accent-primary)', marginBottom: '10px' }}>How to Play:</h3>
        <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          <li>Each player starts with food stamp bills (your money)</li>
          <li>At game start, you lose ONE random bill (not the highest or lowest)</li>
          <li>Bid on desirable items like PBR beer, pickup trucks, and double-wides</li>
          <li>Watch out for disgrace cards - you bid to AVOID them!</li>
          <li>Prestige cards double your score (or more!)</li>
          <li>The player with the LEAST money left is eliminated</li>
          <li>Highest score among remaining players wins!</li>
        </ul>
      </div>
    </div>
  );
}
