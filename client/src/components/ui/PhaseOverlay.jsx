/**
 * PhaseOverlay Component
 *
 * Visual overlays for different game phases and transitions
 * Provides clear feedback for game state changes
 */

import { useEffect, useState } from 'react';
import '../../styles/PhaseOverlay.css';

/**
 * Auction Type Banner
 * Shows whether players are bidding to win or avoid
 */
export function AuctionTypeBanner({ auctionType, visible = true }) {
  if (!visible || !auctionType) return null;

  const isReverse = auctionType === 'reverse';

  return (
    <div className={`auction-type-banner ${isReverse ? 'reverse' : 'normal'} ${visible ? 'visible' : ''}`}>
      <div className="banner-content">
        <div className="banner-icon">
          {isReverse ? '⚠️' : '✨'}
        </div>
        <div className="banner-text">
          <div className="banner-title">
            {isReverse ? 'BIDDING TO AVOID' : 'BIDDING TO WIN'}
          </div>
          <div className="banner-subtitle">
            {isReverse ? 'Lowest bid takes the card' : 'Highest bid takes the card'}
          </div>
        </div>
        <div className="banner-icon">
          {isReverse ? '⚠️' : '✨'}
        </div>
      </div>
    </div>
  );
}

/**
 * Pawn Shop Trade Overlay
 * Full-screen overlay for card swap phase
 */
export function PawnShopTradeOverlay({ visible, onClose }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldShow(true);
      setIsAnimating(true);
      const fadeTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000); // Show for 2 seconds then start fade

      const hideTimer = setTimeout(() => {
        setShouldShow(false);
      }, 2500); // Hide completely after fade (2s + 0.5s fade)

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setShouldShow(false);
      setIsAnimating(false);
    }
  }, [visible]);

  if (!shouldShow) return null;

  return (
    <div className={`phase-overlay pawn-shop ${isAnimating ? 'animating' : 'fading'}`}>
      <div className="overlay-content">
        <div className="overlay-icon">🔄</div>
        <div className="overlay-title">Pawn Shop Trade</div>
        <div className="overlay-subtitle">Winner can swap two cards between players</div>
      </div>
    </div>
  );
}

/**
 * Repo Man Overlay
 * Full-screen overlay for discard luxury phase
 */
export function RepoManOverlay({ visible, playerName }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldShow(true);
      setIsAnimating(true);
      const fadeTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000); // Show for 2 seconds then start fade

      const hideTimer = setTimeout(() => {
        setShouldShow(false);
      }, 2500); // Hide completely after fade (2s + 0.5s fade)

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setShouldShow(false);
      setIsAnimating(false);
    }
  }, [visible]);

  if (!shouldShow) return null;

  return (
    <div className={`phase-overlay repo-man ${isAnimating ? 'animating' : 'fading'}`}>
      <div className="overlay-content">
        <div className="overlay-icon">🚨</div>
        <div className="overlay-title">Repo Man!</div>
        <div className="overlay-subtitle">
          {playerName} must discard a luxury item
        </div>
      </div>
    </div>
  );
}

/**
 * Game Starting Overlay
 * Countdown overlay when game begins
 */
export function GameStartingOverlay({ visible, countdown = 3 }) {
  if (!visible) return null;

  return (
    <div className="phase-overlay game-starting animating">
      <div className="overlay-content">
        <div className="overlay-title">Game Starting...</div>
        <div className="countdown-number">{countdown}</div>
      </div>
    </div>
  );
}

/**
 * Round Transition Overlay
 * Shows round number between rounds
 */
export function RoundTransitionOverlay({ visible, roundNumber }) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible && !isAnimating) return null;

  return (
    <div className={`phase-overlay round-transition ${isAnimating ? 'animating' : 'fading'}`}>
      <div className="overlay-content">
        <div className="overlay-title">Round {roundNumber}</div>
      </div>
    </div>
  );
}

/**
 * Winner Announcement Overlay
 * Shows when a player wins the game
 */
export function WinnerAnnouncementOverlay({ visible, winnerName, isMe }) {
  if (!visible) return null;

  return (
    <div className="phase-overlay winner-announcement animating">
      <div className="overlay-content">
        <div className="overlay-icon">🏆</div>
        <div className="overlay-title">
          {isMe ? 'You Win!' : `${winnerName} Wins!`}
        </div>
        <div className="overlay-subtitle">
          {isMe ? 'Congratulations!' : 'Better luck next time!'}
        </div>
      </div>
    </div>
  );
}

/**
 * Turn Indicator
 * Small indicator showing whose turn it is
 */
export function TurnIndicator({ playerName, isMyTurn }) {
  return (
    <div className={`turn-indicator-bar ${isMyTurn ? 'my-turn' : ''}`}>
      <div className="turn-indicator-content">
        {isMyTurn ? (
          <>
            <span className="turn-icon">👉</span>
            <span className="turn-text">Your Turn</span>
            <span className="turn-icon">👈</span>
          </>
        ) : (
          <>
            <span className="turn-text">{playerName}'s Turn</span>
            <span className="turn-spinner">⏳</span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Waiting Overlay
 * Generic waiting message
 */
export function WaitingOverlay({ visible, message = 'Waiting...' }) {
  if (!visible) return null;

  return (
    <div className="waiting-overlay">
      <div className="waiting-content">
        <div className="waiting-spinner">⏳</div>
        <div className="waiting-message">{message}</div>
      </div>
    </div>
  );
}
