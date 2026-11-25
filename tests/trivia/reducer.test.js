import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reducer, initialState, currentQuestionId } from '../../games/trivia/js/reducer.js';

const run = (actions, state = initialState) => actions.reduce(reducer, state);

const started = (deck = ['a', 'b', 'c']) => run([{ type: 'startGame', deck }]);

test('startGame deals the deck face down on the first card', () => {
  const state = started();
  assert.equal(state.phase, 'playing');
  assert.deepEqual(state.deck, ['a', 'b', 'c']);
  assert.equal(state.index, 0);
  assert.equal(state.revealed, false);
  assert.equal(currentQuestionId(state), 'a');
});

test('startGame records the first card as asked', () => {
  assert.deepEqual(started().asked, ['a']);
});

test('startGame ignores an empty deck', () => {
  assert.equal(run([{ type: 'startGame', deck: [] }]), initialState);
});

test('flip toggles the card between question and answer', () => {
  const flipped = reducer(started(), { type: 'flip' });
  assert.equal(flipped.revealed, true);
  assert.equal(reducer(flipped, { type: 'flip' }).revealed, false);
});

test('flip does nothing outside play', () => {
  assert.equal(reducer(initialState, { type: 'flip' }), initialState);
});

test('next moves to the next card face down and records it as asked', () => {
  const state = run([{ type: 'flip' }, { type: 'next' }], started());
  assert.equal(state.index, 1);
  assert.equal(state.revealed, false);
  assert.deepEqual(state.asked, ['a', 'b']);
});

test('next on the last card finishes the game', () => {
  const state = run([{ type: 'next' }, { type: 'next' }, { type: 'next' }], started());
  assert.equal(state.phase, 'finished');
  assert.equal(state.index, 2);
});

test('previous steps back face down and stops at the first card', () => {
  const back = run([{ type: 'next' }, { type: 'flip' }, { type: 'previous' }], started());
  assert.equal(back.index, 0);
  assert.equal(back.revealed, false);
  assert.equal(reducer(back, { type: 'previous' }), back);
});

test('asked never holds duplicates', () => {
  const state = run([{ type: 'next' }, { type: 'previous' }, { type: 'next' }], started());
  assert.deepEqual(state.asked, ['a', 'b']);
});

test('asked carries over into the next game', () => {
  const state = run([{ type: 'endGame' }, { type: 'reset' }, { type: 'startGame', deck: ['d'] }], started());
  assert.deepEqual(state.asked, ['a', 'd']);
});

test('reset returns to setup and keeps settings and asked', () => {
  const configured = run([{ type: 'configure', settings: { questionCount: 5 } }]);
  const state = run([{ type: 'startGame', deck: ['a'] }, { type: 'endGame' }, { type: 'reset' }], configured);
  assert.equal(state.phase, 'setup');
  assert.equal(state.settings.questionCount, 5);
  assert.deepEqual(state.asked, ['a']);
  assert.deepEqual(state.deck, []);
});

test('configure merges settings only during setup', () => {
  const state = run([{ type: 'configure', settings: { theme: 'dark' } }]);
  assert.equal(state.settings.theme, 'dark');
  assert.equal(state.settings.questionCount, initialState.settings.questionCount);
  const playing = started();
  assert.equal(reducer(playing, { type: 'configure', settings: { theme: 'dark' } }), playing);
});

test('forgetAsked clears the asked list during setup', () => {
  const state = run([{ type: 'endGame' }, { type: 'reset' }, { type: 'forgetAsked' }], started());
  assert.deepEqual(state.asked, []);
});

test('unknown actions return the same state', () => {
  assert.equal(reducer(initialState, { type: 'nope' }), initialState);
});
