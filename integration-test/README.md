# Low Society Integration Test

Automated testing suite that simulates a complete multiplayer game with 4 AI players.

## What This Does

- Creates 4 AI players (Alice, Bob, Charlie, Dave)
- Connects them to the server
- Creates a game room and starts a game
- AI players automatically:
  - Make bids or pass based on available money
  - Handle Pawn Shop Trade card swaps
  - Handle Repo Man luxury card discards
  - Play until game completion
- Logs all actions to `test-log.txt`
- Logs all errors to `test-errors.txt`

## Prerequisites

1. Make sure the server is running on port 3003
   ```bash
   cd ../server
   npm run dev
   ```

## Running the Test

### Option 1: Single Test Run

**PowerShell (Recommended - Auto-starts server):**
```powershell
.\run-test.ps1
```

**Batch File:**
```cmd
run-test.bat
```

**Manual:**
```bash
npm install
npm test
```

### Option 2: Multiple Test Runs
```powershell
.\run-multiple-tests.ps1 -Count 10
```
Runs 10 games and tracks special card appearances.

### Option 3: Continuous Testing (NEW!)
```powershell
.\run-continuous.ps1
```
**OR**
```cmd
run-continuous.bat
```

Runs tests in an infinite loop until you press **Ctrl+C**.

**Perfect for:**
- 🔄 Finding the Pawn Shop Trade card
- 🚨 Finding the Repo Man card
- 🐛 Stress testing / finding edge cases
- 📊 Gathering statistics on card frequencies
- 🌙 Running overnight to catch rare bugs

**Live stats displayed:**
- Total runs
- Pass/fail count
- Pawn Shop Trade appearances (%)
- Repo Man appearances (%)
- Reverse auction count (%)

**Output files:**
- `test-continuous.log` - All game logs
- `test-continuous-summary.txt` - Live updated stats

## What to Look For

### Success Indicators
- All 4 players connect successfully
- Game starts without errors
- Players take turns bidding/passing
- Special cards (Pawn Shop Trade, Repo Man) are handled correctly
- Game reaches completion with a winner
- `test-errors.txt` has no errors (only header)

### Common Issues
- **Connection errors**: Server not running or wrong port
- **Timeout errors**: Server took too long to respond
- **Phase errors**: Game got stuck in a phase (check logic)
- **Turn order errors**: Players couldn't take turns properly

## Output Files

- **test-log.txt**: Complete game log with all actions
- **test-errors.txt**: Any errors that occurred during the test

## Customization

Edit `automated-game.js` to:
- Change number of players (3-5)
- Adjust AI decision-making (bidding probability)
- Add more sophisticated AI strategies
- Increase/decrease delays between actions

## Testing Specific Features

The AI will automatically test:
- ✅ Room creation and joining
- ✅ Game start
- ✅ Turn-based bidding
- ✅ Standard auctions (bidding to win)
- ✅ Reverse auctions (bidding to avoid)
- ✅ Pawn Shop Trade card swaps
- ✅ Repo Man luxury card discards
- ✅ Game ending conditions
- ✅ Winner determination

## Troubleshooting

### Server Not Starting
If using `run-test.ps1` and server doesn't start:
1. Manually start the server: `cd ../server && npm run dev`
2. Wait for "WebSocket server ready" message
3. Re-run the test

### Test Hangs/Freezes
- Check `test-log.txt` to see where it got stuck
- The test has a 200-round safety limit
- Common causes: Game phase not advancing, turn order stuck

### Random Test Failures
- Some failures may be due to timing issues
- Try increasing delays in `automated-game.js`
- Look for race conditions in the server code

## Running Multiple Times

You can run the test multiple times to catch edge cases:

```powershell
# PowerShell - Run 10 times
for ($i=1; $i -le 10; $i++) {
    Write-Host "Test run $i"
    npm test
    Start-Sleep -Seconds 2
}
```

Each run will append to the log files, so you may want to delete them between runs.
