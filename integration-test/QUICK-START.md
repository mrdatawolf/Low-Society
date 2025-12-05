# Quick Start Guide - Integration Testing

## TL;DR - Run a Test NOW

### Single Test
**Windows PowerShell:**
```powershell
cd integration-test
.\run-test.ps1
```

**Windows CMD:**
```cmd
cd integration-test
run-test.bat
```

**Manual:**
```bash
cd integration-test
npm install  # First time only
npm test
```

### Continuous Testing (Loop Until Ctrl+C)
**Windows PowerShell:**
```powershell
cd integration-test
.\run-continuous.ps1
```

**Windows CMD:**
```cmd
cd integration-test
run-continuous.bat
```

Runs games forever until you press Ctrl+C. Perfect for finding special cards!

## What Happens

1. **4 AI players connect** (Alice, Bob, Charlie, Dave)
2. **Create a game room**
3. **Play through entire game** automatically
4. **Log everything** to `test-log.txt`
5. **Report errors** to `test-errors.txt`
6. **Show winner** at the end

## Output Files

- `test-log.txt` - Every action, bid, pass, etc.
- `test-errors.txt` - Only contains errors (empty = good!)

## What Gets Tested

✅ Room creation and joining
✅ Game start
✅ Turn-based bidding
✅ Passing
✅ Standard auctions
✅ Reverse auctions (if disgrace cards appear)
✅ Pawn Shop Trade (if special card appears)
✅ Repo Man (if Repo Man card appears)
✅ Game ending
✅ Winner determination

## Common Questions

### Q: Do I need the server running?
**PowerShell script**: No, it starts the server for you
**Batch/Manual**: Yes, start it first: `cd ../server && npm run dev`

### Q: How long does it take?
**30-60 seconds** for a complete game

### Q: Can I run it multiple times?
**Yes!** Great for finding edge cases:
```powershell
# Run 10 times
for ($i=1; $i -le 10; $i++) { npm test; Start-Sleep -Seconds 2 }
```

### Q: What if it fails?
1. Check `test-errors.txt` for details
2. Check `test-log.txt` to see where it got stuck
3. Common issues:
   - Server not running (port 3003)
   - Port already in use
   - Connection timeout

### Q: How do I test Pawn Shop Trade or Repo Man specifically?
These cards appear randomly in the deck. Run the test multiple times, or temporarily modify the deck order in `server/src/models/cards.js` to force these cards to appear first.

### Q: Can I change the AI behavior?
Yes! Edit `automated-game.js`:
- Line 357: Change bidding probability (currently 70%)
- Add more sophisticated strategies
- Change delays between actions

## Success Indicators

✅ "GAME OVER" appears in console
✅ Winner is announced
✅ `test-errors.txt` is empty (just header)
✅ All players disconnected cleanly

## Failure Indicators

❌ Test hangs/freezes (check last action in `test-log.txt`)
❌ Connection errors (server not running?)
❌ Phase errors (game stuck in a phase)
❌ Errors in `test-errors.txt`

## Advanced Usage

### Test with Different Player Counts
Edit `automated-game.js`, line 309:
```javascript
const players = [
  new AIPlayer('Alice', 1),
  new AIPlayer('Bob', 2),
  new AIPlayer('Charlie', 3),
  // Add more for 5 players
  // new AIPlayer('Eve', 4),
  // new AIPlayer('Frank', 5),
];
```

### Continuous Testing
Leave running overnight to catch rare bugs:
```powershell
while ($true) {
  npm test
  Start-Sleep -Seconds 5
}
```

### Check for Memory Leaks
```bash
node --expose-gc automated-game.js
```

## Troubleshooting

### "EADDRINUSE" Error
Port 3003 is already taken. Either:
- Use the running server
- Kill the process on port 3003
- Change port in `automated-game.js` line 5

### Test Hangs at "Waiting for turn..."
- Game logic issue with turn advancement
- Check `test-log.txt` for last successful action
- Report the issue with the log file

### Connection Timeout
- Server might be slow to start
- Increase timeout in `automated-game.js` line 63
- Check server is actually running: `http://localhost:3003/api/health`

## File Structure

```
integration-test/
├── automated-game.js       # Main test script (Node.js + Socket.io)
├── package.json           # Dependencies
├── run-test.ps1          # PowerShell runner (auto-starts server)
├── run-test.bat          # Batch file runner
├── README.md             # Full documentation
├── QUICK-START.md        # This file
├── SUMMARY.md            # Latest test results
├── test-log.txt          # Generated: Full game log
└── test-errors.txt       # Generated: Errors only
```

## Need Help?

1. Check `README.md` for detailed info
2. Look at `test-log.txt` to see what happened
3. Check `test-errors.txt` for error details
4. Review `SUMMARY.md` for example successful run
