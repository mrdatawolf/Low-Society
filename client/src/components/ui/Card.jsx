import { useState } from 'react';
import '../../styles/Card.css';

/**
 * Card Component
 *
 * Modular card component that supports:
 * - Custom card images (when provided)
 * - Placeholder card designs (default)
 * - Face up/face down states
 * - Click to view details in modal
 * - Reveal and collection animations
 *
 * @param {object} cardData - Card data (name, type, value, description, etc.)
 * @param {string} frontImage - Optional custom front image URL
 * @param {string} backImage - Optional custom back image URL
 * @param {boolean} isFaceUp - Whether card is face up
 * @param {boolean} showModal - Whether to show modal on click
 * @param {string} size - Card size: 'small', 'medium', 'large' (default: 'medium')
 * @param {function} onClick - Optional click handler
 * @param {string} className - Additional CSS classes
 * @param {boolean} animateReveal - Trigger reveal animation (default: false)
 * @param {boolean} animateCollect - Trigger collection animation (default: false)
 */
export function Card({
  cardData,
  frontImage = null,
  backImage = null,
  isFaceUp = true,
  showModal = false,
  size = 'medium',
  onClick = null,
  className = '',
  animateReveal = false,
  animateCollect = false
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(cardData);
    } else if (showModal && isFaceUp) {
      setModalOpen(true);
    }
  };

  const getCardTypeBadge = (type) => {
    const typeMap = {
      luxury: 'badge-luxury',
      prestige: 'badge-prestige',
      disgrace: 'badge-disgrace',
      special: 'badge-special'
    };
    return typeMap[type] || 'badge-luxury';
  };

  const getCardTypeColor = (type) => {
    const colorMap = {
      luxury: '#228b22',
      prestige: '#d4af37',
      disgrace: '#c41e3a',
      special: '#8b4789'
    };
    return colorMap[type] || '#228b22';
  };

  // Build animation classes
  const animationClasses = [
    animateReveal ? 'revealing' : '',
    animateCollect ? 'collecting' : ''
  ].filter(Boolean).join(' ');

  return (
    <>
      <div
        className={`card-component ${size} ${isFaceUp ? 'face-up' : 'face-down'} ${animationClasses} ${className}`}
        onClick={handleClick}
        style={{ cursor: (onClick || showModal) ? 'pointer' : 'default' }}
      >
        {isFaceUp ? (
          // Card front
          frontImage ? (
            <img src={frontImage} alt={cardData?.name || 'Card'} className="card-image" />
          ) : (
            // Placeholder front design
            <div className="card-front-placeholder" style={{ borderColor: getCardTypeColor(cardData?.type) }}>
              <div className={`card-type-indicator ${getCardTypeBadge(cardData?.type)}`}>
                {cardData?.type?.substring(0, 1).toUpperCase()}
              </div>
              <div className="card-content">
                <div className="card-name-mini">{cardData?.name || 'Card'}</div>
                {cardData?.value && (
                  <div className="card-value-large" style={{ color: getCardTypeColor(cardData?.type) }}>
                    {cardData.value}
                  </div>
                )}
                {cardData?.multiplier && (
                  <div className="card-multiplier">
                    {cardData.multiplier}x
                  </div>
                )}
              </div>
              {showModal && (
                <div className="card-tap-hint">Tap for details</div>
              )}
            </div>
          )
        ) : (
          // Card back
          backImage ? (
            <img src={backImage} alt="Card back" className="card-image" />
          ) : (
            // Placeholder back design
            <div className="card-back-placeholder">
              <div className="card-back-pattern">
                <div className="back-logo">LS</div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Modal for card details */}
      {modalOpen && isFaceUp && (
        <CardModal
          cardData={cardData}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

/**
 * CardModal Component
 * Shows full card details in an overlay
 */
function CardModal({ cardData, onClose }) {
  const getCardTypeBadge = (type) => {
    const typeMap = {
      luxury: 'badge-luxury',
      prestige: 'badge-prestige',
      disgrace: 'badge-disgrace',
      special: 'badge-special'
    };
    return typeMap[type] || 'badge-luxury';
  };

  return (
    <div className="card-modal-overlay" onClick={onClose}>
      <div className="card-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>

        <div className={`card-type-badge ${getCardTypeBadge(cardData.type)}`}>
          {cardData.type}
        </div>

        <h2 className="modal-card-name">{cardData.name}</h2>

        {cardData.description && (
          <p className="modal-card-description">{cardData.description}</p>
        )}

        {cardData.value && (
          <div className="modal-card-value">
            <span className="value-label">Value:</span>
            <span className="value-number">{cardData.value}</span>
          </div>
        )}

        {cardData.multiplier && (
          <div className="modal-card-multiplier">
            <span className="multiplier-label">Multiplier:</span>
            <span className="multiplier-number">{cardData.multiplier}x</span>
          </div>
        )}

        {cardData.effect === 'faux-pas' && (
          <div className="modal-effect danger">
            <strong>Effect:</strong> Discard one luxury item!
          </div>
        )}

        {cardData.effect === 'passe' && (
          <div className="modal-effect danger">
            <strong>Effect:</strong> -5 Status Points
          </div>
        )}

        {cardData.effect === 'scandale' && (
          <div className="modal-effect danger">
            <strong>Effect:</strong> Halves Your Status!
          </div>
        )}

        {cardData.effect === 'card-swap' && (
          <div className="modal-effect special">
            <strong>Effect:</strong> Swap two cards between any players
          </div>
        )}
      </div>
    </div>
  );
}
