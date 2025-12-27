import { useState, useEffect } from 'react';
import { PokerTable } from './ui/PokerTable';
import { Card } from './ui/Card';
import { MoneyHand } from './ui/FoodStampBills';
import { PawnShopTradeOverlay, RepoManOverlay } from './ui/PhaseOverlay';
import { GameHistory } from './ui/GameHistory';
import { ChatBubble } from './ui/ChatBubble';
import { soundEffects } from '../services/soundEffects';
import '../styles/FoodStampBills.css';
import '../styles/PhaseOverlay.css';
import '../styles/GameHistory.css';

export function GameScreen({ gameState, privateState, myPlayerId, onPlaceBid, onPass, onExecuteCardSwap, onDiscardLuxuryCard, onLeaveRoom, roundReset, gameDisconnected, chatMessage, onClearChatMessage }) {
  const [selectedMoney, setSelectedMoney] = useState([]);
  const [selectedSwapCards, setSelectedSwapCards] = useState([]);
  const [selectedDiscardCard, setSelectedDiscardCard] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetMessage, setShowResetMessage] = useState(false);
  const [gameEvents, setGameEvents] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const isSpectator = !myPlayer; // If we can't find the player, they're a spectator
  const isMyTurn = !isSpectator && gameState.currentAuction?.currentTurnPlayerId === myPlayerId && !myPlayer?.hasPassed;

  // Disable all interactions when game is disconnected
  const isInteractionDisabled = gameDisconnected;

  // Handle round reset animation
  useEffect(() => {
    if (roundReset) {
      // Start fade out
      setIsResetting(true);
      setShowResetMessage(true);

      // After fade out completes (500ms), fade back in
      const fadeInTimer = setTimeout(() => {
        setIsResetting(false);
      }, 500);

      // Hide reset message after 4 seconds total
      const messageTimer = setTimeout(() => {
        setShowResetMessage(false);
      }, 4000);

      return () => {
        clearTimeout(fadeInTimer);
        clearTimeout(messageTimer);
      };
    }
  }, [roundReset?.timestamp]);

  // Track game events for history
  useEffect(() => {
    // Add game start event
    if (gameState.phase !== 'waiting' && gameEvents.length === 0) {
      setGameEvents([{
        type: 'game_start',
        message: 'Game started!',
        timestamp: Date.now()
      }]);
    }
  }, [gameState.phase]);

  // Track new card/round
  useEffect(() => {
    if (gameState.currentCard) {
      const cardName = gameState.currentCard.name || 'Unknown Card';
      const auctionType = gameState.currentAuction?.type === 'reverse' ? 'AVOID' : 'WIN';
      setGameEvents(prev => [...prev, {
        type: 'round_start',
        message: `New Round: ${cardName} (${auctionType})`,
        timestamp: Date.now()
      }]);
    }
  }, [gameState.currentCard?.id]);

  // Track player actions via game state changes
  useEffect(() => {
    if (!gameState.currentAuction) return;

    // Track who passed
    gameState.players.forEach(player => {
      if (player.hasPassed) {
        const alreadyLogged = gameEvents.some(e =>
          e.type === 'pass' &&
          e.playerId === player.id &&
          e.cardId === gameState.currentCard?.id
        );

        if (!alreadyLogged) {
          setGameEvents(prev => [...prev, {
            type: 'pass',
            message: `${player.name} passed`,
            timestamp: Date.now(),
            playerId: player.id,
            cardId: gameState.currentCard?.id
          }]);
        }
      }

      // Track current bids
      if (player.currentBidTotal > 0) {
        const lastBidEvent = gameEvents.filter(e =>
          e.type === 'bid' &&
          e.playerId === player.id &&
          e.cardId === gameState.currentCard?.id
        ).pop();

        if (!lastBidEvent || lastBidEvent.amount !== player.currentBidTotal) {
          setGameEvents(prev => [...prev, {
            type: 'bid',
            message: `${player.name} bid $${player.currentBidTotal}`,
            timestamp: Date.now(),
            playerId: player.id,
            amount: player.currentBidTotal,
            cardId: gameState.currentCard?.id
          }]);
        }
      }
    });
  }, [gameState.players, gameState.currentCard?.id]);

  // Track card wins
  useEffect(() => {
    gameState.players.forEach(player => {
      player.wonCards.forEach(card => {
        const alreadyLogged = gameEvents.some(e =>
          e.type === 'win' &&
          e.playerId === player.id &&
          e.wonCardId === card.id
        );

        if (!alreadyLogged) {
          setGameEvents(prev => [...prev, {
            type: 'win',
            message: `${player.name} won ${card.name}`,
            timestamp: Date.now(),
            playerId: player.id,
            wonCardId: card.id
          }]);
        }
      });
    });
  }, [gameState.players.map(p => p.wonCards.length).join(',')]);

  const handleMoneyClick = (moneyCard) => {
    if (isInteractionDisabled) return;
    if (!moneyCard.available || !isMyTurn) return;

    if (selectedMoney.includes(moneyCard.id)) {
      setSelectedMoney(selectedMoney.filter(id => id !== moneyCard.id));
    } else {
      setSelectedMoney([...selectedMoney, moneyCard.id]);
    }
  };

  const calculateBidTotal = () => {
    let total = myPlayer?.currentBidTotal || 0;
    selectedMoney.forEach(id => {
      const card = privateState.moneyHand.find(m => m.id === id);
      if (card) total += card.value;
    });
    return total;
  };

  const handlePlaceBid = () => {
    if (isInteractionDisabled) return;
    if (selectedMoney.length > 0) {
      onPlaceBid(selectedMoney);
      setSelectedMoney([]);
    }
  };

  const handlePass = () => {
    if (isInteractionDisabled) return;
    setSelectedMoney([]);
    onPass();
  };

  // Card swap handlers
  const isCardSwapPhase = gameState.phase === 'card_swap';
  const isSwapWinner = isCardSwapPhase && gameState.currentAuction?.swapWinner === myPlayerId;

  const handleCardClick = (playerId, cardId) => {
    if (isInteractionDisabled) return;
    if (!isSwapWinner) return;

    const selection = { playerId, cardId };
    const existingIndex = selectedSwapCards.findIndex(
      s => s.playerId === playerId && s.cardId === cardId
    );

    if (existingIndex !== -1) {
      // Deselect
      setSelectedSwapCards(selectedSwapCards.filter((_, i) => i !== existingIndex));
    } else {
      // Select (max 2 cards)
      if (selectedSwapCards.length < 2) {
        setSelectedSwapCards([...selectedSwapCards, selection]);
      }
    }
  };

  const handleConfirmSwap = () => {
    if (isInteractionDisabled) return;
    if (selectedSwapCards.length === 2) {
      const [card1, card2] = selectedSwapCards;
      onExecuteCardSwap(card1.playerId, card1.cardId, card2.playerId, card2.cardId);
      setSelectedSwapCards([]);
    }
  };

  const handleSkipSwap = () => {
    if (isInteractionDisabled) return;
    onExecuteCardSwap(null, null, null, null);
    setSelectedSwapCards([]);
  };

  const isCardSelected = (playerId, cardId) => {
    return selectedSwapCards.some(s => s.playerId === playerId && s.cardId === cardId);
  };

  // Discard luxury handlers
  const isDiscardLuxuryPhase = gameState.phase === 'discard_luxury';
  const isDiscardingPlayer = isDiscardLuxuryPhase && gameState.discardingPlayerId === myPlayerId;

  const handleLuxuryCardClick = (cardId) => {
    if (isInteractionDisabled) return;
    if (!isDiscardingPlayer) return;
    setSelectedDiscardCard(cardId === selectedDiscardCard ? null : cardId);
  };

  const handleConfirmDiscard = () => {
    if (isInteractionDisabled) return;
    if (selectedDiscardCard) {
      onDiscardLuxuryCard(selectedDiscardCard);
      setSelectedDiscardCard(null);
    }
  };

  // Get luxury cards for the discarding player
  const myLuxuryCards = myPlayer?.wonCards.filter(c => c.type === 'luxury') || [];

  return (
    <div className={`game-screen ${isResetting ? 'resetting' : ''} ${gameDisconnected ? 'disconnected' : ''}`}>
      {gameDisconnected && (
        <div className="disconnected-overlay">
          <div className="disconnected-message">
            <span className="disconnected-icon">⚠️</span>
            <span className="disconnected-text">Player disconnected - Waiting for reconnection...</span>
          </div>
        </div>
      )}
      <div className="game-header">
        {showResetMessage && (
          <div className="reset-message">
            <span className="reset-icon">🔄</span>
            <span className="reset-text">Round reset - {roundReset?.playerName} rejoined</span>
          </div>
        )}
        <div className="game-info">
          <div className="info-item">
            <span className="info-label">Room</span>
            <span className="info-value">{gameState.roomCode}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Cards Left</span>
            <span className="info-value">{gameState.cardsRemaining}/15</span>
          </div>
          {gameState.currentAuction && (
            <>
              <div className="info-item auction-type-inline">
                <span className="info-label">Auction</span>
                <span className="info-value" style={{
                  color: gameState.currentAuction.type === 'reverse' ? 'var(--danger-color)' : 'var(--success-color)',
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}>
                  {gameState.currentAuction.type === 'reverse' ? '⚠️ AVOID' : '✨ WIN'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Highest Bid</span>
                <span className="info-value" style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  ${gameState.currentAuction.highestBid}
                </span>
              </div>
            </>
          )}
          {gameState.currentAuction && (
            <div className="info-item turn-indicator-inline">
              <span className="info-label">Turn</span>
              <span className="info-value" style={{
                color: isMyTurn ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: isMyTurn ? 'bold' : 'normal'
              }}>
                {isMyTurn ? '← YOUR TURN' : gameState.players.find(p => p.id === gameState.currentAuction?.currentTurnPlayerId)?.name || 'Waiting'}
              </span>
            </div>
          )}
        </div>
        <button className="btn btn-danger" onClick={onLeaveRoom}>
          Leave Game
        </button>
      </div>

      {/* History Toggle Button */}
      <button
        className="history-toggle-btn"
        onClick={() => setShowHistory(!showHistory)}
        title="Toggle Game History"
      >
        📜 {showHistory ? 'Hide' : 'History'}
      </button>

      {/* Slide-out History Panel */}
      <div className={`history-panel ${showHistory ? 'history-panel-open' : ''}`}>
        <GameHistory events={gameEvents} />
      </div>

      <div className="game-board">
        {/* Player Cards Display - Show won cards with swap functionality */}
        <div className="players-cards-area">
          <h3>Player Cards</h3>
          {gameState.players.some(p => p.wonCards.length > 0) ? (
            gameState.players.map((player) => (
              player.wonCards.length > 0 && (
                <div key={player.id} className="player-cards-section">
                  <div className="player-cards-header">
                    <span className="player-name">
                      {player.name}
                      {player.id === myPlayerId && ' (You)'}
                    </span>
                    <span className="cards-count">🏆 {player.wonCardsCount}</span>
                  </div>
                  <div className="won-cards">
                    {player.wonCards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => isSwapWinner && handleCardClick(player.id, card.id)}
                        style={{
                          cursor: isSwapWinner ? 'pointer' : 'default',
                          outline: isCardSelected(player.id, card.id) ? '3px solid var(--accent-primary)' : 'none',
                          outlineOffset: '2px',
                          borderRadius: '8px'
                        }}
                      >
                        <Card
                          cardData={card}
                          isFaceUp={true}
                          showModal={!isSwapWinner}
                          size="tiny"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
              No cards won yet
            </p>
          )}
        </div>

        {/* Poker Table with Players */}
        <div className="poker-table-section">
          <PokerTable
            players={gameState.players}
            currentPlayerId={myPlayerId}
            currentTurnPlayerId={gameState.currentAuction?.currentTurnPlayerId}
            currentCard={gameState.currentCard}
            cardsRemaining={gameState.cardsRemaining || 0}
          />
        </div>

        {/* Money Hand / Card Swap Control / Discard Control */}
        <div className="money-hand">
          {isSpectator ? (
            // Spectator Mode UI
            <>
              <h3>🎭 Spectator Mode</h3>
              <div style={{
                padding: '20px',
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '2px solid var(--accent-primary)',
                textAlign: 'center'
              }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '1rem' }}>
                  You are watching an AI-only game
                </p>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <p style={{ marginBottom: '10px' }}>
                    All players are AI-controlled. Watch as they bid, pass, and compete for luxury items!
                  </p>
                  <p style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                    Sit back and enjoy the show! 🍿
                  </p>
                </div>
              </div>
            </>
          ) : isDiscardLuxuryPhase ? (
            // Discard Luxury UI
            <>
              <h3>🚨 Repo Man</h3>
              {isDiscardingPlayer ? (
                <>
                  <p style={{ color: 'var(--danger-color)', marginBottom: '15px' }}>
                    Choose one luxury item to discard
                  </p>
                  <div className="won-cards" style={{ marginBottom: '15px' }}>
                    {myLuxuryCards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => handleLuxuryCardClick(card.id)}
                        style={{
                          cursor: 'pointer',
                          outline: selectedDiscardCard === card.id ? '3px solid var(--danger-color)' : 'none',
                          outlineOffset: '2px',
                          borderRadius: '8px'
                        }}
                      >
                        <Card
                          cardData={card}
                          isFaceUp={true}
                          showModal={false}
                          size="small"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="bid-actions">
                    <button
                      className="btn btn-danger"
                      onClick={handleConfirmDiscard}
                      disabled={!selectedDiscardCard}
                    >
                      Discard Card
                    </button>
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>
                  Waiting for {gameState.players.find(p => p.id === gameState.discardingPlayerId)?.name} to discard a luxury item...
                </p>
              )}
            </>
          ) : isCardSwapPhase ? (
            // Card Swap UI
            <>
              <h3>🔄 Pawn Shop Trade</h3>
              {isSwapWinner ? (
                <>
                  <p style={{ color: 'var(--accent-primary)', marginBottom: '15px' }}>
                    Select 2 cards to swap between players
                  </p>
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Selected: {selectedSwapCards.length}/2
                    </p>
                    {selectedSwapCards.map((sel, idx) => {
                      const player = gameState.players.find(p => p.id === sel.playerId);
                      const card = player?.wonCards.find(c => c.id === sel.cardId);
                      return (
                        <div key={idx} style={{ fontSize: '0.9rem', marginTop: '5px' }}>
                          {idx + 1}. {player?.name}: {card?.name}
                        </div>
                      );
                    })}
                  </div>
                  <div className="bid-actions">
                    <button
                      className="btn btn-primary"
                      onClick={handleConfirmSwap}
                      disabled={selectedSwapCards.length !== 2}
                    >
                      Confirm Swap
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={handleSkipSwap}
                    >
                      Skip Swap
                    </button>
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>
                  Waiting for {gameState.players.find(p => p.id === gameState.currentAuction?.swapWinner)?.name} to swap cards...
                </p>
              )}
            </>
          ) : (
            // Normal Auction UI
            <>
              <h3>Your Food Stamps</h3>
              {privateState.removedBill && (
                <p style={{ color: 'var(--danger-color)', fontSize: '0.9rem', marginBottom: '10px' }}>
                  Lost at start: ${privateState.removedBill.value}
                </p>
              )}
              <MoneyHand
                moneyCards={privateState.moneyHand}
                onMoneyClick={handleMoneyClick}
                selectedMoney={selectedMoney}
              />
              {isMyTurn && (
                <>
                  <div className="bid-total">
                    Total Bid: ${calculateBidTotal()}
                  </div>
                  <div className="bid-actions">
                    <button
                      className="btn btn-primary"
                      onClick={handlePlaceBid}
                      disabled={selectedMoney.length === 0 || calculateBidTotal() <= gameState.currentAuction?.highestBid}
                    >
                      Place Bid
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={handlePass}
                    >
                      Pass
                    </button>
                  </div>
                  {calculateBidTotal() <= gameState.currentAuction?.highestBid && selectedMoney.length > 0 && (
                    <p style={{ color: 'var(--danger-color)', fontSize: '0.9rem', marginTop: '10px' }}>
                      Bid must be higher than ${gameState.currentAuction.highestBid}
                    </p>
                  )}
                </>
              )}
              {!isMyTurn && myPlayer?.hasPassed && (
                <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
                  You have passed this round
                </p>
              )}
              {!isMyTurn && !myPlayer?.hasPassed && (
                <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
                  Waiting for {gameState.players.find(p => p.id === gameState.currentAuction?.currentTurnPlayerId)?.name || 'other player'}'s turn...
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Phase Overlays - Only show full-screen overlays for special phases */}
      <PawnShopTradeOverlay
        visible={isCardSwapPhase}
      />

      <RepoManOverlay
        visible={isDiscardLuxuryPhase}
        playerName={gameState.players.find(p => p.id === gameState.discardingPlayerId)?.name || 'Player'}
      />

      {/* Chat bubble */}
      {chatMessage && (() => {
        // Calculate the seat position of the speaking player
        const getSeatPosition = (playerId) => {
          const playerIndex = gameState.players.findIndex(p => p.id === playerId);
          const currentPlayerIndex = gameState.players.findIndex(p => p.id === myPlayerId);

          if (playerIndex === -1 || currentPlayerIndex === -1) return 'seat-bottom';

          // Calculate relative position (rotate so current player is at index 0)
          const relativeIndex = (playerIndex - currentPlayerIndex + gameState.players.length) % gameState.players.length;
          const totalPlayers = gameState.players.length;

          // Map relative index to seat position based on player count
          const positionMaps = {
            3: ['seat-bottom', 'seat-top-left', 'seat-top-right'],
            4: ['seat-bottom', 'seat-left', 'seat-top', 'seat-right'],
            5: ['seat-bottom', 'seat-left', 'seat-top-left', 'seat-top-right', 'seat-right']
          };

          return positionMaps[totalPlayers]?.[relativeIndex] || 'seat-bottom';
        };

        const playerPosition = getSeatPosition(chatMessage.playerId);

        return (
          <div className="chat-bubble-container">
            <ChatBubble
              key={chatMessage.timestamp}
              playerId={chatMessage.playerId}
              playerName={chatMessage.playerName}
              message={chatMessage.message}
              duration={chatMessage.duration}
              mode={chatMessage.mode}
              playerPosition={playerPosition}
              onComplete={onClearChatMessage}
            />
          </div>
        );
      })()}
    </div>
  );
}
