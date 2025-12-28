# AI Companion Players Implementation Plan

## Overview

Add AI companion players that automatically fill empty spots in games, ensuring every game has 3-5 players even if not enough humans join.

## Current State

**Game Requirements:**
- Minimum players: 3
- Maximum players: 5
- Currently: Games can only start with 3+ human players

**Problem:**
- Need 3 human players to start a game
- If only 1-2 players available, no game can start
- Players must wait for others to join

## Proposed Solution

### Auto-Fill with AI Players

When host clicks "Start Game":
1. Check number of human players
2. If < 3 players: Auto-add AI players to reach minimum 3
3. If 3-4 players: Optionally add AI players to reach 5 (configurable)
4. AI players get bot names and play automatically

### AI Player Behavior

**Simple Strategy (MVP):**
- **Standard Auctions (Luxury/Prestige):**
  - Random bid amount (0-3 cards from money hand)
  - 30% chance to pass immediately
  - Bids become more conservative if low on money

- **Reverse Auctions (Disgrace):**
  - Always try to pass immediately
  - If must bid, bid minimum (1 card)

- **Card Swap (Pawn Shop):**
  - Random card selection
  - Slight preference for swapping away disgrace cards

- **Discard Luxury (Repo Man):**
  - Discard lowest-value luxury card

**Advanced Strategy (Future):**
- Track other players' money/cards
- Calculate expected value of cards
- Bid strategically based on game state
- Avoid being poorest player

### Implementation Phases

## Phase 1: Core AI Infrastructure ✓ (Ready to implement)

### Server-Side Changes

**1. AI Player Creation**
- Location: `server/src/services/aiPlayer.js` (new file)
- Create `AIPlayer` class with:
  - `name`: Generated bot name (e.g., "Bot Alice", "Bot Charlie")
  - `id`: Generated socket ID (e.g., "ai_player_1")
  - `isAI`: Boolean flag
  - Decision-making methods

**2. Auto-Fill Logic**
- Location: `server/src/services/roomManager.js`
- Modify `startGame()` method:
  - Check player count
  - Add AI players if needed
  - Generate AI player IDs and add to game

**3. AI Turn Handler**
- Location: `server/src/services/aiPlayer.js`
- Create `handleAITurn()` method:
  - Called when AI player's turn arrives
  - Makes bidding decisions
  - Emits socket events as if human played
  - Add delay (500-1500ms) to simulate thinking

**4. Game State Modifications**
- Location: `server/src/models/game.js`
- Add `isAI` property to player objects
- Modify `addPlayer()` to accept AI flag
- Track AI players separately in game state

### Client-Side Changes

**1. AI Player Indicators**
- Location: `client/src/components/ui/PokerTable.jsx`
- Add visual indicator for AI players (e.g., robot icon 🤖)
- Different styling for AI player avatars

**2. AI Action Notifications**
- Location: `client/src/components/GameScreen.jsx`
- Show messages when AI players bid/pass
- Example: "Bot Alice bid $3"

**3. Lobby Configuration**
- Location: `client/src/components/LobbyScreen.jsx`
- Add toggle: "Fill with AI players" (default: ON)
- Show expected AI count before starting

### File Changes Required

```
CREATE: server/src/services/aiPlayer.js
MODIFY: server/src/services/roomManager.js
MODIFY: server/src/models/game.js
MODIFY: server/src/server.js
MODIFY: client/src/components/LobbyScreen.jsx
MODIFY: client/src/components/ui/PokerTable.jsx
MODIFY: client/src/components/GameScreen.jsx
MODIFY: client/src/styles/App.css
```

## Phase 2: AI Decision Logic (Future)

### Simple AI Personality Types

**Aggressive Bot:**
- Bids high on valuable cards
- Rarely passes
- Willing to spend money early

**Conservative Bot:**
- Bids low/passes often
- Saves money for end game
- Focuses on avoiding disgrace

**Random Bot:**
- Completely random decisions
- Good for testing
- Makes game unpredictable

### Implementation Details

**1. AI Names Pool**
```javascript
const AI_NAMES = [
  'Bot Alice',
  'Bot Bob',
  'Bot Charlie',
  'Bot Diana',
  'Bot Eddie'
];
```

**2. AI Bidding Logic**
```javascript
class AIPlayer {
  decideBid(gameState, privateState) {
    const { currentCard, highestBid, moneyHand } = privateState;

    // Check if reverse auction (disgrace card)
    if (currentCard.type === 'disgrace') {
      return { action: 'pass' };
    }

    // Simple strategy: bid random amount
    const availableMoney = moneyHand.filter(c => c.available);
    if (Math.random() < 0.3) return { action: 'pass' };

    const bidSize = Math.floor(Math.random() * Math.min(3, availableMoney.length));
    const bid = availableMoney.slice(0, bidSize).map(c => c.id);

    return { action: 'bid', cards: bid };
  }
}
```

