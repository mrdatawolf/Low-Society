import { useState, useEffect } from 'react';
import { PlayerAvatar } from './PlayerAvatar';
import { Card } from './Card';
import '../../styles/PokerTable.css';

/**
 * PokerTable Component
 *
 * Displays players positioned around a poker table
 * Supports 3-5 players with dynamic seat positioning
 *
 * @param {Array} players - Array of player objects
 * @param {string} currentPlayerId - ID of current user
 * @param {string} currentTurnPlayerId - ID of player whose turn it is
 * @param {object} currentCard - Current card being auctioned (optional)
 * @param {string} tableImage - Optional custom table background image
 * @param {function} onPlayerClick - Optional click handler for player avatars
 */
export function PokerTable({
  players = [],
  currentPlayerId,
  currentTurnPlayerId,
  currentCard = null,
  tableImage = null,
  onPlayerClick = null
}) {
  const [animateReveal, setAnimateReveal] = useState(false);
  const [animateCollect, setAnimateCollect] = useState(false);
  const [previousCardId, setPreviousCardId] = useState(null);
  const [ghostCard, setGhostCard] = useState(null);

  // Trigger reveal animation when a new card appears
  useEffect(() => {
    if (currentCard && currentCard.id !== previousCardId) {
      setAnimateReveal(true);
      setPreviousCardId(currentCard.id);

      // Reset animation after it completes
      const timer = setTimeout(() => {
        setAnimateReveal(false);
      }, 1600); // Match animation duration (1.6s)

      return () => clearTimeout(timer);
    }
  }, [currentCard, previousCardId]);

  // Trigger collection animation when card disappears (is won)
  useEffect(() => {
    // If we previously had a card but now we don't, it was just won
    if (previousCardId && !currentCard && !animateCollect) {
      // Create a ghost card to animate away
      const lastCard = { id: previousCardId };
      setGhostCard(lastCard);
      setAnimateCollect(true);

      // Clear the ghost card after animation completes
      const timer = setTimeout(() => {
        setAnimateCollect(false);
        setGhostCard(null);
        setPreviousCardId(null);
      }, 1000); // Match collection animation duration

      return () => clearTimeout(timer);
    }
  }, [currentCard, previousCardId, animateCollect]);
  // Reorder players so current player is always at bottom
  const getOrderedPlayers = () => {
    if (!players.length) return [];

    const currentPlayerIndex = players.findIndex(p => p.id === currentPlayerId);
    if (currentPlayerIndex === -1) return players;

    // Rotate array so current player is first (will be positioned at bottom)
    return [
      ...players.slice(currentPlayerIndex),
      ...players.slice(0, currentPlayerIndex)
    ];
  };

  // Get seat positions based on player count
  const getSeatPosition = (index, totalPlayers) => {
    // Positions are defined as: bottom, left, top-left, top-right, right
    // Current player is always index 0 (bottom)

    const positions = {
      3: [
        { class: 'seat-bottom' },      // Player 0 (current)
        { class: 'seat-top-left' },    // Player 1
        { class: 'seat-top-right' },   // Player 2
      ],
      4: [
        { class: 'seat-bottom' },      // Player 0 (current)
        { class: 'seat-left' },        // Player 1
        { class: 'seat-top' },         // Player 2
        { class: 'seat-right' },       // Player 3
      ],
      5: [
        { class: 'seat-bottom' },      // Player 0 (current)
        { class: 'seat-left' },        // Player 1
        { class: 'seat-top-left' },    // Player 2
        { class: 'seat-top-right' },   // Player 3
        { class: 'seat-right' },       // Player 4
      ]
    };

    return positions[totalPlayers]?.[index] || { class: 'seat-bottom' };
  };

  const orderedPlayers = getOrderedPlayers();

  return (
    <div className="poker-table-container">
      {/* The poker table surface */}
      <div
        className="poker-table"
        style={{
          backgroundImage: tableImage ? `url(${tableImage})` : 'none',
        }}
      >
        {/* Table center area (for cards, pot, etc.) */}
        <div className="table-center">
          {currentCard ? (
            <Card
              cardData={currentCard}
              isFaceUp={true}
              showModal={true}
              size="medium"
              animateReveal={animateReveal}
            />
          ) : ghostCard ? (
            <Card
              cardData={ghostCard}
              isFaceUp={true}
              showModal={false}
              size="medium"
              animateCollect={animateCollect}
            />
          ) : (
            <div className="table-felt-logo">LOW SOCIETY</div>
          )}
        </div>

        {/* Player seats */}
        {orderedPlayers.map((player, index) => {
          const seatPos = getSeatPosition(index, orderedPlayers.length);
          const isCurrentPlayer = player.id === currentPlayerId;
          const isCurrentTurn = player.id === currentTurnPlayerId;

          return (
            <div
              key={player.id}
              className={`player-seat ${seatPos.class}`}
            >
              <PlayerAvatar
                playerName={player.name}
                playerId={player.id}
                avatarUrl={player.avatarUrl} // Will be null for now (uses placeholder)
                isActive={!player.hasPassed}
                hasPassed={player.hasPassed}
                isCurrentTurn={isCurrentTurn}
                isCurrentPlayer={isCurrentPlayer}
                showName={true}
                showStats={true}
                stats={{
                  money: player.remainingMoney || 0,
                  cards: player.wonCardsCount || 0,
                  bid: player.currentBidTotal || 0,
                }}
                onClick={onPlayerClick ? () => onPlayerClick(player) : null}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
