# Socket.IO API Reference

Complete reference for all socket events in the Low Society game server.

---

## Table of Contents

- [Connection Events](#connection-events)
- [Room Management](#room-management)
- [Game Control](#game-control)
- [Auction Events](#auction-events)
- [Special Card Effects](#special-card-effects)
- [State Events (Server → Client)](#state-events-server--client)
- [Error Handling](#error-handling)

---

## Connection Events

### `connect`
**Direction:** Server → Client (automatic)

Emitted automatically when client successfully connects to the server.

**Client receives:** Connection confirmation with socket ID

**Example:**
```javascript
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

---

### `disconnect`
**Direction:** Client → Server (automatic)

Emitted when client disconnects (intentional or network failure).

**Server behavior:**
- If game not started: Remove player from room
- If game started: Keep player in game (can rejoin)

**Example:**
```javascript
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

---

## Room Management

### `create_room` (Client → Server)

Create a new game room.

**Request:**
```typescript
{
  playerName: string,    // 1-20 chars, alphanumeric + spaces/underscore/dash
  aiEnabled?: boolean    // Optional, default: true
}
```

**Response (callback):**
```typescript
{
  success: true,
  roomCode: string,      // 4-character room code
  publicState: PublicState,
  privateState: PrivateState
}
```

**Errors:**
- `"Player name is required"` - Name missing or empty
- `"Player name cannot be empty"` - Name is just whitespace
- `"Player name too long (max 20 characters)"` - Name exceeds limit
- `"Player name contains invalid characters"` - Invalid characters used

**Example:**
```javascript
socket.emit('create_room',
  {
    playerName: 'Alice',
    aiEnabled: true
  },
  (response) => {
    if (response.success) {
      console.log('Room created:', response.roomCode);
      console.log('Public state:', response.publicState);
      console.log('Your cards:', response.privateState.moneyHand);
    } else {
      console.error('Error:', response.error);
    }
  }
);
```

**Broadcasts:**
- `state_update` - Sent to room when AI players are added

---

### `join_room` (Client → Server)

Join an existing game room.

**Request:**
```typescript
{
  roomCode: string,      // 4-character room code
  playerName: string     // 1-20 chars, alphanumeric + spaces/underscore/dash
}
```

**Response (callback):**
```typescript
{
  success: true,
  roomCode: string,
  publicState: PublicState,
  privateState: PrivateState
}
```

**Errors:**
- `"Room code is required"` - Code missing
- `"Room code must be 4 characters"` - Invalid length
- `"Room code must be alphanumeric"` - Invalid characters
- `"Room [code] not found"` - Room doesn't exist
- `"Room is full (max 5 players)"` - Room at capacity
- `"Player name is required"` - Name validation errors (see create_room)

**Example:**
```javascript
socket.emit('join_room',
  {
    roomCode: 'ABC1',
    playerName: 'Bob'
  },
  (response) => {
    if (response.success) {
      console.log('Joined room:', response.roomCode);
    }
  }
);
```

**Broadcasts:**
- `round_reset` - If rejoining player causes auction restart
- `state_update` - Room state with new player
- `private_state_update` - To all players (if auction was reset)

---

### `leave_room` (Client → Server)

Leave the current room.

**Request:**
```typescript
{} // No parameters required
```

**Response (callback):**
```typescript
{
  success: true
}
```

**Example:**
```javascript
socket.emit('leave_room', {}, (response) => {
  console.log('Left room');
});
```

**Broadcasts:**
- `player_left` - Sent to remaining players in room

---

## Game Control

### `start_game` (Client → Server)

Start the game (host only).

**Request:**
```typescript
{
  aiEnabled?: boolean,      // Optional, default: true
  spectatorMode?: boolean   // Optional, default: false
}
```

**Response (callback):**
```typescript
{
  success: true
}
```

**Errors:**
- `"You are not in a room"` - Player not in any room
- `"Room [code] not found"` - Room state corrupted
- `"Only the host can start the game"` - Non-host tried to start
- `"Need at least 3 players to start"` - Not enough players (when AI disabled)

**Example:**
```javascript
socket.emit('start_game',
  {
    aiEnabled: true,
    spectatorMode: false
  },
  (response) => {
    if (response.success) {
      console.log('Game started!');
    }
  }
);
```

**Broadcasts:**
- `game_started` - To all players with public state
- `private_state_update` - To each player with their money hand

**Notes:**
- If `aiEnabled: true`, fills room to 5 players with AI
- If `spectatorMode: true`, removes all players and adds 5 AI players

---

### `get_state` (Client → Server)

Get current game state.

**Request:**
```typescript
{} // No parameters required
```

**Response (callback):**
```typescript
{
  success: true,
  publicState: PublicState,
  privateState: PrivateState
}
```

**Errors:**
- `"You are not in a room"` - Player not in any room
- `"Room [code] not found"` - Room state corrupted

**Example:**
```javascript
socket.emit('get_state', {}, (response) => {
  if (response.success) {
    console.log('Current phase:', response.publicState.phase);
    console.log('My money:', response.privateState.moneyHand);
  }
});
```

---

## Auction Events

### `place_bid` (Client → Server)

Place a bid in the current auction.

**Request:**
```typescript
{
  moneyCardIds: string[]   // Array of money card IDs to bid
}
```

**Response (callback):**
```typescript
{
  success: true,
  bidTotal: number         // Total value of the bid
}
```

**Errors:**
- `"You are not in a room"` - Player not in any room
- `"Room [code] not found"` - Room state corrupted
- `"Money card IDs must be an array"` - Invalid parameter type
- `"Must select at least one money card"` - Empty array
- `"Cannot bid more than 12 cards"` - Too many cards
- `"Invalid money card ID at index [i]"` - Invalid card ID
- `"Player not found"` - Player ID invalid
- `"Not your turn"` - Wrong player's turn
- `"You have already passed"` - Player already passed
- `"Bid must be higher than current bid"` - Bid too low

**Example:**
```javascript
socket.emit('place_bid',
  {
    moneyCardIds: ['card1', 'card2', 'card3']
  },
  (response) => {
    if (response.success) {
      console.log('Bid placed:', response.bidTotal);
    }
  }
);
```

**Broadcasts:**
- `bid_placed` - To all players with public state and bid info
- `private_state_update` - To bidder with updated money hand

---

### `pass` (Client → Server)

Pass on the current auction.

**Request:**
```typescript
{} // No parameters required
```

**Response (callback):**
```typescript
{
  success: true
}
```

**Errors:**
- `"You are not in a room"` - Player not in any room
- `"Room [code] not found"` - Room state corrupted
- `"Player not found"` - Player ID invalid
- `"Not your turn"` - Wrong player's turn
- `"You have already passed"` - Player already passed

**Example:**
```javascript
socket.emit('pass', {}, (response) => {
  if (response.success) {
    console.log('Passed on auction');
  }
});
```

**Broadcasts:**
- `player_passed` - To all players with public state
- `private_state_update` - To all players (money may change)

---

## Special Card Effects

### `execute_card_swap` (Client → Server)

Execute Pawn Shop Trade card swap (or skip).

**Request:**
```typescript
{
  player1Id: string | null,
  card1Id: string | null,
  player2Id: string | null,
  card2Id: string | null
}
// All null to skip, all provided to swap
```

**Response (callback):**
```typescript
{
  success: true
}
```

**Errors:**
- `"You are not in a room"` - Player not in any room
- `"Room [code] not found"` - Room state corrupted
- `"Card swap requires all parameters or all null to skip"` - Partial parameters
- `"Player IDs must be strings"` - Invalid type
- `"Card IDs must be strings"` - Invalid type
- `"Cannot swap a card with itself"` - Same player and card

**Example (swap):**
```javascript
socket.emit('execute_card_swap',
  {
    player1Id: 'player1',
    card1Id: 'card1',
    player2Id: 'player2',
    card2Id: 'card2'
  },
  (response) => {
    console.log('Cards swapped');
  }
);
```

**Example (skip):**
```javascript
socket.emit('execute_card_swap',
  {
    player1Id: null,
    card1Id: null,
    player2Id: null,
    card2Id: null
  },
  (response) => {
    console.log('Skipped swap');
  }
);
```

**Broadcasts:**
- `cards_swapped` - To all players with swap details

---

### `discard_luxury_card` (Client → Server)

Discard a luxury card (Repo Man effect).

**Request:**
```typescript
{
  cardId: string   // ID of luxury card to discard
}
```

**Response (callback):**
```typescript
{
  success: true
}
```

**Errors:**
- `"You are not in a room"` - Player not in any room
- `"Room [code] not found"` - Room state corrupted
- `"Invalid card ID"` - Missing, empty, or non-string card ID

**Example:**
```javascript
socket.emit('discard_luxury_card',
  {
    cardId: 'luxury-card-1'
  },
  (response) => {
    console.log('Card discarded');
  }
);
```

**Broadcasts:**
- `luxury_card_discarded` - To all players with discard info

---

## State Events (Server → Client)

These events are emitted by the server to update clients.

### `state_update`

General state update broadcast to all players in a room.

**Data:**
```typescript
{
  publicState: PublicState
}
```

**When emitted:**
- AI players added to room
- Player joins room
- Phase changes

---

### `private_state_update`

Private state update sent to individual player.

**Data:**
```typescript
{
  privateState: PrivateState
}
```

**When emitted:**
- After placing bid
- After passing
- Game starts
- Money changes

---

### `game_started`

Emitted when game starts.

**Data:**
```typescript
{
  publicState: PublicState
}
```

---

### `bid_placed`

Emitted when any player places a bid.

**Data:**
```typescript
{
  publicState: PublicState,
  playerId: string,
  bidTotal: number
}
```

---

### `player_passed`

Emitted when a player passes.

**Data:**
```typescript
{
  publicState: PublicState,
  playerId: string
}
```

---

### `player_joined`

Emitted when a player joins the room.

**Data:**
```typescript
{
  publicState: PublicState,
  playerName: string
}
```

---

### `player_left`

Emitted when a player leaves.

**Data:**
```typescript
{
  publicState: PublicState
}
```

---

### `player_disconnected`

Emitted when a player disconnects during an active game.

**Data:**
```typescript
{
  playerId: string,
  publicState: PublicState
}
```

---

### `round_reset`

Emitted when auction is restarted (e.g., player rejoins).

**Data:**
```typescript
{
  playerName: string
}
```

---

### `cards_swapped`

Emitted when cards are swapped.

**Data:**
```typescript
{
  publicState: PublicState,
  player1Id: string | null,
  card1Id: string | null,
  player2Id: string | null,
  card2Id: string | null
}
```

---

### `luxury_card_discarded`

Emitted when a luxury card is discarded.

**Data:**
```typescript
{
  publicState: PublicState,
  playerId: string,
  cardId: string
}
```

---

## Error Handling

All errors follow this format:

**Error Response:**
```typescript
{
  success: false,
  error: string,        // Human-readable error message
  type: string,         // Error category
  timestamp: number     // Unix timestamp
}
```

### Error Types

- `"validation"` - Input validation failed
- `"not_found"` - Resource not found (room, player, etc.)
- `"permission"` - Permission denied (not host, not your turn, etc.)
- `"game_state"` - Invalid game state (already started, not enough players, etc.)
- `"internal"` - Internal server error

### Example Error Handling

```javascript
socket.emit('place_bid',
  { moneyCardIds: ['invalid'] },
  (response) => {
    if (!response.success) {
      console.error('Error type:', response.type);
      console.error('Error message:', response.error);

      switch (response.type) {
        case 'validation':
          // Show validation error to user
          break;
        case 'permission':
          // Show permission error
          break;
        default:
          // Generic error handling
      }
    }
  }
);
```

---

## Data Types

### PublicState

```typescript
interface PublicState {
  roomCode: string;
  phase: 'waiting' | 'starting' | 'auction' | 'card_swap' | 'discard_luxury' | 'game_over';
  playerCount: number;
  players: PublicPlayer[];
  currentCard: Card | null;
  deckSize: number;
  currentAuction: Auction | null;
  results: GameResults | null;
  host: string;
  discardingPlayerId: string | null;
}
```

### PrivateState

```typescript
interface PrivateState {
  moneyHand: MoneyCard[];
  removedBill: MoneyCard | null;
  currentBid: MoneyCard[];
}
```

### PublicPlayer

```typescript
interface PublicPlayer {
  id: string;
  name: string;
  isAI: boolean;
  remainingMoney: number;
  wonCardsCount: number;
  wonCards: Card[];
  hasPassed: boolean;
  currentBidTotal: number;
}
```

### Card

```typescript
interface Card {
  id: string;
  name: string;
  type: 'luxury' | 'prestige' | 'disgrace' | 'special';
  value?: number;
  effectDescription?: string;
}
```

### MoneyCard

```typescript
interface MoneyCard {
  id: string;
  value: number;  // 1, 2, 3, 4, 6, 8, 10, 12, 15, 20, 25
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Future versions may add:
- Max 10 events per second per client
- Max 100 events per minute per client

---

## WebSocket URL

**Development:** `http://localhost:3003`
**Production:** Configure via `config.js`

**Connection example:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3003', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
```

---

## See Also

- [Developer Guide](DEVELOPER-GUIDE.md)
- [Architecture Overview](../PHASE-3-ARCHITECTURE-IMPROVEMENTS.md)
- [Error Handling](../server/src/utils/errorHandler.js)