**3. Turn Processing**
```javascript
async function handleAITurn(game, aiPlayer) {
  // Simulate thinking time
  await delay(Math.random() * 1000 + 500);

  // Make decision
  const privateState = game.getPrivateState(aiPlayer.id);
  const decision = aiPlayer.decideBid(game.getPublicState(), privateState);

  // Execute action
  if (decision.action === 'pass') {
    game.pass(aiPlayer.id);
  } else {
    game.placeBid(aiPlayer.id, decision.cards);
  }

  // Broadcast state update
  io.to(roomCode).emit('state_update', {
    publicState: game.getPublicState()
  });
}
```

## Phase 3: Advanced Features (Future)

### Host Controls
- Toggle AI on/off in lobby
- Select AI difficulty (Easy/Medium/Hard)
- Choose number of AI players (0-4)

### AI Improvements
- **Card Valuation**: AI calculates card worth
- **Money Management**: Tracks remaining money vs cards left
- **Opponent Modeling**: Remembers other players' bidding patterns
- **End Game Strategy**: Ensures not poorest player

### Statistics Tracking
- Win rate for AI vs humans
- Average points scored
- Money management efficiency

## Technical Considerations

### Socket.io with AI Players

**Challenge:** AI players don't have real socket connections

**Solution:**
- Generate fake socket IDs for AI players (e.g., `ai_player_1`)
- Store AI player references in memory
- When AI turn arrives, call AI logic directly
- Emit events on behalf of AI player

### State Synchronization

**AI players must:**
- Receive same game state as humans
- Have private state (money hand, bids)
- Appear identical to human players in publicState
- Follow same game rules and validation

### Turn Management

**When AI turn arrives:**
1. Server detects `currentTurnPlayerId` is an AI
2. Calls `handleAITurn()` instead of waiting for socket event
3. AI makes decision with delay
4. Server processes AI action
5. Broadcasts state update to all players
6. Game continues to next turn

### Disconnect Handling

**AI players never disconnect:**
- No socket to disconnect
- Always available
- No rejoin logic needed

**Human players disconnect:**
- AI players unaffected
- Continue playing normally
- Game state remains consistent

## Testing Strategy

### Unit Tests
```javascript
// test/aiPlayer.test.js
describe('AIPlayer', () => {
  test('should bid on luxury cards', () => {
    const ai = new AIPlayer('Bot Alice');
    const decision = ai.decideBid(gameState, privateState);
    expect(['bid', 'pass']).toContain(decision.action);
  });

  test('should pass on disgrace cards', () => {
    const ai = new AIPlayer('Bot Bob');
    const decision = ai.decideBid(disgraceGameState, privateState);
    // Should strongly prefer passing
  });
});
```

### Integration Tests
- Create game with 1 human, 2 AI players
- Verify AI players take turns automatically
- Verify state updates correctly
- Verify game completes successfully

### UI Tests
- Verify AI player indicators show correctly
- Verify AI bid notifications appear
- Verify lobby shows AI fill option

## User Experience

### Lobby Screen
```
┌─────────────────────────────────┐
│ Room: AB12                      │
│                                 │
│ Players (2/5):                  │
│ • Pat (Host)                    │
│ • Luke                          │
│                                 │
│ [✓] Fill with AI Players        │
│ (Will add 1-3 AI players)       │
│                                 │
│ [Start Game]                    │
└─────────────────────────────────┘
```

### Game Screen
```
AI player indicator on avatar:
┌──────────┐
│   🤖     │
│ Bot Alice│
│  $12     │
└──────────┘

Notification when AI bids:
┌─────────────────────────────┐
│ Bot Alice bid $3            │
└─────────────────────────────┘
```

## Configuration

### Game Settings
Location: `server/src/models/game.js` or `config.js`

```javascript
const AI_CONFIG = {
  enabled: true,
  autoFill: true,
  minPlayers: 3,
  maxAIPlayers: 4,
  thinkingTimeMs: { min: 500, max: 1500 },
  difficulty: 'easy' // 'easy', 'medium', 'hard'
};
```

### AI Difficulty Levels

**Easy:**
- Random decisions
- No strategy
- 50% pass rate

**Medium:**
- Basic card valuation
- Money management
- 30% pass rate

**Hard:**
- Advanced strategy
- Opponent modeling
- Optimal play
- 20% pass rate

## Migration Path

### Step 1: Infrastructure (Week 1)
- Create AIPlayer class
- Add auto-fill logic
- Implement turn handling
- Basic random decisions

### Step 2: UI Integration (Week 1)
- Add AI indicators
- Add lobby toggle
- Add bid notifications
- Test with 1 human + AI

### Step 3: Strategy (Week 2)
- Implement basic strategy
- Add card valuation
- Add money management
- Balance difficulty

