import { useEffect, useState, useRef } from 'react';
import '../../styles/ChatBubble.css';

/**
 * Chat Bubble Component
 *
 * Displays a speech bubble above player avatars with AI commentary.
 * Automatically fades in, displays for a calculated duration, then fades out.
 *
 * @param {Object} props
 * @param {string} props.playerId - ID of the player speaking
 * @param {string} props.playerName - Name of the player speaking
 * @param {string} props.message - The chat message to display
 * @param {number} props.duration - How long to display in seconds
 * @param {Function} props.onComplete - Callback when bubble finishes
 * @param {string} props.mode - 'tutorial' or 'commentary'
 * @param {string} props.playerPosition - Player's seat position (seat-bottom, seat-left, etc.)
 */
export function ChatBubble({ playerId, playerName, message, duration, onComplete, mode = 'commentary', playerPosition = 'seat-bottom' }) {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const fadeOutTimerRef = useRef(null);
  const completeTimerRef = useRef(null);

  useEffect(() => {
    // Fade in immediately
    setVisible(true);

    // Start fade out before completion
    fadeOutTimerRef.current = setTimeout(() => {
      setFadeOut(true);
    }, (duration - 0.3) * 1000); // Start fade 300ms before end

    // Complete and remove
    completeTimerRef.current = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, duration * 1000);

    return () => {
      if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, [duration, onComplete]);

  const handleSkip = () => {
    // Clear all timers
    if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);

    // Immediately complete
    if (onComplete) {
      onComplete();
    }
  };

  // Determine arrow direction based on player position
  const getArrowDirection = () => {
    const directionMap = {
      'seat-bottom': 'arrow-down',        // Points down
      'seat-left': 'arrow-left',          // Points left
      'seat-top-left': 'arrow-top-left',  // Points top-left
      'seat-top': 'arrow-top',            // Points top (4 players)
      'seat-top-right': 'arrow-top-right',// Points top-right
      'seat-right': 'arrow-right'         // Points right
    };
    return directionMap[playerPosition] || 'arrow-down';
  };

  if (!message) return null;

  const arrowDirection = getArrowDirection();

  return (
    <div
      className={`chat-bubble ${mode} ${visible ? 'visible' : ''} ${fadeOut ? 'fade-out' : ''}`}
      data-player-id={playerId}
    >
      <div className={`chat-bubble-arrow ${arrowDirection}`}></div>
      <div className="chat-bubble-header">
        <span className="chat-bubble-player-name">{playerName}</span>
        {mode === 'tutorial' && <span className="chat-bubble-mode-badge">📚</span>}
      </div>
      <div className="chat-bubble-message">{message}</div>
      <button className="skip-chat-btn" onClick={handleSkip} title="Skip chat and continue">
        ⏩ Skip
      </button>
    </div>
  );
}

/**
 * Chat Bubble Container
 *
 * Manages multiple chat bubbles and queues them properly.
 * Only one bubble is shown at a time.
 *
 * @param {Object} props
 * @param {Array} props.messages - Array of chat message objects
 */
export function ChatBubbleContainer({ messages = [] }) {
  const [currentMessage, setCurrentMessage] = useState(null);
  const [messageQueue, setMessageQueue] = useState([]);

  useEffect(() => {
    if (messages.length > 0 && !currentMessage) {
      // Display the first message
      setCurrentMessage(messages[0]);
      setMessageQueue(messages.slice(1));
    }
  }, [messages, currentMessage]);

  const handleComplete = () => {
    if (messageQueue.length > 0) {
      // Show next message in queue
      setCurrentMessage(messageQueue[0]);
      setMessageQueue(messageQueue.slice(1));
    } else {
      // No more messages
      setCurrentMessage(null);
    }
  };

  if (!currentMessage) return null;

  return (
    <div className="chat-bubble-container">
      <ChatBubble
        playerId={currentMessage.playerId}
        playerName={currentMessage.playerName}
        message={currentMessage.message}
        duration={currentMessage.duration}
        onComplete={handleComplete}
        mode={currentMessage.mode}
      />
    </div>
  );
}
