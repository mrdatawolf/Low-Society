# Phase 4: Developer Experience - Preparation

This document outlines the preparation work and plan for Phase 4 improvements.

## Date: December 2025

---

## Current State Analysis

### Existing Test Files
✅ **4 test files** in [server/test/](server/test/)
- [cards.test.js](server/test/cards.test.js) - Card deck and money hand tests
- [game.test.js](server/test/game.test.js) - Game state and auction logic tests
- [roomManager.test.js](server/test/roomManager.test.js) - Room management tests
- [aiPlayer.test.js](server/test/aiPlayer.test.js) - AI player logic tests

### Source Files (16 total)

#### ✅ **Tested Files (4)**
- `src/models/cards.js` - Tested by cards.test.js
- `src/models/game.js` - Tested by game.test.js
- `src/services/roomManager.js` - Tested by roomManager.test.js
- `src/ai/AIPlayer.js` - Tested by aiPlayer.test.js

#### ❌ **Untested Files (12)**
- `src/ai/aiHandler.js` - **HIGH PRIORITY** - AI turn orchestration
- `src/handlers/auctionHandlers.js` - **HIGH PRIORITY** - Bid/pass handlers
- `src/handlers/gameHandlers.js` - **HIGH PRIORITY** - Start game handlers
- `src/handlers/roomHandlers.js` - **HIGH PRIORITY** - Room management handlers
- `src/handlers/specialHandlers.js` - **HIGH PRIORITY** - Card swap handlers
- `src/handlers/index.js` - Low priority (just exports)
- `src/server.js` - **MEDIUM PRIORITY** - Main server setup
- `src/utils/errorHandler.js` - **MEDIUM PRIORITY** - Error handling
- `src/shared/constants/gameConfig.js` - Low priority (constants)
- `src/shared/constants/gamePhases.js` - Low priority (constants)
- `src/shared/constants/socketEvents.js` - Low priority (constants)
- `src/shared/constants/index.js` - Low priority (just exports)

### Test Coverage Estimate

Based on file analysis:
- **Core Logic:** ~70% covered (cards, game, roomManager, AIPlayer)
- **Handlers:** 0% covered (new in Phase 3)
- **Integration:** 0% covered (no socket integration tests)
- **Overall Estimate:** ~30-40% code coverage

---

## Phase 4 Goals

### 1. Add TypeScript Definitions
**Goal:** Provide type safety without full TypeScript migration

**Approach:**
- Create `.d.ts` files for all modules
- Start with most-used modules (Game, handlers)
- Enable IntelliSense and type checking for consumers

### 2. Improve Test Coverage
**Goal:** Reach 80%+ code coverage

**Priority Areas:**
1. **Handler Integration Tests** - Test socket event handling end-to-end
2. **AI Handler Tests** - Test AI turn queue and decision execution
3. **Error Handler Tests** - Test error categorization and handling
4. **Server Integration Tests** - Test full server setup and teardown

### 3. Add API Documentation
**Goal:** Document all socket events and their contracts

**Deliverables:**
- Socket event reference guide
- Request/response schemas
- Error codes and meanings
- Example usage for each event

### 4. Create Developer Guide
**Goal:** Make onboarding new developers easy

**Sections:**
- Project overview and architecture
- Setup instructions
- Code organization
- Testing guide
- Contributing guidelines
- Common tasks and patterns

---

## Phase 4 Task Breakdown

### Task 1: TypeScript Definitions (2-3 hours)

#### Files to Create
1. `src/models/game.d.ts` - Game class type definitions
2. `src/models/cards.d.ts` - Card types and functions
3. `src/handlers/handlers.d.ts` - Handler function signatures
4. `src/services/roomManager.d.ts` - RoomManager types
5. `src/utils/errorHandler.d.ts` - Error handling types
6. `src/shared/constants/types.d.ts` - Shared type definitions

#### Example Structure
```typescript
// src/models/game.d.ts
export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  moneyHand: MoneyCard[];
  wonCards: Card[];
  currentBid: MoneyCard[];
  hasPassed: boolean;
  removedBill: MoneyCard | null;
}

export interface PublicState {
  roomCode: string;
  phase: string;
  playerCount: number;
  players: PublicPlayer[];
  currentCard: Card | null;
  // ... more fields
}

export class Game {
  constructor(roomCode: string);
  addPlayer(playerId: string, playerName: string, isAI?: boolean): Player;
  placeBid(playerId: string, moneyCardIds: string[]): number;
  pass(playerId: string): void;
  getPublicState(): PublicState;
  getPrivateState(playerId: string): PrivateState | null;
  // ... more methods
}
```

---

### Task 2: Handler Integration Tests (4-5 hours)

#### Test Files to Create
1. `test/handlers/roomHandlers.test.js` - Room creation/joining/leaving
2. `test/handlers/auctionHandlers.test.js` - Bidding and passing
3. `test/handlers/gameHandlers.test.js` - Starting game and getting state
4. `test/handlers/specialHandlers.test.js` - Card swap and discard

