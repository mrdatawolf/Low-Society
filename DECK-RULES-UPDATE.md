# Deck Rules Update - December 4, 2025

## Summary

Updated the game to match the official Low Society rules for deck composition and game ending.

## Changes Made

### 1. Deck Composition (cards.js)

**Before:** 17 cards total
- 10 luxury cards (1-10)
- 3 prestige cards
- 3 disgrace cards
- 1 special card

**After:** 15 cards total
- 10 luxury cards (1-10)
- 2 prestige cards (removed "Confederate Flag Collection")
- 2 disgrace cards (removed "Jerry Springer Episode" with scandale effect)
- 1 special card (Pawn Shop Trade)

### 2. Deck Building Logic (cards.js)

Implemented special shuffle to ensure Pawn Shop Trade appears in positions 8-15:

```javascript
export function buildItemDeck() {
  // 1. Separate swap card from other cards
  const swapCard = SPECIAL_CARDS[0];
  const otherCards = [...LUXURY_CARDS, ...PRESTIGE_CARDS, ...DISGRACE_CARDS];

  // 2. Shuffle all other cards (14 cards)
  const shuffledOthers = shuffleDeck(otherCards);

  // 3. Split into two piles of 7 each
  const firstHalf = shuffledOthers.slice(0, 7);
  const secondHalf = shuffledOthers.slice(7, 14);

  // 4. Shuffle the swap card into the second half
  const secondHalfWithSwap = shuffleDeck([...secondHalf, swapCard]);

  // 5. Put first half on top of second half
  return [...firstHalf, ...secondHalfWithSwap];
}
```

This ensures:
- Swap card never appears in first 7 cards
- Swap card always appears in cards 8-15
- Tested over 100 trials - 100% success rate

### 3. Game Ending Logic (game.js)

**Before:** Game ended after revealing 4 "game-ending cards" (prestige cards + scandale)

**After:** Game plays through entire 15-card deck

Changes:
- Modified `isGameEndingCard()` to always return `false`
- Modified `startNextAuction()` to only check `deck.length === 0`
- Removed `gameEndingCardsRevealed` counter from Game class
- Updated `getPublicState()` to show `cardsRemaining` instead of `gameEndingCardsRevealed`

### 4. Client UI Updates (GameScreen.jsx)

Changed display from:
```jsx
<span className="info-label">Game Enders</span>
<span className="info-value">{gameState.gameEndingCardsRevealed}/4</span>
```

To:
```jsx
<span className="info-label">Cards Left</span>
<span className="info-value">{gameState.cardsRemaining}/15</span>
```

### 5. Test Updates

Updated all tests to reflect new rules:
- `cards.test.js`:
  - Changed prestige card count from 3 to 2
  - Changed disgrace card count from 3 to 2
  - Changed expected deck size from 17 to 15
  - Removed scandale-related tests
  - Updated `isGameEndingCard` tests
- `game.test.js`:
  - Removed `gameEndingCardsRevealed` checks
  - Updated game ending test to check for 15 cards

All tests passing: **86/86 server tests + 28/28 client tests**

## Verification

Created verification scripts:
- `verify-deck.js`: Confirms 15 cards with correct composition
- `verify-swap-position.js`: Confirms swap card only appears in positions 8-15 (100 trials)
- `test-full-deck.js`: Confirms game plays through all 15 cards

Results from automated testing:
- ✅ Deck contains exactly 15 cards
- ✅ Swap card appears between positions 8-15 (never in first 7)
- ✅ Pawn Shop Trade feature triggers during gameplay
- ✅ Repo Man feature triggers during gameplay
- ✅ Game completes successfully after all cards played

## Files Modified

1. `server/src/models/cards.js`
   - Reduced PRESTIGE_CARDS to 2
   - Reduced DISGRACE_CARDS to 2
   - Rewrote `buildItemDeck()` with special shuffle logic
   - Modified `isGameEndingCard()` to return false
   - Removed scandale effect handling

2. `server/src/models/game.js`
   - Removed `gameEndingCardsRevealed` property
   - Updated `startNextAuction()` to only check empty deck
   - Updated `getPublicState()` to return `cardsRemaining`

3. `client/src/components/GameScreen.jsx`
   - Updated UI to show "Cards Left: X/15"

4. `server/test/cards.test.js`
   - Updated all deck composition tests
   - Removed scandale tests

5. `server/test/game.test.js`
   - Removed `gameEndingCardsRevealed` tests
   - Updated game ending test

## Testing Commands

```bash
# Run all server tests
cd server && npm test

# Run all client tests
cd client && npm test

# Verify deck composition
cd integration-test && node verify-deck.js

# Verify swap card position
cd integration-test && node verify-swap-position.js

# Run full automated game
cd integration-test && npm test
```

## Impact

- Game now matches official Low Society rules exactly
- Pawn Shop Trade appears more frequently (6.7% per card vs ~0% before)
- Repo Man appears more frequently (6.7% per card vs ~0% before)
- Games play through all 15 cards consistently
- Special card mechanics now tested and working in real gameplay
