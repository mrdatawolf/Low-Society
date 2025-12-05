# Continuous Integration Testing

## What is Continuous Testing?

Instead of running one game and stopping, continuous testing runs games **in an infinite loop** until you manually stop it (Ctrl+C).

## Why Use It?

### 🔄 Find Special Cards
Since the deck is shuffled randomly, special cards may not appear in every game:
- **Pawn Shop Trade**: ~6% chance per game (1 card in 17)
- **Repo Man**: ~6% chance per game (1 card in 17)
- **Other Disgrace Cards**: ~12% chance combined

Running 10-20 games almost guarantees you'll see all special cards!

### 🐛 Stress Testing
- Find rare edge cases
- Test server stability over time
- Catch memory leaks
- Find race conditions
- Test with different deck shuffles

### 📊 Gather Statistics
- Track how often special cards appear
- Measure average game duration
- Identify most common winners
- Analyze bid patterns

### 🌙 Overnight Testing
Leave it running overnight to rack up hundreds of test games and catch rare bugs.

## How to Use

### PowerShell (Recommended)
```powershell
cd integration-test
.\run-continuous.ps1
```

### Batch File
```cmd
cd integration-test
run-continuous.bat
```

## What You'll See

### Live Console Output
```
=== Low Society Continuous Testing ===
Tests will run continuously until you press Ctrl+C

Starting continuous test loop...
Press Ctrl+C to stop testing

========================================

--- Test Run #1 ---
✅ PASSED

Statistics (After 1 runs):
  ✅ Passed: 1
  🔄 Pawn Shop Trade: 0 (0%)
  🚨 Repo Man: 0 (0%)
  ⚠️  Reverse Auctions: 0 (0%)
  ⏱️  Duration: 28.5 seconds

--- Test Run #2 ---
✅ PASSED
  🚨 Repo Man appeared!

Statistics (After 2 runs):
  ✅ Passed: 2
  🔄 Pawn Shop Trade: 0 (0%)
  🚨 Repo Man: 1 (50%)
  ⚠️  Reverse Auctions: 1 (50%)
  ⏱️  Duration: 31.2 seconds

--- Test Run #3 ---
✅ PASSED
  🔄 Pawn Shop Trade appeared!

Statistics (After 3 runs):
  ✅ Passed: 3
  🔄 Pawn Shop Trade: 1 (33%)
  🚨 Repo Man: 1 (33%)
  ⚠️  Reverse Auctions: 1 (33%)
  ⏱️  Duration: 29.8 seconds
```

### Special Card Indicators
- **🔄 Pawn Shop Trade appeared!** - Cyan/Magenta
- **🚨 Repo Man appeared!** - Yellow
- **⚠️ Reverse Auction** - Dark Yellow

### Statistics Tracking
After each game, you see:
- **Total runs** completed
- **Pass/Fail count**
- **Pawn Shop Trade**: Count and percentage
- **Repo Man**: Count and percentage
- **Reverse Auctions**: Count and percentage
- **Duration**: How long the last game took

## Output Files

### test-continuous.log
Contains **full game logs** for:
- Every failed game (with error details)
- Every game with Pawn Shop Trade
- Every game with Repo Man

This file can get large! Only interesting games are logged.

### test-continuous-summary.txt
**Live updated** stats file showing:
- Current run number
- Pass/fail counts
- Special card percentages
- Last update timestamp

Open this file in a text editor and it updates in real-time!

## How to Stop

Press **Ctrl+C** in the console window.

You'll see a final summary:
```
========================================
Continuous Testing Stopped
========================================

Final Statistics:
  Total Runs: 25
  ✅ Passed: 25
  🔄 Pawn Shop Trade: 2 (8%)
  🚨 Repo Man: 1 (4%)
  ⚠️ Reverse Auctions: 5 (20%)

Detailed logs saved to:
  - test-continuous.log
  - test-continuous-summary.txt
```

## Expected Results

Based on card probabilities:

| Feature | Expected Rate | After 10 Games | After 50 Games |
|---------|--------------|----------------|----------------|
| Pawn Shop Trade | ~6% | 0-2 appearances | 2-5 appearances |
| Repo Man | ~6% | 0-2 appearances | 2-5 appearances |
| Any Disgrace | ~18% | 1-3 games | 7-12 games |
| Reverse Auction | ~18% | 1-3 games | 7-12 games |

## Performance Notes

- **Average game duration**: 25-35 seconds
- **Memory usage**: Stable (~50MB per test)
- **Server load**: Minimal (4 AI clients)
- **Recommended duration**: 10-100 games for thorough testing

## Use Cases

### Development
```powershell
# Quick check after code changes
.\run-continuous.ps1
# Let it run 5-10 games, then Ctrl+C
```

### Before Deploying
```powershell
# Thorough testing
.\run-continuous.ps1
# Let it run 50+ games
# Check test-continuous.log for any errors
```

### Finding Bugs
```powershell
# Leave running overnight
.\run-continuous.ps1
# Check in the morning
# Review test-continuous-summary.txt for failure rate
```

### Testing Specific Cards
```powershell
# Run until you see the card you want to test
.\run-continuous.ps1
# Watch for "🔄 Pawn Shop Trade appeared!"
# Or "🚨 Repo Man appeared!"
# Then Ctrl+C to stop
```

## Troubleshooting

### Script Won't Stop with Ctrl+C
- Press Ctrl+C multiple times
- Close the PowerShell window
- Check Task Manager for node.exe processes

### Tests Start Failing After Many Runs
- Could indicate memory leak
- Check test-continuous.log for error patterns
- Restart server and try again

### No Special Cards After 20+ Games
- You're unlucky! Keep running
- Or temporarily modify deck order in cards.js
- Expected: ~1 Pawn Shop Trade per 17 games

### Server Crashes
- Check server console for errors
- Might indicate bug under load
- This is exactly what we want to find!

## Tips

1. **Monitor Both Windows**: Keep the server console and test console visible
2. **Check Logs Regularly**: Open test-continuous-summary.txt to track progress
3. **Set Expectations**: Don't expect special cards every game
4. **Be Patient**: Some runs might take 40+ seconds
5. **Watch for Patterns**: If failures occur, check if they're related to specific cards

## Advanced Usage

### Custom Number of Runs
The PowerShell script runs forever, but you can modify it to stop after N runs by editing the while loop condition.

### Parallel Testing
Run multiple instances in separate PowerShell windows (use different ports or run on different machines).

### Automated Reporting
Parse test-continuous.log with scripts to generate reports.

## Success Criteria

After 50+ continuous runs, you should see:
- ✅ 95%+ pass rate
- ✅ At least 2-3 Pawn Shop Trade appearances
- ✅ At least 2-3 Repo Man appearances
- ✅ No crashes or hangs
- ✅ Consistent performance (25-35 sec per game)

If you hit these targets, your game is **rock solid**! 🎉
