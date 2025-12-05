import { useState } from 'react';
import { PokerTable } from './ui/PokerTable';
import { Card } from './ui/Card';

export function GameScreen({ gameState, privateState, myPlayerId, onPlaceBid, onPass, onExecuteCardSwap, onDiscardLuxuryCard, onLeaveRoom }) {
  const [selectedMoney, setSelectedMoney] = useState([]);
  const [selectedSwapCards, setSelectedSwapCards] = useState([]);
  const [selectedDiscardCard, setSelectedDiscardCard] = useState(null);

  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const isMyTurn = gameState.currentAuction?.currentTurnPlayerId === myPlayerId && !myPlayer?.hasPassed;

  const handleMoneyClick = (moneyCard) => {
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
    if (selectedMoney.length > 0) {
      onPlaceBid(selectedMoney);
      setSelectedMoney([]);
    }
  };

  const handlePass = () => {
    setSelectedMoney([]);
    onPass();
  };

  const getAuctionTypeText = () => {
    if (!gameState.currentAuction) return '';
    return gameState.currentAuction.type === 'reverse'
      ? 'BIDDING TO AVOID'
      : 'BIDDING TO WIN';
  };

  // Card swap handlers
  const isCardSwapPhase = gameState.phase === 'card_swap';
  const isSwapWinner = isCardSwapPhase && gameState.currentAuction?.swapWinner === myPlayerId;

  const handleCardClick = (playerId, cardId) => {
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
    if (selectedSwapCards.length === 2) {
      const [card1, card2] = selectedSwapCards;
      onExecuteCardSwap(card1.playerId, card1.cardId, card2.playerId, card2.cardId);
      setSelectedSwapCards([]);
    }
  };

  const handleSkipSwap = () => {
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
    if (!isDiscardingPlayer) return;
    setSelectedDiscardCard(cardId === selectedDiscardCard ? null : cardId);
  };

  const handleConfirmDiscard = () => {
    if (selectedDiscardCard) {
      onDiscardLuxuryCard(selectedDiscardCard);
      setSelectedDiscardCard(null);
    }
  };

  // Get luxury cards for the discarding player
  const myLuxuryCards = myPlayer?.wonCards.filter(c => c.type === 'luxury') || [];

  return (
    <div className="game-screen">
      <div className="game-header">
        <div className="game-info">
          <div className="info-item">
            <span className="info-label">Room</span>
            <span className="info-value">{gameState.roomCode}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Cards Left</span>
            <span className="info-value">{gameState.cardsRemaining}/15</span>
          </div>
          <div className="info-item">
            <span className="info-label">Auction Type</span>
            <span className="info-value" style={{
              color: gameState.currentAuction?.type === 'reverse' ? 'var(--danger-color)' : 'var(--success-color)'
            }}>
              {getAuctionTypeText()}
            </span>
          </div>
        </div>
        <button className="btn btn-danger" onClick={onLeaveRoom}>
          Leave Game
        </button>
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
          />

          {/* Auction info below table */}
          {gameState.currentAuction && (
            <div className="auction-info-bar">
              <div className="auction-type" style={{
                color: gameState.currentAuction.type === 'reverse' ? 'var(--danger-color)' : 'var(--success-color)'
              }}>
                {gameState.currentAuction.type === 'reverse' ? '⚠️ BIDDING TO AVOID' : '✨ BIDDING TO WIN'}
              </div>
              <div className="highest-bid">
                Highest Bid: <span style={{ color: 'var(--accent-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  ${gameState.currentAuction.highestBid}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Money Hand / Card Swap Control / Discard Control */}
        <div className="money-hand">
          {isDiscardLuxuryPhase ? (
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
              <div className="money-cards">
                {privateState.moneyHand.map((moneyCard) => (
                  <div
                    key={moneyCard.id}
                    className={`money-card ${
                      !moneyCard.available ? 'disabled' : ''
                    } ${
                      selectedMoney.includes(moneyCard.id) ? 'selected' : ''
                    }`}
                    onClick={() => handleMoneyClick(moneyCard)}
                  >
                    ${moneyCard.value}
                  </div>
                ))}
              </div>
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
    </div>
  );
}
