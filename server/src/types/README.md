# TypeScript Type Definitions

This directory contains TypeScript definition files for the Low Society game.

## Structure

- **game.d.ts** - Core game types (Player, Card, GameState, etc.)
- **socket.d.ts** - Socket.io event types and payloads
- **ai.d.ts** - AI system types (decisions, chat, stories)
- **index.d.ts** - Central export file

## Usage

### In JavaScript Files with JSDoc

You can use these types in JavaScript files with JSDoc comments for better IDE support:

```javascript
/**
 * @typedef {import('./types/game').Player} Player
 * @typedef {import('./types/game').PublicGameState} PublicGameState
 */

/**
 * Get player by ID
 * @param {PublicGameState} gameState
 * @param {string} playerId
 * @returns {Player | undefined}
 */
function getPlayer(gameState, playerId) {
  return gameState.players.find(p => p.id === playerId);
}
```

### In TypeScript Files

If you convert files to TypeScript, import types directly:

```typescript
import type { Player, PublicGameState } from './types/game';

function getPlayer(gameState: PublicGameState, playerId: string): Player | undefined {
  return gameState.players.find(p => p.id === playerId);
}
```

### Typed Socket.io

Use the typed socket interfaces for better autocomplete:

```javascript
/**
 * @typedef {import('./types/socket').TypedSocket} TypedSocket
 * @typedef {import('./types/socket').TypedServer} TypedServer
 */

/**
 * @param {TypedSocket} socket
 * @param {TypedServer} io
 */
function handleConnection(socket, io) {
  socket.on('create_room', (data, callback) => {
    // data and callback are now typed!
    const { playerName } = data;
    callback({ success: true, roomCode: 'ABC123' });
  });
}
```

## Benefits

- **Better IDE Support**: Autocomplete and inline documentation
- **Catch Errors Early**: Type checking before runtime
- **Self-Documenting**: Types serve as living documentation
- **Refactoring Safety**: IDE can find all usages

## Adding New Types

When adding new game features, update the relevant .d.ts file:

1. Add the interface/type definition
2. Export it in the file
3. It will automatically be available via index.d.ts
4. Update this README if needed

## VSCode Setup

For best results, ensure your VSCode settings include:

```json
{
  "javascript.suggest.autoImports": true,
  "javascript.validate.enable": true,
  "typescript.tsdk": "node_modules/typescript/lib"
}
```
