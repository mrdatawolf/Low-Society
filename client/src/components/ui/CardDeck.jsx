/**
 * CardDeck Component
 *
 * Visual representation of the card deck
 * Shows stacked cards and animates drawing from the deck
 */

import { useState, useEffect } from 'react';
import { Card } from './Card';
import '../../styles/CardDeck.css';

/**
 * CardDeck - Shows the deck of remaining cards
 *
 * @param {number} cardsRemaining - Number of cards left in deck
 * @param {object} drawingCard - Card being drawn (triggers animation)
 * @param {boolean} isDrawing - Whether a card is currently being drawn
 */
export function CardDeck({ cardsRemaining, drawingCard = null, isDrawing = false }) {
  const [animatingCard, setAnimatingCard] = useState(null);

  useEffect(() => {
    if (drawingCard && isDrawing) {
      setAnimatingCard(drawingCard);

      // Clear after animation completes
      const timer = setTimeout(() => {
        setAnimatingCard(null);
      }, 2000); // Match animation duration

      return () => clearTimeout(timer);
    }
  }, [drawingCard, isDrawing]);

  // Create visual stack effect (show 3-5 cards stacked)
  const stackCount = Math.min(cardsRemaining, 5);

  return (
    <div className="card-deck-container">
      {/* The deck stack */}
      <div className="card-deck-stack">
        {cardsRemaining > 0 ? (
          Array.from({ length: stackCount }).map((_, index) => (
            <div
              key={index}
              className="deck-card-layer"
              style={{
                '--layer-index': index,
                zIndex: stackCount - index,
              }}
            >
              <Card
                cardData={{ name: 'Card Back' }}
                isFaceUp={false}
                showModal={false}
                size="medium"
              />
            </div>
          ))
        ) : (
          <div className="empty-deck">
            <div className="empty-deck-text">Deck Empty</div>
          </div>
        )}
      </div>

      {/* Cards remaining counter */}
      <div className="deck-counter">
        <span className="deck-counter-number">{cardsRemaining}</span>
        <span className="deck-counter-label">cards</span>
      </div>

      {/* Animating card (being drawn) */}
      {animatingCard && (
        <div className="drawing-card-animation">
          <Card
            cardData={animatingCard}
            isFaceUp={false}
            showModal={false}
            size="medium"
          />
        </div>
      )}
    </div>
  );
}
