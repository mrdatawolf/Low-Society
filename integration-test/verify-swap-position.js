// Verify that Pawn Shop Trade always appears in positions 8-15
import { buildItemDeck } from '../server/src/models/cards.js';

console.log('=== Verifying Swap Card Position (100 trials) ===\n');

const positions = [];
let minPosition = 15;
let maxPosition = 1;

for (let trial = 0; trial < 100; trial++) {
  const deck = buildItemDeck();
  const swapCardIndex = deck.findIndex(card => card.effect === 'card-swap');
  const position = swapCardIndex + 1; // Convert 0-based to 1-based

  positions.push(position);
  minPosition = Math.min(minPosition, position);
  maxPosition = Math.max(maxPosition, position);
}

console.log(`Minimum position seen: ${minPosition}`);
console.log(`Maximum position seen: ${maxPosition}`);
console.log(`Expected range: 8-15`);

if (minPosition >= 8 && maxPosition <= 15) {
  console.log('\n✅ SUCCESS: Swap card always appears in positions 8-15');
} else {
  console.log('\n❌ FAILURE: Swap card appeared outside expected range!');
}

// Show distribution
const distribution = {};
for (let i = 8; i <= 15; i++) {
  distribution[i] = positions.filter(p => p === i).length;
}

console.log('\nPosition distribution:');
Object.entries(distribution).forEach(([pos, count]) => {
  const bar = '█'.repeat(Math.round(count / 2));
  console.log(`  Position ${pos}: ${count} ${bar}`);
});

console.log(`\nAverage position: ${(positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(1)}`);
console.log('Expected average: ~11.5 (middle of 8-15 range)');
