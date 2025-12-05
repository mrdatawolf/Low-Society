import { useState, useEffect } from 'react';
import '../../styles/PlayerAvatar.css';

/**
 * PlayerAvatar Component
 *
 * Modular avatar component that supports:
 * - Custom avatar images (when provided)
 * - Placeholder colored circles with initials (default)
 * - Status indicators (active, passed, turn)
 * - Animations (join, leave, pulse)
 *
 * @param {string} playerName - Player's name
 * @param {string} playerId - Unique player ID
 * @param {string} avatarUrl - Optional custom avatar image URL
 * @param {string} color - Fallback color for placeholder (auto-generated if not provided)
 * @param {number} size - Avatar size in pixels (default: 80)
 * @param {boolean} isActive - Whether this player is active in auction
 * @param {boolean} hasPassed - Whether player has passed
 * @param {boolean} isCurrentTurn - Whether it's this player's turn
 * @param {boolean} isCurrentPlayer - Whether this is the current user
 * @param {boolean} showName - Show name tag below avatar
 * @param {boolean} showStats - Show player stats (money, cards, bid)
 * @param {object} stats - Player stats { money, cards, bid }
 * @param {function} onClick - Optional click handler
 */
export function PlayerAvatar({
  playerName,
  playerId,
  avatarUrl = null,
  color = null,
  size = 80,
  isActive = true,
  hasPassed = false,
  isCurrentTurn = false,
  isCurrentPlayer = false,
  showName = true,
  showStats = false,
  stats = { money: 0, cards: 0, bid: 0 },
  onClick = null,
  className = ''
}) {
  const [isJoining, setIsJoining] = useState(true);

  useEffect(() => {
    // Trigger join animation
    const timer = setTimeout(() => setIsJoining(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Get player initials (first 2 letters of name)
  const getInitials = (name) => {
    return name.substring(0, 2).toUpperCase();
  };

  // Generate color from player ID if not provided
  const getColor = () => {
    if (color) return color;

    // Predefined color palette (Low Society themed)
    const colors = [
      '#d4af37', // Gold
      '#8b4513', // Saddle brown
      '#4a7c4e', // Forest green
      '#c41e3a', // Crimson
      '#8b4789', // Purple
      '#cd7f32', // Bronze
      '#4682b4', // Steel blue
      '#dc143c', // Red
      '#2e8b57', // Sea green
      '#daa520', // Goldenrod
    ];

    // Use playerId to pick consistent color
    const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const avatarColor = getColor();

  return (
    <div
      className={`player-avatar-container ${className} ${isJoining ? 'joining' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Turn indicator arrow */}
      {isCurrentTurn && (
        <div className="turn-indicator">
          <div className="turn-arrow">▼</div>
        </div>
      )}

      {/* Avatar circle */}
      <div
        className={`avatar-circle ${isActive ? 'active' : ''} ${hasPassed ? 'passed' : ''} ${isCurrentTurn ? 'current-turn' : ''} ${isCurrentPlayer ? 'current-player' : ''}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
          backgroundColor: !avatarUrl ? avatarColor : 'transparent',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Show initials if no avatar image */}
        {!avatarUrl && (
          <span className="avatar-initials" style={{ fontSize: `${size * 0.4}px` }}>
            {getInitials(playerName)}
          </span>
        )}

        {/* Status badges */}
        {hasPassed && (
          <div className="status-badge passed-badge">✕</div>
        )}
      </div>

      {/* Player name tag */}
      {showName && (
        <div className="player-name-tag">
          {playerName}
          {isCurrentPlayer && <span className="you-badge">(You)</span>}
        </div>
      )}

      {/* Player stats */}
      {showStats && (
        <div className="player-stats-mini">
          <div className="stat-item">
            <span className="stat-icon">💵</span>
            <span className="stat-value">${stats.money}</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🎯</span>
            <span className="stat-value">${stats.bid}</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🏆</span>
            <span className="stat-value">{stats.cards}</span>
          </div>
        </div>
      )}
    </div>
  );
}
