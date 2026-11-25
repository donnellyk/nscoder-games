import { test } from 'node:test';
import assert from 'node:assert/strict';
import { items } from '../../games/timeline/data/items.js';

const CATEGORIES = new Set(['hardware', 'software', 'accessory']);
const DATE_PATTERN = /^\d{4}(-\d{2}(-\d{2})?)?$/;

const isRealDate = (date) => {
  const [year, month, day] = date.split('-').map(Number);
  if (month === undefined) return true;
  if (month < 1 || month > 12) return false;
  if (day === undefined) return true;
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
};

const isValidUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const decadeOf = (date) => `${date.slice(0, 3)}0s`;

test('every item has a unique id', () => {
  const ids = items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every item has a unique name (case-insensitive)', () => {
  const names = items.map((item) => item.name.trim().toLowerCase());
  assert.equal(new Set(names).size, names.length);
});

test('every item has an allowed category', () => {
  assert.ok(items.every((item) => CATEGORIES.has(item.category)));
});

test('every item has a tier between 1 and 3', () => {
  assert.ok(items.every((item) => Number.isInteger(item.tier) && item.tier >= 1 && item.tier <= 3));
});

test('every item date matches the expected format and is a real calendar date', () => {
  assert.ok(items.every((item) => DATE_PATTERN.test(item.date)));
  assert.ok(items.every((item) => isRealDate(item.date)));
});

test('every item source parses as a URL', () => {
  assert.ok(items.every((item) => isValidUrl(item.source)));
});

test('every item has a non-empty fact and name', () => {
  assert.ok(items.every((item) => item.fact.trim().length > 0));
  assert.ok(items.every((item) => item.name.trim().length > 0));
});

test('no two items share an exact date string', () => {
  const dates = items.map((item) => item.date);
  assert.equal(new Set(dates).size, dates.length);
});

test('each decade from the 1980s through the 2020s has at least its minimum item count', () => {
  const minimums = { '1980s': 30, '1990s': 30, '2000s': 10, '2010s': 10, '2020s': 10 };
  const counts = items.reduce((acc, item) => {
    const decade = decadeOf(item.date);
    acc[decade] = (acc[decade] ?? 0) + 1;
    return acc;
  }, {});
  assert.ok(
    Object.entries(minimums).every(([decade, min]) => (counts[decade] ?? 0) >= min),
    JSON.stringify(counts)
  );
});

test('there are at least 45 tier-1 items', () => {
  const tier1Count = items.filter((item) => item.tier === 1).length;
  assert.ok(tier1Count >= 45, `only ${tier1Count} tier-1 items`);
});

test('there are at least 165 items total', () => {
  assert.ok(items.length >= 165, `only ${items.length} items`);
});