#### Test Structure Example
```javascript
// test/handlers/roomHandlers.test.js
import { handleCreateRoom } from '../src/handlers/roomHandlers.js';
import { roomManager } from '../src/services/roomManager.js';

describe('Room Handlers', () => {
  let mockSocket;
  let mockIo;

  beforeEach(() => {
    // Reset room manager
    roomManager.rooms.clear();
    roomManager.playerRooms.clear();

    // Create mock socket
    mockSocket = {
      id: 'player1',
      join: jest.fn(),
      emit: jest.fn()
    };

    // Create mock io
    mockIo = {
      to: jest.fn(() => ({
        emit: jest.fn()
      }))
    };
  });

  describe('handleCreateRoom', () => {
    test('should create room and return valid state', (done) => {
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);

      handler({ playerName: 'Alice', aiEnabled: false }, (response) => {
        expect(response.success).toBe(true);
        expect(response.roomCode).toBeDefined();
        expect(response.publicState).toBeDefined();
        expect(response.privateState).toBeDefined();
        done();
      });
    });

    test('should validate player name', (done) => {
      const handler = handleCreateRoom(mockSocket, roomManager, mockIo);

      handler({ playerName: '', aiEnabled: false }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('name');
        done();
      });
    });

    // More tests...
  });
});
```

---

### Task 3: AI Handler Tests (2-3 hours)

#### Test File to Create
`test/aiHandler.test.js` - Test AI turn queue and execution

#### Test Coverage
- AI player registration and cleanup
- Turn queue prevents race conditions
- AI decision execution (bid, pass)
- AI luxury discard handling
- AI card swap handling
- Error recovery

#### Example Tests
```javascript
describe('AI Handler', () => {
  describe('queueAITurn', () => {
    test('should execute AI turns sequentially', async () => {
      // Test that turns don't overlap
    });

    test('should handle errors without breaking queue', async () => {
      // Test error recovery
    });
  });

  describe('checkAndHandleAITurn', () => {
    test('should trigger AI turn in auction phase', async () => {
      // Test AI auction turns
    });

    test('should trigger AI luxury discard', async () => {
      // Test AI discard phase
    });

    test('should trigger AI card swap', async () => {
      // Test AI swap phase
    });
  });
});
```

---

### Task 4: Error Handler Tests (1-2 hours)

#### Test File to Create
`test/utils/errorHandler.test.js`

#### Test Coverage
- Error categorization (validation, not found, permission, etc.)
- Callback invocation with error response
- Socket emission for internal errors
- Logging for different error types
- GameError class behavior

---

### Task 5: API Documentation (3-4 hours)

#### Document to Create
`docs/SOCKET-API.md` - Complete socket event reference

#### Structure
```markdown
# Socket.IO API Reference

## Connection Events

### `connect`
Emitted when client connects to server.

**Client receives:** Connection confirmation
**No parameters**

---

## Room Events

### `create_room` (client → server)
Create a new game room.

**Request:**
```json
{
  "playerName": "string (1-20 chars, alphanumeric + spaces/underscore/dash)",
  "aiEnabled": "boolean (optional, default: true)"
}
```

**Response (callback):**
```json
{
  "success": true,
  "roomCode": "string (4 chars)",
  "publicState": { ... },
  "privateState": { ... }
}
```

**Errors:**
- `Player name is required` - Name missing or empty
- `Player name too long` - Name exceeds 20 characters
- `Player name contains invalid characters` - Invalid characters used

**Example:**
```javascript
socket.emit('create_room',
  { playerName: 'Alice', aiEnabled: true },
  (response) => {
    if (response.success) {
      console.log('Room created:', response.roomCode);
    }
  }
);
```

[... document all events ...]
```

---

### Task 6: Developer Guide (2-3 hours)

#### Document to Create
`docs/DEVELOPER-GUIDE.md`

#### Sections

##### 1. Project Overview
- What is Low Society?
- Tech stack
- Architecture overview

##### 2. Getting Started
```bash
# Clone repository
git clone https://github.com/yourrepo/low-society.git

# Install dependencies
cd low-society/server
npm install

# Run tests
npm test

# Start server
npm start
```

##### 3. Code Organization
```
server/src/
├── ai/                 - AI player logic
│   ├── AIPlayer.js    - AI decision making
│   └── aiHandler.js   - AI turn orchestration
├── handlers/          - Socket event handlers
│   ├── auctionHandlers.js
│   ├── gameHandlers.js
│   ├── roomHandlers.js
│   └── specialHandlers.js
├── models/            - Core game logic
│   ├── cards.js       - Card deck and money
│   └── game.js        - Game state management
├── services/          - Business services
│   └── roomManager.js - Room lifecycle
├── shared/            - Shared constants
│   └── constants/
└── utils/             - Utilities
    └── errorHandler.js
```

##### 4. Adding New Features

