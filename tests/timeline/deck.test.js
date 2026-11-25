import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterItems, shuffle, dealDeck } from '../../games/timeline/js/deck.js';

const items = [
  { id: 'a', category: 'hardware', tier: 1 },
  { id: 'b', category: 'hardware', tier: 2 },
  { id: 'c', category: 'software', tier: 1 },
  { id: 'd', category: 'accessory', tier: 3 },
  { id: 'e', category: 'software', tier: 3 },
];

const fakeRandom = (queue) => {
  let i = 0;
  return () => queue[i++];
};

test('filterItems: filters by category and tier together', () => {
  const result = filterItems(items, { categories: ['hardware', 'software'], tiers: [1] });
  assert.deepEqual(result.map((i) => i.id), ['a', 'c']);
});

test('filterItems: no matches when nothing satisfies both filters', () => {
  assert.deepEqual(filterItems(items, { categories: ['accessory'], tiers: [1] }), []);
});

test('shuffle: is a Fisher-Yates permutation driven entirely by the injected random', () => {
  const result = shuffle(['A', 'B', 'C', 'D'], fakeRandom([0, 0, 0]));
  assert.deepEqual(result, ['B', 'C', 'D', 'A']);
});

test('shuffle: does not mutate its input', () => {
  const input = ['A', 'B', 'C'];
  shuffle(input, fakeRandom([0, 0]));
  assert.deepEqual(input, ['A', 'B', 'C']);
});

test('shuffle: same random sequence produces the same result', () => {
  const random = () => 0.5;
  assert.deepEqual(shuffle([1, 2, 3, 4], random), shuffle([1, 2, 3, 4], random));
});

test('dealDeck: filters first, then returns cardCount + 1 ids', () => {
  const deck = dealDeck(items, { categories: ['hardware', 'software'], tiers: [1, 2, 3], cardCount: 2 }, fakeRandom([0, 0, 0]));
  assert.equal(deck.length, 3);
  assert.ok(deck.every((id) => ['a', 'b', 'c', 'e'].includes(id)));
});

test('dealDeck: caps at the number of items the filter leaves', () => {
  const deck = dealDeck(items, { categories: ['accessory'], tiers: [3], cardCount: 10 }, fakeRandom([0]));
  assert.deepEqual(deck, ['d']);
});

test('dealDeck: the first id is meant to seed the timeline, the rest are cards to place', () => {
  const random = fakeRandom([0, 0, 0, 0]);
  const deck = dealDeck(items, { categories: ['hardware', 'software', 'accessory'], tiers: [1, 2, 3], cardCount: 3 }, random);
  assert.equal(deck.length, 4);
  assert.equal(new Set(deck).size, 4);
});

test('filterItems: skips excluded ids', () => {
  const result = filterItems(items, { categories: ['hardware', 'software'], excluded: ['a', 'gone'] });
  assert.deepEqual(result.map((i) => i.id), ['b', 'c', 'e']);
});

test('dealDeck: never deals an excluded item', () => {
  const deck = dealDeck(items, { excluded: ['a', 'c'], cardCount: 10 }, () => 0.5);
  assert.deepEqual([...deck].sort(), ['b', 'd', 'e']);
});
