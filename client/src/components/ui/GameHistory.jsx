import { useEffect, useRef } from 'react';
import '../../styles/GameHistory.css';

/**
 * GameHistory Component
 *
 * Displays a scrollable log of game events (bids, passes, card wins, round changes)
 * Auto-scrolls to show the latest events
 *
 * @param {Array} events - Array of event objects with { type, message, timestamp, playerId, playerName }
 */
export function GameHistory({ events = [] }) {
  const historyEndRef = useRef(null);

  // Auto-scroll to bottom when new events are added
  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'round_start':
        return '🎴';
      case 'bid':
        return '💰';
      case 'pass':
        return '❌';
      case 'win':
        return '🏆';
      case 'discard':
        return '🗑️';
      case 'swap':
        return '🔄';
      case 'game_start':
        return '🎮';
      case 'game_end':
        return '🎊';
      default:
        return '📝';
    }
  };

  const getEventClass = (type) => {
    switch (type) {
      case 'round_start':
        return 'event-round';
      case 'bid':
        return 'event-bid';
      case 'pass':
        return 'event-pass';
      case 'win':
        return 'event-win';
      case 'discard':
        return 'event-discard';
      case 'swap':
        return 'event-swap';
      case 'game_start':
      case 'game_end':
        return 'event-game';
      default:
        return 'event-default';
    }
  };

  return (
    <div className="game-history">
      <div className="history-header">
        <h3>Game History</h3>
      </div>
      <div className="history-content">
        {events.length === 0 ? (
          <div className="history-empty">
            <p>Game events will appear here</p>
          </div>
        ) : (
          <div className="history-events">
            {events.map((event, index) => (
              <div
                key={`${event.timestamp}-${index}`}
                className={`history-event ${getEventClass(event.type)}`}
              >
                <span className="event-icon">{getEventIcon(event.type)}</span>
                <span className="event-message">{event.message}</span>
              </div>
            ))}
            <div ref={historyEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