**Adding a new socket event:**
```javascript
// 1. Add to appropriate handler file
// src/handlers/myHandler.js
export function handleNewEvent(socket, roomManager, io) {
  return (data, callback) => {
    try {
      // Validate input
      // Execute logic
      // Broadcast updates
      callback({ success: true });
    } catch (error) {
      handleSocketError(error, callback, socket, { event: 'new_event' });
    }
  };
}

// 2. Export from handlers/index.js
export { handleNewEvent } from './myHandler.js';

// 3. Register in server.js
socket.on('new_event', handleNewEvent(socket, roomManager, io));
```

##### 5. Testing Guide
- Unit tests for business logic
- Integration tests for handlers
- Mocking Socket.io
- Running specific tests
- Coverage reports

##### 6. Common Patterns
- Error handling
- State updates
- AI integration
- Room cleanup

---

## Implementation Order (Recommended)

### Week 1: Testing Foundation
1. ✅ Create handler integration test structure
2. ✅ Write tests for roomHandlers
3. ✅ Write tests for auctionHandlers
4. ✅ Write tests for gameHandlers
5. ✅ Write tests for specialHandlers

### Week 2: Additional Testing
6. ✅ Write AI handler tests
7. ✅ Write error handler tests
8. ✅ Fix any bugs found during testing
9. ✅ Achieve 80%+ code coverage

### Week 3: TypeScript & Documentation
10. ✅ Create TypeScript definition files
11. ✅ Write socket API documentation
12. ✅ Create developer guide

### Week 4: Polish & Review
13. ✅ Add troubleshooting guide
14. ✅ Create architecture diagrams
15. ✅ Review and update all documentation
16. ✅ Final testing and validation

---

## Success Metrics

### Test Coverage
- [ ] **80%+ overall code coverage**
- [ ] 100% handler coverage
- [ ] 100% critical path coverage
- [ ] All edge cases tested

### Documentation
- [ ] All socket events documented
- [ ] All public APIs have JSDoc
- [ ] Developer guide complete
- [ ] Examples for common tasks

### TypeScript Support
- [ ] Type definitions for all modules
- [ ] No TypeScript errors in strict mode
- [ ] IntelliSense works in VSCode

### Developer Experience
- [ ] New developers can set up in < 15 minutes
- [ ] Common tasks documented
- [ ] Architecture is clear
- [ ] Contributing is easy

---

## Tools & Dependencies

### Testing
```json
{
  "jest": "^29.x",
  "socket.io-client": "^4.x" // For integration tests
}
```

### TypeScript (dev dependency)
```json
{
  "typescript": "^5.x" // For generating and validating .d.ts files
}
```

### Documentation
- Markdown files
- Mermaid for diagrams (optional)
- JSDoc for inline docs

---

## File Creation Checklist

### TypeScript Definitions
- [ ] `src/models/game.d.ts`
- [ ] `src/models/cards.d.ts`
- [ ] `src/handlers/handlers.d.ts`
- [ ] `src/services/roomManager.d.ts`
- [ ] `src/utils/errorHandler.d.ts`
- [ ] `src/shared/constants/types.d.ts`

### Test Files
- [ ] `test/handlers/roomHandlers.test.js`
- [ ] `test/handlers/auctionHandlers.test.js`
- [ ] `test/handlers/gameHandlers.test.js`
- [ ] `test/handlers/specialHandlers.test.js`
- [ ] `test/aiHandler.test.js`
- [ ] `test/utils/errorHandler.test.js`

### Documentation
- [ ] `docs/SOCKET-API.md`
- [ ] `docs/DEVELOPER-GUIDE.md`
- [ ] `docs/ARCHITECTURE.md` (optional)
- [ ] `docs/TROUBLESHOOTING.md` (optional)
- [ ] `CONTRIBUTING.md`

---

## Quick Start Commands

### Run specific test file
```bash
npm test -- test/handlers/roomHandlers.test.js
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Generate TypeScript declarations
```bash
npx tsc --declaration --emitDeclarationOnly --allowJs --outDir types
```

### Watch mode for tests
```bash
npm test -- --watch
```

---

## Notes

### Backwards Compatibility
- All changes should be non-breaking
- Maintain existing API contracts
- Add new features via optional parameters

### Performance Considerations
- Keep tests fast (< 5 seconds total)
- Mock external dependencies
- Use test databases/isolated rooms

### Documentation Style
- Clear, concise examples
- Real-world use cases
- Troubleshooting tips
- Link to related docs

---

## Next Steps

After Phase 4 completion:
1. **Phase 5:** Production readiness (logging, monitoring, deployment)
2. **Phase 6:** Performance optimization
3. **Phase 7:** Advanced features (spectator mode enhancements, replays, etc.)

---

## Questions to Answer

Before starting implementation:
- [ ] Do we want full TypeScript migration or just .d.ts files?
- [ ] What's the minimum acceptable test coverage?
- [ ] Should we add E2E tests with real Socket.io connections?
- [ ] Do we need API versioning?
- [ ] Should we document internal APIs or just public ones?

---

**Status: READY TO BEGIN** 🚀

This prep document will be updated as Phase 4 progresses.
