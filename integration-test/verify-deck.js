// Quick script to verify deck composition
import { buildItemDeck, LUXURY_CARDS, PRESTIGE_CARDS, DISGRACE_CARDS, SPECIAL_CARDS } from '../server/src/models/cards.js';

console.log('=== Deck Composition Verification ===\n');

console.log('LUXURY CARDS:', LUXURY_CARDS.length);
LUXURY_CARDS.forEach(card => console.log(`  - ${card.name} (${card.value})`));

console.log('\nPRESTIGE CARDS:', PRESTIGE_CARDS.length);
PRESTIGE_CARDS.forEach(card => console.log(`  - ${card.name} (${card.multiplier}x)`));

console.log('\nDISGRACE CARDS:', DISGRACE_CARDS.length);
DISGRACE_CARDS.forEach(card => console.log(`  - ${card.name} (${card.effect})`));

console.log('\nSPECIAL CARDS:', SPECIAL_CARDS.length);
SPECIAL_CARDS.forEach(card => console.log(`  - ${card.name} (${card.effect})`));

console.log('\n=== Building Test Deck ===\n');
const deck = buildItemDeck();
console.log(`Total cards in deck: ${deck.length}`);

const summary = {};
deck.forEach(card => {
  const key = card.type;
  summary[key] = (summary[key] || 0) + 1;
});

console.log('\nDeck breakdown:');
Object.entries(summary).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

console.log('\nSpecial cards in deck:');
const special = deck.filter(c => c.type === 'special' || c.type === 'disgrace');
special.forEach((card, idx) => {
  console.log(`  ${idx + 1}. ${card.name} (${card.type}) - Position in shuffled deck: ${deck.indexOf(card) + 1}`);
});

console.log('\n=== Probability Analysis ===');
console.log(`Pawn Shop Trade: 1/${deck.length} = ${(1/deck.length * 100).toFixed(1)}%`);
console.log(`Repo Man: 1/${deck.length} = ${(1/deck.length * 100).toFixed(1)}%`);
console.log(`Any Disgrace: 3/${deck.length} = ${(3/deck.length * 100).toFixed(1)}%`);
console.log(`\nExpected appearances in 10 games: ~0.6 times each`);
console.log(`Expected appearances in 20 games: ~1.2 times each`);
console.log(`Expected appearances in 50 games: ~3 times each`);
