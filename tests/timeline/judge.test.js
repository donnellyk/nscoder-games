import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidGap, correctGap, judge } from '../../games/timeline/js/judge.js';

// Timeline already in date order: Apple II (1977), Macintosh (1984-01-24),
// iTunes (2001-01), iPhone (2007-06-29).
const timeline = [
  { id: 'apple2', date: '1977' },
  { id: 'mac', date: '1984-01-24' },
  { id: 'itunes', date: '2001-01' },
  { id: 'iphone', date: '2007-06-29' },
];

test('isValidGap: only the leftmost gap works for an item before everything', () => {
  const item = { id: 'x', date: '1970' };
  assert.equal(isValidGap(timeline, item, 0), true);
  assert.equal(isValidGap(timeline, item, 1), false);
});

test('isValidGap: only the rightmost gap works for an item after everything', () => {
  const item = { id: 'x', date: '2020' };
  assert.equal(isValidGap(timeline, item, 3), false);
  assert.equal(isValidGap(timeline, item, 4), true);
});

test('isValidGap: a single gap in the middle works', () => {
  const item = { id: 'x', date: '1990' };
  assert.equal(isValidGap(timeline, item, 1), false);
  assert.equal(isValidGap(timeline, item, 2), true);
  assert.equal(isValidGap(timeline, item, 3), false);
});

test('isValidGap: overlapping month-only ranges accept either order', () => {
  const single = [{ id: 'x', date: '2001-01' }];
  const item = { id: 'y', date: '2001-01' };
  assert.equal(isValidGap(single, item, 0), true);
  assert.equal(isValidGap(single, item, 1), true);
});

test('isValidGap: overlapping year-only range accepts either side of a month-precision card', () => {
  const single = [{ id: 'x', date: '2001-01' }];
  const item = { id: 'y', date: '2001' };
  assert.equal(isValidGap(single, item, 0), true);
  assert.equal(isValidGap(single, item, 1), true);
});

// Two valid gaps flank an invalid stretch, used to test that correctGap picks
// the nearest valid gap rather than the first or last.
const spread = [
  { id: 'a', date: '1970' },
  { id: 'b', date: '2001-01' },
  { id: 'c', date: '2001-06' },
  { id: 'd', date: '2030' },
];

test('correctGap: returns the dropped gap itself when it is valid', () => {
  const item = { id: 'y', date: '2001' };
  assert.equal(correctGap(spread, item, 2), 2);
});

test('correctGap: nearest valid gap to an out-of-range drop on the left', () => {
  const item = { id: 'y', date: '2001' };
  assert.equal(correctGap(spread, item, 0), 1);
});

test('correctGap: nearest valid gap to an out-of-range drop on the right', () => {
  const item = { id: 'y', date: '2001' };
  assert.equal(correctGap(spread, item, 4), 3);
});

test('judge: correct drop reports correct and matching correctGap', () => {
  const item = { id: 'y', date: '2001' };
  assert.deepEqual(judge(spread, item, 2), { correct: true, correctGap: 2 });
});

test('judge: wrong drop reports incorrect with the nearest valid gap', () => {
  const item = { id: 'y', date: '2001' };
  assert.deepEqual(judge(spread, item, 0), { correct: false, correctGap: 1 });
});

test('judge: dropping into an empty timeline is always correct at gap 0', () => {
  const item = { id: 'y', date: '1999' };
  assert.deepEqual(judge([], item, 0), { correct: true, correctGap: 0 });
});
