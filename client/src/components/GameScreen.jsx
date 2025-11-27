import { useState } from 'react';

export function GameScreen({ gameState, privateState, myPlayerId, onPlaceBid, onPass, onLeaveRoom }) {
  const [selectedMoney, setSelectedMoney] = useState([]);

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

  const getCardTypeBadge = (card) => {
    const typeMap = {
      luxury: 'badge-luxury',
      prestige: 'badge-prestige',
      disgrace: 'badge-disgrace',
      special: 'badge-special'
    };
    return typeMap[card.type] || 'badge-luxury';
  };

  const getAuctionTypeText = () => {
    if (!gameState.currentAuction) return '';
    return gameState.currentAuction.type === 'reverse'
      ? 'BIDDING TO AVOID'
      : 'BIDDING TO WIN';
  };

  return (
    <div className="game-screen">
      <div className="game-header">
        <div className="game-info">
          <div className="info-item">
            <span className="info-label">Room</span>
            <span className="info-value">{gameState.roomCode}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Game Enders</span>
            <span className="info-value">{gameState.gameEndingCardsRevealed}/4</span>
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
        {/* Players List */}
        <div className="players-area">
          <h3>Players</h3>
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className={`player-status ${
                !player.hasPassed ? 'active-player' : 'passed-player'
              }`}
            >
              <div className="player-status-header">
                <span className="player-name">
                  {player.name}
                  {player.id === myPlayerId && ' (You)'}
                  {gameState.currentAuction?.currentTurnPlayerId === player.id && !player.hasPassed && (
                    <span style={{ color: 'var(--accent-primary)', marginLeft: '8px', fontSize: '0.9rem' }}>
                      ← TURN
                    </span>
                  )}
                </span>
                {player.hasPassed && (
                  <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>
                    PASSED
                  </span>
                )}
              </div>
              <div className="player-stats">
                <span>💵 ${player.remainingMoney}</span>
                <span>🎯 Bid: ${player.currentBidTotal}</span>
                <span>🏆 Cards: {player.wonCardsCount}</span>
              </div>
              {player.wonCards.length > 0 && (
                <div className="won-cards">
                  {player.wonCards.map((card) => (
                    <div key={card.id} className="won-card-mini">
                      {card.name} {card.value && `(${card.value})`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Current Card */}
        <div className="current-card-area">
          {gameState.currentCard ? (
            <div className="current-card">
              <div className={`card-type-badge ${getCardTypeBadge(gameState.currentCard)}`}>
                {gameState.currentCard.type}
              </div>
              <h2 className="card-name">{gameState.currentCard.name}</h2>
              <p className="card-description">{gameState.currentCard.description}</p>
              {gameState.currentCard.value && (
                <div className="card-value">{gameState.currentCard.value}</div>
              )}
              {gameState.currentCard.effect === 'faux-pas' && (
                <p style={{ color: 'var(--danger-color)', marginTop: '10px' }}>
                  Discard one luxury item!
                </p>
              )}
              {gameState.currentCard.effect === 'passe' && (
                <p style={{ color: 'var(--danger-color)', marginTop: '10px' }}>
                  -5 Status Points
                </p>
              )}
              {gameState.currentCard.effect === 'scandale' && (
                <p style={{ color: 'var(--danger-color)', marginTop: '10px' }}>
                  Halves Your Status!
                </p>
              )}
              {gameState.currentCard.multiplier && (
                <p style={{ color: 'var(--accent-primary)', marginTop: '10px', fontSize: '1.5rem' }}>
                  {gameState.currentCard.multiplier}x Multiplier
                </p>
              )}
              {gameState.currentAuction && (
                <div style={{ marginTop: '20px' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>Current Highest Bid:</p>
                  <p style={{ fontSize: '2rem', color: 'var(--accent-primary)' }}>
                    ${gameState.currentAuction.highestBid}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>Waiting for next card...</p>
          )}
        </div>

        {/* Money Hand */}
        <div className="money-hand">
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
        </div>
      </div>
    </div>
  );
}
