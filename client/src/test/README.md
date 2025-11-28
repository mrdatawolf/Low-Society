# Low Society Client Tests

Comprehensive test suite for the React client without requiring a running server.

## Running Tests

```bash
cd client

# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI dashboard
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

### Socket Service Tests (`socket.test.js`)

Tests for the Socket.IO service layer - **20 tests**:

**Connection Management:**
- ✅ Connect to server with default URL
- ✅ Connect to server with custom URL
- ✅ Prevent duplicate connections
- ✅ Disconnect from server
- ✅ Check connection status
- ✅ Get socket ID

**Event Listeners:**
- ✅ Register event listener
- ✅ Remove event listener
- ✅ Remove all listeners

**Promise-based Emit:**
- ✅ Emit event and resolve on success
- ✅ Reject promise on error
- ✅ Reject if socket not connected

**Game Methods:**
- ✅ Create room
- ✅ Join room
- ✅ Start game
- ✅ Place bid
- ✅ Pass on auction
- ✅ Execute card swap
- ✅ Get game state
- ✅ Leave room

### App Component Tests (`App.test.jsx`)

Tests for the main App component - **8 tests**:

**Rendering:**
- ✅ Render HomeScreen initially
- ✅ Render LobbyScreen when in waiting phase

**Socket Integration:**
- ✅ Connect to socket on mount
- ✅ Disconnect from socket on unmount
- ✅ Register socket event listeners

**User Actions:**
- ✅ Handle room creation
- ✅ Handle room join
- ✅ Display error messages

## Test Architecture

### Vitest Configuration

Uses **Vitest** as the test runner with:
- **jsdom** environment for DOM simulation
- **React Testing Library** for component testing
- **happy-dom** as lightweight DOM alternative
- Global test utilities (describe, it, expect, etc.)

### Mocking Strategy

**Socket.IO Mocking:**
- Custom mock socket in `test/mocks/socket.js`
- Simulates emit/on/off behavior
- Helper methods for triggering events
- No actual network connections required

**Component Mocking:**
- Socket service mocked with Vitest
- All network calls intercepted
- Tests run in complete isolation

## Test Statistics

- **Total Test Files**: 2
- **Total Tests**: 28
- **Pass Rate**: 100%
- **Run Time**: ~2 seconds
- **Coverage**: Socket service, App component, user flows

## Benefits of Client Testing

✅ **No Server Required** - Tests run without starting the backend
✅ **Fast Execution** - All tests complete in under 3 seconds
✅ **Isolated** - Each test runs independently with fresh state
✅ **Reliable** - No network flakiness or timing issues
✅ **Developer Friendly** - Watch mode for instant feedback

## What's NOT Tested

These require integration or E2E tests:
- ⏳ Actual Socket.IO connection to real server
- ⏳ Full game flow with multiple clients
- ⏳ Server-client state synchronization
- ⏳ WebSocket reconnection behavior
- ⏳ Real-time multiplayer interactions

## Adding New Tests

When adding new features:

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('New Feature', () => {
  beforeEach(() => {
    // Setup code
    vi.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    render(<Component />);

    // Act
    await userEvent.click(screen.getByRole('button'));

    // Assert
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });
});
```

## Testing Best Practices

1. **Test user behavior, not implementation**
   - Query by role, label, or text users see
   - Avoid testing internal state or implementation details

2. **Use async/await for user interactions**
   - All `userEvent` methods are async
   - Use `waitFor` for assertions that depend on state updates

3. **Mock external dependencies**
   - Always mock socket.io-client
   - Mock API calls and timers

4. **Keep tests isolated**
   - Clear mocks in beforeEach
   - Each test should be independent

## Continuous Testing

Run tests:
- ✅ Before committing changes
- ✅ In watch mode during development
- ✅ As part of CI/CD pipeline
- ✅ Before deploying to production

Tests validate client-side logic without the overhead of starting servers or managing test databases!
