import { test } from 'node:test';
import assert from 'node:assert/strict';
import { questions, categories } from '../../games/trivia/data/questions.js';

const categoryIds = new Set(categories.map((c) => c.id));
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;

test('there are 100 questions', () => {
  assert.equal(questions.length, 100);
});

test('every question has a unique id', () => {
  const ids = questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every question has text, an answer, and a known category', () => {
  questions.forEach((q) => {
    assert.ok(nonEmpty(q.question), `${q.id} question`);
    assert.ok(nonEmpty(q.answer), `${q.id} answer`);
    assert.ok(categoryIds.has(q.category), `${q.id} category ${q.category}`);
  });
});

test('details, when present, are non-empty strings', () => {
  questions.filter((q) => 'detail' in q).forEach((q) => assert.ok(nonEmpty(q.detail), q.id));
});

test('every category has questions', () => {
  categories.forEach((c) => assert.ok(questions.some((q) => q.category === c.id), c.id));
});
