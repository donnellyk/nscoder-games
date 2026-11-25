import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dateRange, formatDate, yearOf } from '../../games/timeline/js/dates.js';

test('dateRange: day precision spans just that day', () => {
  const [start, end] = dateRange('2007-06-29');
  assert.equal(start, Date.UTC(2007, 5, 29, 0, 0, 0, 0));
  assert.equal(end, Date.UTC(2007, 5, 29, 23, 59, 59, 999));
});

test('dateRange: month precision spans the whole month', () => {
  const [start, end] = dateRange('2010-04');
  assert.equal(start, Date.UTC(2010, 3, 1, 0, 0, 0, 0));
  assert.equal(end, Date.UTC(2010, 3, 30, 23, 59, 59, 999));
});

test('dateRange: month precision handles a 31-day month', () => {
  const [, end] = dateRange('2010-01');
  assert.equal(end, Date.UTC(2010, 0, 31, 23, 59, 59, 999));
});

test('dateRange: year precision spans the whole year', () => {
  const [start, end] = dateRange('1977');
  assert.equal(start, Date.UTC(1977, 0, 1, 0, 0, 0, 0));
  assert.equal(end, Date.UTC(1977, 11, 31, 23, 59, 59, 999));
});

test('formatDate: day precision', () => {
  assert.equal(formatDate('2007-06-29'), 'June 29, 2007');
});

test('formatDate: month precision', () => {
  assert.equal(formatDate('2010-04'), 'April 2010');
});

test('formatDate: year precision', () => {
  assert.equal(formatDate('1977'), '1977');
});

test('yearOf: extracts the year at each precision', () => {
  assert.equal(yearOf('2007-06-29'), 2007);
  assert.equal(yearOf('2010-04'), 2010);
  assert.equal(yearOf('1977'), 1977);
});
