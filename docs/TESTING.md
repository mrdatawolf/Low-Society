# Testing Guide

## Overview

Low Society includes comprehensive test suites for both server and client:
- **Server Tests** (Jest): 92 tests validating game logic, rules, and multiplayer
- **Client Tests** (Vitest): 28 tests for React components and socket service

All tests run **without requiring a server** - perfect for CI/CD and rapid development!

## Quick Start

```bash
# Server Tests (Game Logic)
cd server
npm test

# Client Tests (React Components - NO SERVER NEEDED!)
cd client
npm test

# Run both (from project root)
cd server && npm test && cd ../client && npm test
```

## Test Structure

```
server/test/
├── README.md              # Server test documentation
├── cards.test.js          # Card mechanics (50+ tests)
├── game.test.js           # Game flow (40+ tests)
└── roomManager.test.js    # Room management (20+ tests)

client/src/test/
├── README.md              # Client test documentation
├── App.test.jsx           # App component (8 tests)
├── socket.test.js         # Socket service (20 tests)
├── setup.js               # Test configuration
└── mocks/
    └── socket.js          # Mock Socket.IO client
```

## What's Tested

### ✅ Card Mechanics (cards.test.js)
- All 17 cards defined correctly
- Money denominations ($1-$25)
- **Low Society**: Random bill removal
- Score calculation with all modifiers
- Game-ending card detection

### ✅ Game Logic (game.test.js)
- Player management (3-5 players)
- **Low Society**: Turn-based bidding
- Standard vs reverse auctions
- **Low Society**: Winner/loser starts next auction
- Game ending and winner determination

### ✅ Multiplayer (roomManager.test.js)
- Room creation with unique codes
- Joining and leaving rooms
- Host management
- Room cleanup

### ✅ Client Socket Service (socket.test.js)
- Connection management
- Event listener registration/removal
- Promise-based emit with error handling
- All game methods (create, join, bid, pass, etc.)

### ✅ Client Components (App.test.jsx)
- HomeScreen rendering
- Room creation/join flows
- Error message display
- Socket connection lifecycle
- LobbyScreen transitions

## Running Tests

### Run All Tests
```bash
npm test
```

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

### With Coverage Report
```bash
npm test -- --coverage
```

## Test Output Example

```
PASS  test/cards.test.js
  Cards Module
    Card Definitions
      ✓ should have 10 luxury cards (3ms)
      ✓ luxury cards should have values 1-10 (1ms)
      ✓ should have 3 prestige cards
    ...

PASS  test/game.test.js
  Game Class
    Starting Game
      ✓ should remove one random bill from each player (5ms)
      ✓ should never remove $1 or $25 (2ms)
    ...

Test Suites: 3 passed, 3 total
Tests:       100+ passed, 100+ total
```

## Low Society Rules Validation

The tests specifically validate these Low Society rules:

1. **Random Bill Removal** ✅
   - Each player loses 1 bill at game start
   - Never the $1 or $25 bill
   - See: `cards.test.js` and `game.test.js`

2. **Turn-Based Bidding** ✅
   - Only current player can bid/pass
   - Turn advances after each action
   - See: `game.test.js` - Turn Order section

3. **Winner Starts Next Auction** ✅
   - Standard auction: winner starts next
   - Reverse auction: loser starts next
   - See: `game.test.js` - Resolution sections

## Adding New Tests

When adding new features or rules:

1. Add test cases to appropriate file
2. Run tests to ensure they fail (red)
3. Implement the feature
4. Run tests to ensure they pass (green)
5. Refactor if needed

Example:
```javascript
test('should implement new Low Society rule', () => {
  // Arrange
  const game = new Game('TEST');
  game.addPlayer('p1', 'Alice');

  // Act
  game.newFeature();

  // Assert
  expect(game.someState).toBe(expectedValue);
});
```

## Continuous Integration

Consider running tests:
- Before each commit (pre-commit hook)
- On pull requests (GitHub Actions)
- Before deploying to production

## Coverage Goals

Current coverage focuses on:
- ✅ Core game logic (100%)
- ✅ Card mechanics (100%)
- ✅ Room management (100%)
- ⏳ Socket.io integration (manual testing)
- ⏳ Client-side logic (future)

## Troubleshooting

**Tests failing after changes?**
- Check if you modified game rules
- Ensure Low Society rules still enforced
- Review test output for specific failures

**Need to debug a test?**
```bash
# Add console.log to your test
test('my test', () => {
  console.log('Debug info:', someVariable);
  expect(result).toBe(expected);
});

# Run just that test file
npm test -- cards.test.js
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [server/test/README.md](server/test/README.md) - Detailed test docs
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Feature implementation status
