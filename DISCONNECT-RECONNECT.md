# Player Disconnect & Reconnect Implementation

## Overview

This document describes how the game handles player disconnections and reconnections to maintain game state consistency across all clients.

## Problem Solved

Previously, when a player disconnected:
- Remaining players saw different game states
- Player avatars would disappear or move incorrectly
- Won cards display would desync between players
- Reconnecting player could cause state corruption

## Current Implementation

### Server-Side Logic

#### Disconnect Detection
**Location:** [server/src/server.js:366-390](server/src/server.js#L366-L390)

When a player's socket disconnects:
1. Server checks if the game is in progress (not in WAITING phase)
2. If game in progress:
   - Player **remains in the game** (not removed from player list)
   - Socket mapping is removed: `playerRooms.delete(socket.id)`
   - Server emits `player_disconnected` event to all remaining players
   - Event includes updated `publicState` with disconnected player still in game
3. If game not started:
   - Player is removed normally via `roomManager.leaveRoom()`

#### Rejoin Detection
**Location:** [server/src/services/roomManager.js:61-114](server/src/services/roomManager.js#L61-L114)

When `join_room` is called:
1. Server checks if a player with matching name (case-insensitive) exists in game
2. If game NOT in progress and player doesn't exist:
   - Throws error: "Game already in progress" (prevents new players joining mid-game)
3. If player exists and game in progress:
   - **REJOIN PATH**: Updates player's socket ID from old to new
   - Updates all game state references (host, currentTurnPlayerId, swapWinner, etc.)
   - If phase is 'auction': calls `game.restartCurrentAuction()`
   - Returns `{ game, roundWasReset: true }`

#### Round Reset on Rejoin
**Location:** [server/src/models/game.js:140-177](server/src/models/game.js#L140-L177)

The `restartCurrentAuction()` method:
- Clears all player bids: `player.currentBid = []`
- Resets all pass statuses: `player.hasPassed = false`
- Keeps the same card being auctioned (doesn't draw new card)
- Resets auction state to starting player
- Resets highest bid to 0

**Server Event Emission:** [server/src/server.js:144-149](server/src/server.js#L144-L149)
```javascript
if (roundWasReset) {
  io.to(sanitizedCode).emit('round_reset', {
    playerName: sanitizedName
  });
}
```

### Client-Side Logic

#### State Management
**Location:** [client/src/App.jsx:27](client/src/App.jsx#L27)

Added state variable:
```javascript
const [gameDisconnected, setGameDisconnected] = useState(false);
```

#### Event Listeners
**Location:** [client/src/App.jsx:71-80](client/src/App.jsx#L71-L80)

```javascript
// When any player disconnects
socketService.on('player_disconnected', ({ publicState }) => {
  setGameState(publicState);  // Update with server's authoritative state
  setGameDisconnected(true);   // Trigger UI lockdown
});

// When disconnected player rejoins
socketService.on('round_reset', ({ playerName }) => {
  setRoundReset({ playerName, timestamp: Date.now() });
  setGameDisconnected(false);  // Clear lockdown
});
```

#### UI Lockdown During Disconnect
**Location:** [client/src/components/GameScreen.jsx:19-20](client/src/components/GameScreen.jsx#L19-L20)

All interaction handlers check `isInteractionDisabled`:
- `handleMoneyClick` - Money card selection disabled
- `handlePlaceBid` - Bid placement disabled
- `handlePass` - Passing disabled
- `handleCardClick` - Card swap selection disabled
- `handleConfirmSwap` / `handleSkipSwap` - Swap actions disabled
- `handleLuxuryCardClick` / `handleConfirmDiscard` - Discard actions disabled

#### Visual Feedback

**Disconnected Overlay:** [client/src/components/GameScreen.jsx:138-145](client/src/components/GameScreen.jsx#L138-L145)
```jsx
{gameDisconnected && (
  <div className="disconnected-overlay">
    <div className="disconnected-message">
      <span className="disconnected-icon">⚠️</span>
      <span className="disconnected-text">
        Player disconnected - Waiting for reconnection...
      </span>
    </div>
  </div>
)}
```

**CSS Styling:** [client/src/styles/App.css:240-302](client/src/styles/App.css#L240-L302)
- Entire game screen: 50% opacity
- All interactions disabled via `pointer-events: none`
- Leave Game button remains clickable: `pointer-events: auto`
- Pulsing red warning message with blinking icon

**Round Reset Animation:** [client/src/components/GameScreen.jsx:22-44](client/src/components/GameScreen.jsx#L22-L44)

When `round_reset` event fires:
1. Sets `isResetting` state to true (adds `.resetting` class)
2. CSS transitions opacity to 0 over 500ms
3. After 500ms, sets `isResetting` to false
4. CSS transitions opacity back to 1 over 500ms
5. Shows blue banner with player name for 4 seconds

## Event Flow Diagram

```
Player Disconnects
    ↓
Server: socket.on('disconnect')
    ↓
Game in progress? → YES
    ↓
Keep player in game.players[]
Remove from playerRooms map
    ↓
Emit 'player_disconnected' to room
    ↓
All Clients: Receive publicState
    ↓
UI: Show red warning overlay
UI: Set opacity 50%, disable clicks
UI: Keep all player avatars visible
    ↓
[Waiting for rejoin...]
    ↓
Player Reconnects (same name)
    ↓
Server: join_room event
    ↓
roomManager.joinRoom() detects rejoin
    ↓
Update player.id to new socket.id
Call game.restartCurrentAuction()
    ↓
Emit 'round_reset' event
Emit 'state_update' event
    ↓
All Clients: Receive events
    ↓
UI: Clear disconnected state
UI: Fade out (500ms)
UI: Fade in (500ms)
UI: Show "Round reset" banner (4s)
    ↓
Game continues from auction start
```

## Key Files Modified

### Server
- `server/src/server.js:144-149` - Emit round_reset event
- `server/src/server.js:386-389` - Emit player_disconnected event
- `server/src/services/roomManager.js:61-114` - Rejoin logic
- `server/src/services/roomManager.js:65-68` - Prevent new players joining mid-game
- `server/src/models/game.js:140-177` - Round reset logic

### Client
- `client/src/App.jsx:27` - gameDisconnected state
- `client/src/App.jsx:71-80` - Event listeners
- `client/src/components/GameScreen.jsx:9-20` - Interaction disabled flag
- `client/src/components/GameScreen.jsx:22-44` - Reset animation
- `client/src/components/GameScreen.jsx:46-138` - Disabled interaction handlers
- `client/src/components/GameScreen.jsx:138-145` - Disconnect overlay
- `client/src/styles/App.css:240-302` - Disconnect/reset styling

### Tests
- `server/test/roomManager.test.js:43-57` - Updated for new return value

## Testing Scenarios

### Test 1: Player Disconnects During Auction
1. Start a game with 3+ players
2. Begin an auction
3. Close one player's browser tab
4. Verify remaining players see:
   - Red warning overlay
   - 50% opacity on game screen
   - All player avatars still visible
   - All interactions disabled (except Leave)

### Test 2: Player Rejoins
1. Continue from Test 1
2. Rejoin with same player name
3. Verify all players see:
   - Fade out animation (500ms)
   - Fade in animation (500ms)
   - Blue "Round reset" banner
   - Game interactive again
   - Auction restarted (bids cleared)

### Test 3: New Player Cannot Join Mid-Game
1. Start a game with 3 players
2. Try joining with a new name
3. Verify error: "Game already in progress"

### Test 4: Multiple Disconnects
1. Have two players disconnect
2. Verify both can rejoin independently
3. Verify round resets on each rejoin

## Known Limitations

1. **No reconnect timeout**: Players can disconnect indefinitely
   - Future: Could add a 5-minute timeout before removing player

2. **Round always resets**: Even if player rejoins before their turn
   - Future: Could preserve round state if no turns taken since disconnect

3. **No partial reconnect**: All players must wait for full rejoin
   - This is intentional to ensure state consistency

4. **Disconnected state shared**: If ANY player disconnects, ALL players locked
   - This prevents state desync and race conditions

## Future Improvements

1. **Reconnect Timer**: Show countdown in UI (e.g., "2:45 remaining to rejoin")
2. **Auto-remove after timeout**: Remove player if not rejoined in 5 minutes
3. **Partial state preservation**: Don't reset if no bids placed yet
4. **Disconnect notification**: Show which specific player disconnected
5. **Connection quality indicator**: Show websocket health/latency
6. **Auto-reconnect**: Client could attempt automatic reconnection
7. **Pause game option**: Host could manually pause while waiting

## Debugging

### Server Logs
When debugging disconnect/reconnect issues, look for these log messages:
```
Player ${socket.id} disconnected from active game ${roomCode} (can rejoin)
${playerName} rejoining room ${roomCode} (old: ${oldId}, new: ${newId})
Auction restarted due to ${playerName} rejoining
```

### Client Logs
Enable in browser console:
```javascript
// Check if event listeners are attached
window.socketService.listeners('player_disconnected')
window.socketService.listeners('round_reset')

// Check current game state
console.log(gameState.players)  // Should show all players
console.log(gameDisconnected)   // Should be true/false
```

### Common Issues

**Players see different avatar positions:**
- Check that all clients received `player_disconnected` event
- Verify `publicState` has all players in same order
- Server should NOT remove disconnected player from game.players[]

**UI not locking on disconnect:**
- Check `gameDisconnected` state is set to true
- Verify `isInteractionDisabled` flag propagates to handlers
- Check CSS `.disconnected` class is applied

**Round not resetting on rejoin:**
- Verify `roundWasReset` flag is true in server response
- Check `round_reset` event is emitted
- Confirm `game.restartCurrentAuction()` is called

## References

- Socket.io disconnect handling: https://socket.io/docs/v4/server-socket-instance/#disconnect
- State synchronization patterns: Keep authoritative state on server
- Reconnection best practices: Allow rejoins only with matching identity
