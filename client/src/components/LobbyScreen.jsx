import { useState, useEffect } from 'react';
import { PokerTable } from './ui/PokerTable';
import { MoneyHand } from './ui/FoodStampBills';
import { socketService } from '../services/socket';
import '../styles/FoodStampBills.css';

export function LobbyScreen({ gameState, isHost, onStartGame, onLeaveRoom }) {
  // Load AI preference from localStorage, default to true
  const [aiEnabled, setAiEnabled] = useState(() => {
    const saved = localStorage.getItem('lowsociety_ai_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Load tutorial mode preference from localStorage, default to false
  const [tutorialMode, setTutorialMode] = useState(() => {
    const saved = localStorage.getItem('lowsociety_tutorial_mode');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Save AI preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lowsociety_ai_enabled', JSON.stringify(aiEnabled));
  }, [aiEnabled]);

  // Save tutorial mode preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lowsociety_tutorial_mode', JSON.stringify(tutorialMode));
  }, [tutorialMode]);

  const handleStartGame = () => {
    // Set chat mode on server before starting
    const chatMode = tutorialMode ? 'tutorial' : 'commentary';
    socketService.emit('set_chat_mode', { mode: chatMode });
    onStartGame({ aiEnabled });
  };

  const handleWatchAIGame = () => {
    // Set chat mode on server before starting
    const chatMode = tutorialMode ? 'tutorial' : 'commentary';
    socketService.emit('set_chat_mode', { mode: chatMode });
    // Start an all-AI game where player is spectator
    onStartGame({ aiEnabled: true, spectatorMode: true });
  };

  // Calculate how many AI players will be added
  const maxPlayers = 5;
  const aiPlayersToAdd = aiEnabled && gameState.playerCount < maxPlayers
    ? maxPlayers - gameState.playerCount
    : 0;

  // Placeholder money hand for visual consistency
  const placeholderMoney = [];

  return (
    <div className="lobby-screen">
      {/* Game Header - visible with lobby info */}
      <div className="game-header">
        <div className="game-info">
          <div className="info-item">
            <span className="info-label">Room</span>
            <span className="info-value">{gameState.roomCode}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Players</span>
            <span className="info-value">{gameState.playerCount}/5</span>
          </div>
          {/* Hidden game info - will appear when game starts */}
          <div className="info-item" style={{ opacity: 0, pointerEvents: 'none' }}>
            <span className="info-label">Cards Left</span>
            <span className="info-value">0/15</span>
          </div>
          <div className="info-item auction-type-inline" style={{ opacity: 0, pointerEvents: 'none' }}>
            <span className="info-label">Auction</span>
            <span className="info-value">✨ WIN</span>
          </div>
          <div className="info-item" style={{ opacity: 0, pointerEvents: 'none' }}>
            <span className="info-label">Highest Bid</span>
            <span className="info-value">$0</span>
          </div>
          <div className="info-item turn-indicator-inline" style={{ opacity: 0, pointerEvents: 'none' }}>
            <span className="info-label">Turn</span>
            <span className="info-value">Waiting</span>
          </div>
        </div>
        <button className="btn btn-danger" onClick={onLeaveRoom}>
          Leave Room
        </button>
      </div>

      {/* Game Board Layout */}
      <div className="game-board">
        {/* Player Cards Area - hidden until game starts */}
        <div className="players-cards-area" style={{ opacity: 0, pointerEvents: 'none' }}>
          <h3>Player Cards</h3>
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
            No cards won yet
          </p>
        </div>

        {/* Poker Table with Players */}
        <div className="poker-table-section">
          <PokerTable
            players={gameState.players}
            currentPlayerId={socketService.getSocketId()}
            currentTurnPlayerId={null}
            currentCard={null}
            cardsRemaining={0}
            showStats={false}
          />
        </div>

        {/* Money Hand Area - shows lobby controls, hidden money hand for game */}
        <div className="money-hand">
          {/* Lobby Controls - visible in lobby */}
          <div className="lobby-controls">
            <h3 style={{ marginBottom: '20px' }}>Lobby</h3>

            {isHost && (
              <div className="ai-toggle-section" style={{
                marginBottom: '20px',
                padding: '15px',
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '2px solid var(--border-color)'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}>
                  <input
                    type="checkbox"
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ flex: 1 }}>
                    <strong>Fill with AI Players</strong>
                    <br />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Automatically fills to 5 players. AI players replaced as humans join.
                    </span>
                  </span>
                  <span style={{ fontSize: '1.5rem' }}>🤖</span>
                </label>
              </div>
            )}

            {isHost && (
              <div className="tutorial-mode-section" style={{
                marginBottom: '20px',
                padding: '15px',
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '2px solid var(--border-color)'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}>
                  <input
                    type="checkbox"
                    checked={tutorialMode}
                    onChange={(e) => setTutorialMode(e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ flex: 1 }}>
                    <strong>Tutorial Mode</strong>
                    <br />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      AI explains their moves and strategy. Turns off in-game commentary.
                    </span>
                  </span>
                  <span style={{ fontSize: '1.5rem' }}>📚</span>
                </label>
              </div>
            )}

            <div className="lobby-actions" style={{ marginBottom: '20px' }}>
              {isHost ? (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={handleStartGame}
                    disabled={gameState.playerCount < 3 && !aiEnabled}
                    style={{ width: '100%', marginBottom: '10px' }}
                  >
                    Start Game
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleWatchAIGame}
                    style={{
                      width: '100%',
                      marginBottom: '10px',
                      background: 'var(--bg-card)',
                      border: '2px solid var(--accent-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    🤖 Watch AI Game
                  </button>
                </>
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '10px' }}>
                  Waiting for host to start the game...
                </p>
              )}
            </div>

            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <h4 style={{ color: 'var(--accent-primary)', marginBottom: '10px' }}>How to Play:</h4>
              <ul style={{ textAlign: 'left', lineHeight: '1.6', paddingLeft: '20px' }}>
                <li>Each player starts with food stamp bills (your money)</li>
                <li>At game start, you lose ONE random bill</li>
                <li>Bid on desirable items or bid to AVOID disgrace cards</li>
                <li>Prestige cards double your score (or more!)</li>
                <li>Player with LEAST money left is eliminated</li>
                <li>Highest score among remaining players wins!</li>
              </ul>
            </div>
          </div>

          {/* Placeholder Money Hand - hidden, will show when game starts */}
          <div style={{ opacity: 0, pointerEvents: 'none' }}>
            <h3>Your Food Stamps</h3>
            <MoneyHand
              moneyCards={placeholderMoney}
              onMoneyClick={() => {}}
              selectedMoney={[]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
