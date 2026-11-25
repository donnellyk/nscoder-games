import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availableQuestions, dealDeck } from '../../games/trivia/js/deck.js';

const questions = [
  { id: 'a', category: 'swift' },
  { id: 'b', category: 'swift' },
  { id: 'c', category: 'tools' },
  { id: 'd', category: 'history' },
];

const identity = () => 0.999;

test('availableQuestions keeps chosen categories', () => {
  const ids = availableQuestions(questions, { categories: ['swift'] }).map((q) => q.id);
  assert.deepEqual(ids, ['a', 'b']);
});

test('availableQuestions drops asked questions when skipping them', () => {
  const settings = { categories: ['swift', 'tools'], skipAsked: true };
  const ids = availableQuestions(questions, settings, ['a']).map((q) => q.id);
  assert.deepEqual(ids, ['b', 'c']);
});

test('availableQuestions keeps asked questions when not skipping them', () => {
  const settings = { categories: ['swift'], skipAsked: false };
  assert.equal(availableQuestions(questions, settings, ['a']).length, 2);
});

test('dealDeck returns at most questionCount ids', () => {
  const settings = { categories: ['swift', 'tools', 'history'], questionCount: 2 };
  assert.equal(dealDeck(questions, settings, [], identity).length, 2);
});

test('dealDeck returns every available id when the count exceeds the pool', () => {
  const settings = { categories: ['swift', 'tools'], questionCount: 10 };
  assert.deepEqual([...dealDeck(questions, settings, [], identity)].sort(), ['a', 'b', 'c']);
});