### Step 4: Polish (Week 2)
- Add AI personalities
- Add difficulty settings
- Add statistics
- Performance optimization

## Success Metrics

### MVP Success:
- ✓ Games can start with 1 player + AI
- ✓ AI players take turns automatically
- ✓ AI players follow game rules
- ✓ Games complete successfully
- ✓ No noticeable lag/delay

### Advanced Success:
- ✓ AI plays competitively
- ✓ Win rate: AI 20-40%, Humans 60-80%
- ✓ AI adapts to game state
- ✓ Multiple difficulty levels work
- ✓ Players enjoy playing with AI

## Known Challenges

### 1. Making AI "Feel Human"
- Add random delays (500-1500ms)
- Occasionally make suboptimal plays
- Vary strategy between AI players

### 2. Balancing Difficulty
- Too easy: Not fun to play against
- Too hard: Frustrating for new players
- Solution: Multiple difficulty levels

### 3. Performance Impact
- AI calculations could slow server
- Solution: Simple strategies, optimize algorithms
- Consider async processing for complex AI

### 4. Testing Complexity
- Must test AI vs AI games
- Must test mixed AI/human games
- Must test all card types with AI

## References

### Similar Implementations
- Codenames Online: AI word selection
- Dominion Online: Bot players
- Board Game Arena: AI opponents

### AI Strategy Resources
- Game theory for auction games
- Monte Carlo tree search (MCTS)
- Minimax for turn-based games
- Heuristic evaluation functions

## Next Steps

When ready to implement:

1. **Create AIPlayer class** with basic structure
2. **Modify roomManager** to add AI players on game start
3. **Add turn detection** for AI players in server.js
4. **Implement simple random strategy** for bidding
5. **Add UI indicators** for AI players
6. **Test with 1 human + 2 AI** to verify functionality
7. **Iterate on strategy** based on playtesting

## Questions to Resolve

Before implementation, decide:

1. **Auto-fill by default?** Yes/No/Toggle in lobby?
2. **How many AI players?** Fill to minimum (3) or maximum (5)?
3. **AI names?** Generic ("Bot 1") or personality ("Aggressive Alice")?
4. **Difficulty selection?** Single difficulty or multiple levels?
5. **Can host remove AI?** Before game starts? During game?
6. **Can AI be replaced?** If human joins, replace AI mid-game?

## Current Status

**Phase:** ✅ COMPLETE - All phases implemented and working!

### Implemented Features

✅ **Phase 1: Core AI Infrastructure**
- AI Player class created (`server/src/ai/AIPlayer.js`)
- AI Handler for turn management (`server/src/ai/aiHandler.js`)
- Auto-fill logic in roomManager
- AI turn detection and processing
- Thinking delays (1-5 seconds) for natural feel
- Hillbilly-themed AI names (Billy Bob, Cletus, Bubba, Earl, etc.)

✅ **Phase 2: AI Decision Logic**
- Simple bidding strategy implemented
- Reverse auction handling (always pass on disgrace)
- Card swap handling (MVP: skip swaps)
- Luxury discard handling (discard lowest value)
- Random bid amounts with pass probability

✅ **Phase 3: Advanced Features**
- **Lobby Configuration:**
  - "Fill with AI Players" toggle (persists to localStorage)
  - "Watch AI Game" button for spectator mode
  - Dynamic AI count display
- **UI Integration:**
  - 🤖 AI player indicators on avatars
  - Spectator mode UI
  - AI-only game support
- **Game History Feature:**
  - Slide-out history panel showing all game events
  - Tracks bids, passes, card wins, round changes
  - Auto-scrolling to latest events
  - Color-coded event types
  - Toggle button positioned bottom-left

### Recent UI Improvements (Dec 2025)
- Fixed header bar (stays at top when scrolling)
- Proper spacing for poker table under fixed header
- Game history panel with slide-out animation
- Pawn Shop Trade overlay auto-dismisses correctly
- All overlays properly fade in/out

### File Changes Completed
```
CREATED: server/src/ai/AIPlayer.js
CREATED: server/src/ai/aiHandler.js
CREATED: client/src/components/ui/GameHistory.jsx
CREATED: client/src/styles/GameHistory.css
MODIFIED: server/src/services/roomManager.js
MODIFIED: server/src/server.js
MODIFIED: client/src/components/LobbyScreen.jsx
MODIFIED: client/src/components/GameScreen.jsx
MODIFIED: client/src/components/HomeScreen.jsx
MODIFIED: client/src/components/ui/PokerTable.jsx
MODIFIED: client/src/components/ui/PhaseOverlay.jsx
MODIFIED: client/src/services/socket.js
MODIFIED: client/src/styles/App.css
```

**Blocked by:** None
**Dependencies:** None
