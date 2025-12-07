# AI Player Engine

This folder contains the AI player implementation for Low Society. AI players automatically play the game following the same rules as human players, using a simple rule-based strategy with consistent weights.

## Architecture

### Files

- **[AIPlayer.js](AIPlayer.js)** - Core AI player class with decision-making logic
- **[aiHandler.js](aiHandler.js)** - Integration layer between AI players and the game loop
- **[AIPlayer.test.js](AIPlayer.test.js)** - Comprehensive test suite for AI behavior

## How It Works

### AIPlayer Class

The `AIPlayer` class represents a single AI opponent. Each AI player:

- Has a unique ID (format: `ai_player_{index}_{timestamp}`)
- Has a name from the AI name pool (Bot Alice, Bot Bob, etc.)
- Is flagged as `isAI: true` to distinguish from human players
- Makes decisions independently using the same game state visible to humans

### Decision-Making Strategy

All AI players use the **same strategy** for consistency. The strategy is intentionally simple and rule-based:

#### Standard Auctions (Bidding to WIN)

1. **Card Evaluation**: Each card type is assigned a value
   - Luxury cards: Worth their face value (1-10 points)
   - Prestige cards: Worth ~12 points (they multiply your score)
   - Special cards (Pawn Shop): Worth ~5 points
   - Disgrace cards: Worth 0 (shouldn't bid on these)

2. **Bid Calculation**:
   ```javascript
   maxWillingToBid = (cardValue * availableMoneyTotal) / 20
   maxWillingToBid = min(maxWillingToBid, availableMoneyTotal * 0.7)
   ```
   - Higher value cards → higher bids
   - Never spend more than 70% of remaining money

3. **Random Pass Chance**: 30% chance to pass on any card (keeps AI unpredictable)

4. **Conservative on Low-Value Cards**: 50% chance to pass on cards worth ≤2 points

5. **Greedy Card Selection**: Selects smallest denomination cards to just beat current bid

#### Reverse Auctions (Bidding to AVOID)

1. **80% Pass Rate**: When no one has bid yet, AI passes immediately 80% of the time
2. **Always Pass After Bid**: If someone else has already bid, AI always passes
3. **Small Bluff Bids**: 20% of the time, makes a tiny bid to try to force others to pass

#### Special Actions

**Repo Man (Luxury Discard)**:
- Always discards the **lowest value luxury card**

**Pawn Shop Trade (Card Swap)**:
- **MVP Version**: AI skips the swap (passes null values)
- Future: Could implement strategic swapping

### Thinking Delay

To make AI feel more natural:
- Random delay between **500ms - 1500ms** before each decision
- Simulates "thinking time"
- Prevents instant responses that feel robotic

## Integration with Game Loop

### AI Handler Module

The `aiHandler.js` module manages AI players within the game:

1. **Registration**: AI players are registered when added to a room
   ```javascript
   registerAIPlayer(roomCode, aiPlayer)
   ```

2. **Turn Detection**: After each state update, checks if current player is AI
   ```javascript
   checkAndHandleAITurn(game, roomCode, io)
   ```

3. **Automatic Execution**: If AI's turn, automatically:
   - Gets public and private game state
   - Calls AI decision method
   - Executes the decision (bid/pass)
   - Broadcasts state update to all players

4. **Phase Handling**: Handles AI decisions for all game phases:
   - `AUCTION` phase → `handleAITurn()`
   - `DISCARD_LUXURY` phase → `handleAILuxuryDiscard()`
   - `CARD_SWAP` phase → `handleAICardSwap()`

### Storage

AI players are stored in a Map structure:
```javascript
// Format: { roomCode: { playerId: AIPlayer } }
aiPlayersByRoom = Map {
  'AB12' => Map {
    'ai_player_0_1234567890' => AIPlayer { ... },
    'ai_player_1_1234567891' => AIPlayer { ... }
  }
}
```

## Usage Example

### Creating an AI Player

```javascript
import { createAIPlayer } from './ai/AIPlayer.js';
import { registerAIPlayer } from './ai/aiHandler.js';

// Create AI player
const aiPlayer = createAIPlayer(0); // Bot Alice

// Add to game
game.addPlayer(aiPlayer.id, aiPlayer.name);

// Register with handler
registerAIPlayer(roomCode, aiPlayer);
```

### Checking for AI Turns

```javascript
import { checkAndHandleAITurn } from './ai/aiHandler.js';

// After any state update
game.placeBid(playerId, cards);
io.to(roomCode).emit('state_update', { publicState: game.getPublicState() });

// Check if next player is AI
checkAndHandleAITurn(game, roomCode, io);
```

## Testing

Run the AI player tests:

```bash
cd server
npm test -- AIPlayer.test.js
```

### Test Coverage

- ✅ Constructor and initialization
- ✅ Reverse auction decisions (disgrace cards)
- ✅ Standard auction decisions (luxury/prestige cards)
- ✅ Card evaluation logic
- ✅ Card selection algorithms
- ✅ Luxury discard decisions
- ✅ Card swap decisions
- ✅ Thinking delay timing
- ✅ Factory functions

## Strategy Tuning

The AI strategy can be tuned by adjusting these constants in [AIPlayer.js](AIPlayer.js):

```javascript
const PASS_THRESHOLD = 0.3;  // 30% random pass rate
const MAX_BID_RATIO = 0.7;   // Don't spend >70% of money
const REVERSE_PASS_RATE = 0.8; // 80% pass on disgrace cards
```

### Strategy Trade-offs

**Current Strategy (Simple & Conservative)**:
- ✅ Easy to understand and debug
- ✅ Predictable and fair
- ✅ Follows basic game theory
- ✅ Fast execution (no complex calculations)
- ⚠️ Can be exploited by experienced players
- ⚠️ Doesn't adapt to opponents

**Future Enhancements** (see Future Features below):
- Track opponent behavior
- Calculate expected values
- Avoid being poorest player
- Strategic card swaps

## AI Behavior Characteristics

### Strengths
- Never makes illegal moves
- Consistent rule application
- Unbiased decision-making
- Fast response times
- No connection issues

### Weaknesses
- No memory of previous rounds
- Doesn't track opponent money/cards
- Random element makes it beatable
- Skips strategic card swaps (MVP)
- Doesn't optimize to avoid elimination

### Difficulty Level

The current AI is approximately **Easy-Medium** difficulty:
- Suitable for casual play
- Good for learning the game
- Beatable by players who understand the strategy
- Provides basic competition

## Future Features

### Planned Enhancements

1. **Opponent Modeling**
   - Track how much money each opponent has spent
   - Remember who bids aggressively vs conservatively
   - Adjust strategy based on opponent patterns

2. **Expected Value Calculation**
   - Calculate probability of winning
   - Factor in remaining cards in deck
   - Optimize bids based on expected outcomes

3. **End-Game Awareness**
   - Track own money vs other players
   - Ensure not being poorest player
   - Adjust bidding to maintain money reserves

4. **Strategic Card Swaps**
   - Identify beneficial swaps (steal prestige, give disgrace)
   - Calculate impact on own score vs opponents
   - Implement multi-step planning

5. **Difficulty Levels**
   - **Easy**: Current random strategy
   - **Medium**: Basic opponent tracking
   - **Hard**: Full expected value optimization

6. **Personality Types**
   - **Aggressive**: Bids high, rarely passes
   - **Conservative**: Saves money, passes often
   - **Adaptive**: Changes strategy based on game state

## Design Decisions

### Why Simple Rule-Based AI?

1. **Transparency**: Easy to understand and debug
2. **Performance**: Fast decision-making, no ML overhead
3. **Fairness**: Same strategy for all AI players
4. **Testing**: Deterministic behavior (except random elements)
5. **Maintainability**: Simple code, easy to modify

### Why Not Machine Learning?

- Game has limited state space (auction game with ~15 cards)
- No training data available
- Rule-based strategy is already competitive
- ML would add complexity without clear benefit
- Can always add ML later if needed

### Why Same Strategy for All?

- Ensures fair gameplay
- Easier to balance difficulty
- Reduces code complexity
- Players can learn AI patterns
- Future: Can add personality variants

## Integration Points

### Server-Side Files That Use AI

- **[server/src/server.js](../server.js)** - Will call `checkAndHandleAITurn()` after state updates
- **[server/src/services/roomManager.js](../services/roomManager.js)** - Will add AI players on game start
- **[server/src/models/game.js](../models/game.js)** - No changes needed (AI uses existing methods)

### Client-Side Files That Display AI

- **client/src/components/GameScreen.jsx** - Show AI player indicators
- **client/src/components/ui/PokerTable.jsx** - Display AI avatars with robot icon
- **client/src/components/LobbyScreen.jsx** - Toggle for AI fill option

## Configuration

Future configuration options (can be added to [config.js](../../../config.js)):

```javascript
export const AI_CONFIG = {
  enabled: true,
  autoFill: true,              // Auto-add AI to reach min players
  minPlayers: 3,               // Minimum total players
  maxAIPlayers: 4,             // Max AI players per game
  thinkingTime: {
    min: 500,                  // Minimum delay (ms)
    max: 1500                  // Maximum delay (ms)
  },
  difficulty: 'easy',          // 'easy', 'medium', 'hard'
  strategy: {
    passThreshold: 0.3,        // Random pass rate
    maxBidRatio: 0.7,          // Max % of money to bid
    reversePassRate: 0.8       // Pass rate on disgrace cards
  }
};
```

## Error Handling

The AI handler includes robust error handling:

1. **Decision Errors**: If AI decision fails, forces AI to pass
2. **State Errors**: Validates game state before making decisions
3. **Missing Players**: Checks if AI player exists before processing
4. **Phase Mismatch**: Only handles AI turns in appropriate phases

All errors are logged to console with `[AI]` prefix for debugging.

## Performance Considerations

- **Memory**: Each AI player stores minimal state (~1KB)
- **CPU**: Simple calculations, no complex algorithms
- **Network**: AI actions don't require socket communication
- **Latency**: 500-1500ms delay per AI decision (intentional)

### Scalability

- Supports up to 4 AI players per game (5 player max - 1 human min)
- Multiple rooms can have AI players simultaneously
- AI players are cleaned up when room is deleted
- No persistent storage needed

## Debugging

### Enable AI Logging

AI handler logs all decisions with `[AI]` prefix:

```
[AI] Bot Alice (ai_player_0_1234567890) is thinking...
[AI] Bot Alice decided to bid with cards: ["money-2","money-3"]
[AI] Bot Bob is deciding which luxury to discard...
[AI] Bot Bob discarding card: lux-2
```

### Common Issues

**AI not taking turn?**
- Check if `checkAndHandleAITurn()` is called after state updates
- Verify AI is registered with `registerAIPlayer()`
- Check game phase matches (AUCTION, DISCARD_LUXURY, CARD_SWAP)

**AI making illegal moves?**
- Check private state is being passed correctly
- Verify money hand has available cards
- Look for errors in console logs

**AI taking too long?**
- Check thinking delay range (should be 500-1500ms)
- Verify no infinite loops in decision logic
- Look for network delays in state broadcasts

## Contributing

When adding new AI features:

1. Update decision logic in [AIPlayer.js](AIPlayer.js)
2. Add tests to [AIPlayer.test.js](AIPlayer.test.js)
3. Update this README with new behavior
4. Ensure all existing tests still pass
5. Test with full game simulations

## Credits

Designed and implemented following the Low Society game rules with simple, transparent decision-making that provides fair competition while remaining beatable by human players.
