import { useState, useEffect } from 'react';
import { socketService } from './services/socket';
import { HomeScreen } from './components/HomeScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { GameScreen } from './components/GameScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { RulesModal, RulesButton } from './components/ui/RulesModal';
import './styles/App.css';

const GAME_PHASES = {
  HOME: 'home',
  WAITING: 'waiting',
  STARTING: 'starting',
  AUCTION: 'auction',
  CARD_SWAP: 'card_swap',
  DISCARD_LUXURY: 'discard_luxury',
  GAME_OVER: 'game_over'
};

function App() {
  const [phase, setPhase] = useState(GAME_PHASES.HOME);
  const [gameState, setGameState] = useState(null);
  const [privateState, setPrivateState] = useState(null);
  const [error, setError] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [roundReset, setRoundReset] = useState(null);
  const [gameDisconnected, setGameDisconnected] = useState(false);

  useEffect(() => {
    // Connect to server
    socketService.connect();

    // Set up event listeners
    socketService.on('player_joined', ({ publicState }) => {
      setGameState(publicState);
    });

    socketService.on('player_left', ({ publicState }) => {
      setGameState(publicState);
    });

    socketService.on('game_started', ({ publicState }) => {
      setGameState(publicState);
      setPhase(publicState.phase);
    });

    socketService.on('state_update', ({ publicState }) => {
      setGameState(publicState);
    });

    socketService.on('private_state_update', ({ privateState }) => {
      setPrivateState(privateState);
    });

    socketService.on('bid_placed', ({ publicState }) => {
      setGameState(publicState);
    });

    socketService.on('player_passed', ({ publicState }) => {
      setGameState(publicState);
    });

    socketService.on('cards_swapped', ({ publicState }) => {
      setGameState(publicState);
    });

    socketService.on('luxury_card_discarded', ({ publicState }) => {
      setGameState(publicState);
    });

    socketService.on('player_disconnected', ({ publicState }) => {
      setGameState(publicState);
      setGameDisconnected(true);
    });

    socketService.on('round_reset', ({ playerName }) => {
      setRoundReset({ playerName, timestamp: Date.now() });
      // Clear disconnected state when round resets (player rejoined)
      setGameDisconnected(false);
    });

    // Clean up on unmount
    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, []);

  // Update phase when game state changes
  useEffect(() => {
    if (gameState) {
      setPhase(gameState.phase);
    }
  }, [gameState?.phase]);

  const handleCreateRoom = async (playerName) => {
    try {
      setError('');
      const response = await socketService.createRoom(playerName);
      setGameState(response.publicState);
      setPrivateState(response.privateState);
      setPhase(response.publicState.phase);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleJoinRoom = async (roomCode, playerName) => {
    try {
      setError('');
      const response = await socketService.joinRoom(roomCode, playerName);
      setGameState(response.publicState);
      setPrivateState(response.privateState);
      setPhase(response.publicState.phase);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStartGame = async () => {
    try {
      setError('');
      await socketService.startGame();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePlaceBid = async (moneyCardIds) => {
    try {
      setError('');
      await socketService.placeBid(moneyCardIds);
    } catch (err) {
      setError(err.message);
      console.error('Bid error:', err);
    }
  };

  const handlePass = async () => {
    try {
      setError('');
      await socketService.pass();
    } catch (err) {
      setError(err.message);
      console.error('Pass error:', err);
    }
  };

  const handleExecuteCardSwap = async (player1Id, card1Id, player2Id, card2Id) => {
    try {
      setError('');
      await socketService.executeCardSwap(player1Id, card1Id, player2Id, card2Id);
    } catch (err) {
      setError(err.message);
      console.error('Card swap error:', err);
    }
  };

  const handleDiscardLuxuryCard = async (cardId) => {
    try {
      setError('');
      await socketService.discardLuxuryCard(cardId);
    } catch (err) {
      setError(err.message);
      console.error('Discard luxury card error:', err);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await socketService.leaveRoom();
      setPhase(GAME_PHASES.HOME);
      setGameState(null);
      setPrivateState(null);
      setError('');
    } catch (err) {
      console.error('Leave room error:', err);
      // Still reset state even if there's an error
      setPhase(GAME_PHASES.HOME);
      setGameState(null);
      setPrivateState(null);
    }
  };

  const handleNewGame = () => {
    // For now, just go back to home
    // Could potentially keep the same room in the future
    handleLeaveRoom();
  };

  const isHost = gameState && socketService.getSocketId() === gameState.host;
  const myPlayerId = socketService.getSocketId();

  return (
    <div className="app">
      {/* Rules button - available on all screens */}
      <RulesButton onClick={() => setShowRules(true)} />

      {/* Rules modal */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      {phase === GAME_PHASES.HOME && (
        <HomeScreen
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          error={error}
        />
      )}

      {phase === GAME_PHASES.WAITING && gameState && (
        <LobbyScreen
          gameState={gameState}
          isHost={isHost}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {(phase === GAME_PHASES.STARTING ||
        phase === GAME_PHASES.AUCTION ||
        phase === GAME_PHASES.CARD_SWAP ||
        phase === GAME_PHASES.DISCARD_LUXURY) &&
        gameState &&
        privateState && (
        <GameScreen
          gameState={gameState}
          privateState={privateState}
          myPlayerId={myPlayerId}
          onPlaceBid={handlePlaceBid}
          onPass={handlePass}
          onExecuteCardSwap={handleExecuteCardSwap}
          onDiscardLuxuryCard={handleDiscardLuxuryCard}
          onLeaveRoom={handleLeaveRoom}
          roundReset={roundReset}
          gameDisconnected={gameDisconnected}
        />
      )}

      {phase === GAME_PHASES.GAME_OVER && gameState && gameState.results && (
        <GameOverScreen
          results={gameState.results}
          onNewGame={handleNewGame}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {error && phase !== GAME_PHASES.HOME && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'var(--danger-color)',
          color: '#fff',
          padding: '15px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          maxWidth: '400px',
          zIndex: 1000
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default App;
