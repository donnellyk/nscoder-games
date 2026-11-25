import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, createReducer, standings, unavailableIds } from '../../games/timeline/js/reducer.js';

const itemsById = {
  seed: { id: 'seed', date: '1980' },
  p1: { id: 'p1', date: '1990' }, // slots after seed
  p2: { id: 'p2', date: '1970' }, // slots before seed
  p3: { id: 'p3', date: '2005' }, // slots after everything so far
  p4: { id: 'p4', date: '1975' },
  p5: { id: 'p5', date: '1960' },
};

const reducer = createReducer(itemsById);

const startHeadToHead = (deck, names = ['Alice', 'Bob']) =>
  reducer(initialState, { type: 'startGame', mode: 'headToHead', names, deck, settings: initialState.settings });

const startMass = (deck) =>
  reducer(initialState, { type: 'startGame', mode: 'mass', names: [], deck, settings: initialState.settings });

test('startGame: head-to-head seeds the timeline, deals the first card, zeroes scores', () => {
  const state = startHeadToHead(['seed', 'p1', 'p2', 'p3']);
  assert.equal(state.phase, 'playing');
  assert.deepEqual(state.players, [{ name: 'Alice', score: 0 }, { name: 'Bob', score: 0 }]);
  assert.deepEqual(state.timeline, ['seed']);
  assert.equal(state.current, 'p1');
  assert.deepEqual(state.deck, ['p2', 'p3']);
  assert.equal(state.turn, 0);
});

test('startGame: mass mode ignores names and keeps players empty', () => {
  const state = startMass(['seed', 'p1', 'p2']);
  assert.deepEqual(state.players, []);
  assert.equal(state.mode, 'mass');
});

test('hover: returns the same state object when the gap is unchanged', () => {
  const state = startHeadToHead(['seed', 'p1']);
  const hovered = reducer(state, { type: 'hover', gap: 1 });
  assert.notEqual(hovered, state);
  assert.equal(reducer(hovered, { type: 'hover', gap: 1 }), hovered);
});

test('drop: a correct answer scores the current player and inserts at the correct gap', () => {
  const started = startHeadToHead(['seed', 'p1', 'p2']);
  const dropped = reducer(started, { type: 'drop', gap: 1 });
  assert.deepEqual(dropped.timeline, ['seed', 'p1']);
  assert.equal(dropped.players[0].score, 1);
  assert.equal(dropped.current, null);
  assert.equal(dropped.hoverGap, null);
  assert.deepEqual(dropped.stats, { correct: 1, total: 1 });
  assert.deepEqual(dropped.lastResult, {
    itemId: 'p1', droppedGap: 1, correctGap: 1, correct: true, playerIndex: 0,
  });
});

test('drop: a wrong answer does not score but still places the card at its true spot', () => {
  const started = startHeadToHead(['seed', 'p2']); // p2 (1970) belongs before seed (1980)
  const dropped = reducer(started, { type: 'drop', gap: 1 }); // wrong: dropped after seed
  assert.deepEqual(dropped.timeline, ['p2', 'seed']);
  assert.equal(dropped.players[0].score, 0);
  assert.deepEqual(dropped.stats, { correct: 0, total: 1 });
  assert.equal(dropped.lastResult.correct, false);
  assert.equal(dropped.lastResult.correctGap, 0);
});

test('drop: ignored once a result is already showing', () => {
  const started = startHeadToHead(['seed', 'p1']);
  const dropped = reducer(started, { type: 'drop', gap: 1 });
  const droppedAgain = reducer(dropped, { type: 'drop', gap: 0 });
  assert.equal(droppedAgain, dropped);
});

test('next: rotates turn across two players and deals the next card', () => {
  const started = startHeadToHead(['seed', 'p1', 'p2']);
  const dropped = reducer(started, { type: 'drop', gap: 1 });
  const advanced = reducer(dropped, { type: 'next' });
  assert.equal(advanced.turn, 1);
  assert.equal(advanced.current, 'p2');
  assert.equal(advanced.deck.length, 0);
  assert.equal(advanced.lastResult, null);
});

test('next: rotates turn across three players and wraps back to 0', () => {
  const started = startHeadToHead(['seed', 'p1', 'p2', 'p3', 'p4'], ['A', 'B', 'C']);
  let state = started;
  state = reducer(reducer(state, { type: 'drop', gap: 1 }), { type: 'next' }); // A played, turn -> 1
  assert.equal(state.turn, 1);
  state = reducer(reducer(state, { type: 'drop', gap: 0 }), { type: 'next' }); // B played, turn -> 2
  assert.equal(state.turn, 2);
  state = reducer(reducer(state, { type: 'drop', gap: 3 }), { type: 'next' }); // C played, turn -> 0
  assert.equal(state.turn, 0);
});

test('next: finishes the game once the deck is empty', () => {
  const started = startHeadToHead(['seed', 'p1']);
  const finished = reducer(reducer(started, { type: 'drop', gap: 1 }), { type: 'next' });
  assert.equal(finished.phase, 'finished');
  assert.equal(finished.current, null);
});

test('next: ignored while a card is still waiting to be placed', () => {
  const started = startHeadToHead(['seed', 'p1']);
  assert.equal(reducer(started, { type: 'next' }), started);
});

test('mass mode: drop counts stats but never touches player scores', () => {
  const started = startMass(['seed', 'p1', 'p2']);
  const dropped = reducer(started, { type: 'drop', gap: 1 });
  assert.deepEqual(dropped.players, []);
  assert.deepEqual(dropped.stats, { correct: 1, total: 1 });
  assert.equal(dropped.lastResult.playerIndex, null);
  const advanced = reducer(dropped, { type: 'next' });
  assert.equal(advanced.turn, 0);
});

test('skip: discards the current card without scoring or passing the turn', () => {
  const started = startHeadToHead(['seed', 'p1', 'p2']);
  const skipped = reducer(started, { type: 'skip' });
  assert.equal(skipped.current, 'p2');
  assert.equal(skipped.deck.length, 0);
  assert.equal(skipped.turn, 0);
  assert.deepEqual(skipped.stats, { correct: 0, total: 0 });
  assert.deepEqual(skipped.timeline, ['seed']);
});

test('skip: finishes the game when the deck is empty', () => {
  const started = startHeadToHead(['seed', 'p1']);
  const skipped = reducer(started, { type: 'skip' });
  assert.equal(skipped.phase, 'finished');
  assert.equal(skipped.current, null);
});

test('adjustScore: applies a manual delta to one player', () => {
  const started = startHeadToHead(['seed', 'p1']);
  const adjusted = reducer(started, { type: 'adjustScore', playerIndex: 1, delta: 3 });
  assert.deepEqual(adjusted.players, [{ name: 'Alice', score: 0 }, { name: 'Bob', score: 3 }]);
});

test('endGame: moves to finished while keeping players and timeline', () => {
  const started = startHeadToHead(['seed', 'p1']);
  const ended = reducer(started, { type: 'endGame' });
  assert.equal(ended.phase, 'finished');
  assert.deepEqual(ended.timeline, started.timeline);
  assert.deepEqual(ended.players, started.players);
});

test('reset: returns to setup but keeps settings, mode, and player names with zeroed scores', () => {
  const started = startHeadToHead(['seed', 'p1', 'p2']);
  const dropped = reducer(started, { type: 'drop', gap: 1 });
  const reset = reducer(dropped, { type: 'reset' });
  assert.equal(reset.phase, 'setup');
  assert.equal(reset.mode, 'headToHead');
  assert.deepEqual(reset.players, [{ name: 'Alice', score: 0 }, { name: 'Bob', score: 0 }]);
  assert.deepEqual(reset.timeline, []);
  assert.deepEqual(reset.deck, []);
  assert.equal(reset.current, null);
  assert.deepEqual(reset.settings, initialState.settings);
});

test('unknown action: returns state unchanged', () => {
  const started = startHeadToHead(['seed', 'p1']);
  assert.equal(reducer(started, { type: 'notARealAction' }), started);
});

test('standings: sorts by score descending and lets ties share a rank', () => {
  const state = {
    ...initialState,
    players: [
      { name: 'Alice', score: 5 },
      { name: 'Bob', score: 8 },
      { name: 'Carol', score: 5 },
      { name: 'Dan', score: 1 },
    ],
  };
  assert.deepEqual(standings(state), [
    { name: 'Bob', score: 8, rank: 1 },
    { name: 'Alice', score: 5, rank: 2 },
    { name: 'Carol', score: 5, rank: 2 },
    { name: 'Dan', score: 1, rank: 4 },
  ]);
});

test('place: holds the card at a gap without judging or revealing', () => {
  const state = reducer(startHeadToHead(['seed', 'p1', 'p2']), { type: 'hover', gap: 0 });
  const placed = reducer(state, { type: 'place', gap: 0 });
  assert.equal(placed.pendingGap, 0);
  assert.equal(placed.hoverGap, null);
  assert.equal(placed.current, 'p1');
  assert.equal(placed.lastResult, null);
  assert.deepEqual(placed.timeline, ['seed']);
  assert.deepEqual(placed.stats, { correct: 0, total: 0 });
});

test('place: can move to another gap or back to the tray', () => {
  const placed = reducer(startHeadToHead(['seed', 'p1', 'p2']), { type: 'place', gap: 0 });
  assert.equal(reducer(placed, { type: 'place', gap: 1 }).pendingGap, 1);
  assert.equal(reducer(placed, { type: 'place', gap: null }).pendingGap, null);
});

test('place: ignored while a result is showing', () => {
  const resulted = reducer(startHeadToHead(['seed', 'p1', 'p2']), { type: 'drop', gap: 1 });
  assert.equal(reducer(resulted, { type: 'place', gap: 0 }), resulted);
});

test('confirm: judges the card at the pending gap and clears it', () => {
  const placed = reducer(startHeadToHead(['seed', 'p1', 'p2']), { type: 'place', gap: 0 });
  const confirmed = reducer(placed, { type: 'confirm' });
  assert.equal(confirmed.pendingGap, null);
  assert.equal(confirmed.current, null);
  assert.deepEqual(confirmed.lastResult, { itemId: 'p1', droppedGap: 0, correctGap: 1, correct: false, playerIndex: 0 });
  assert.deepEqual(confirmed.timeline, ['seed', 'p1']);
  assert.equal(confirmed.players[0].score, 0);
});

test('confirm: scores a correct pending placement', () => {
  const placed = reducer(startHeadToHead(['seed', 'p1', 'p2']), { type: 'place', gap: 1 });
  const confirmed = reducer(placed, { type: 'confirm' });
  assert.equal(confirmed.lastResult.correct, true);
  assert.equal(confirmed.players[0].score, 1);
});

test('confirm: ignored when no card is pending', () => {
  const state = startHeadToHead(['seed', 'p1', 'p2']);
  assert.equal(reducer(state, { type: 'confirm' }), state);
});

test('skip: clears a pending placement', () => {
  const placed = reducer(startHeadToHead(['seed', 'p1', 'p2']), { type: 'place', gap: 0 });
  const skipped = reducer(placed, { type: 'skip' });
  assert.equal(skipped.pendingGap, null);
  assert.equal(skipped.current, 'p2');
});

test('configure: merges mode and settings during setup', () => {
  const configured = reducer(initialState, { type: 'configure', mode: 'mass', settings: { categories: ['software'] } });
  assert.equal(configured.mode, 'mass');
  assert.deepEqual(configured.settings, { ...initialState.settings, categories: ['software'] });
});

test('configure: keeps the mode when only settings change', () => {
  const configured = reducer(initialState, { type: 'configure', settings: { cardCount: 5 } });
  assert.equal(configured.mode, 'headToHead');
  assert.equal(configured.settings.cardCount, 5);
});

test('configure: ignored once a game is playing', () => {
  const state = startHeadToHead(['seed', 'p1']);
  assert.equal(reducer(state, { type: 'configure', mode: 'mass' }), state);
});

test('session: starts empty during setup and ends on request', () => {
  const started = reducer(initialState, { type: 'startSession' });
  assert.deepEqual(started.session, { usedIds: [], gamesPlayed: 0 });
  assert.equal(reducer(started, { type: 'endSession' }).session, null);
});

test('session: records every item shown, including skipped cards', () => {
  const session = reducer(initialState, { type: 'startSession' });
  const game = reducer(session, { type: 'startGame', mode: 'mass', names: [], deck: ['seed', 'p1', 'p2', 'p3'], settings: initialState.settings });
  assert.deepEqual(game.session, { usedIds: ['seed', 'p1'], gamesPlayed: 1 });

  const skipped = reducer(game, { type: 'skip' });
  assert.deepEqual(skipped.session.usedIds, ['seed', 'p1', 'p2']);

  const next = reducer(reducer(skipped, { type: 'drop', gap: 1 }), { type: 'next' });
  assert.deepEqual(next.session.usedIds, ['seed', 'p1', 'p2', 'p3']);
});

test('session: cards never dealt stay unused when a game ends early', () => {
  const session = reducer(initialState, { type: 'startSession' });
  const game = reducer(session, { type: 'startGame', mode: 'mass', names: [], deck: ['seed', 'p1', 'p2', 'p3'], settings: initialState.settings });
  const ended = reducer(game, { type: 'endGame' });
  assert.deepEqual(ended.session.usedIds, ['seed', 'p1']);
});

test('session: survives reset and carries into the next game', () => {
  const session = reducer(initialState, { type: 'startSession' });
  const first = reducer(session, { type: 'startGame', mode: 'mass', names: [], deck: ['seed', 'p1'], settings: initialState.settings });
  const again = reducer(reducer(first, { type: 'endGame' }), { type: 'reset' });
  assert.deepEqual(again.session, { usedIds: ['seed', 'p1'], gamesPlayed: 1 });

  const second = reducer(again, { type: 'startGame', mode: 'mass', names: [], deck: ['p2', 'p3'], settings: initialState.settings });
  assert.deepEqual(second.session, { usedIds: ['seed', 'p1', 'p2', 'p3'], gamesPlayed: 2 });
});

test('session: no tracking without a session', () => {
  const game = startMass(['seed', 'p1', 'p2']);
  assert.equal(game.session, null);
  assert.equal(reducer(game, { type: 'skip' }).session, null);
});

test('unavailableIds: combines removed items with items used this session', () => {
  const state = { ...initialState, settings: { ...initialState.settings, excluded: ['a'] }, session: { usedIds: ['b'], gamesPlayed: 1 } };
  assert.deepEqual(unavailableIds(state), ['a', 'b']);
  assert.deepEqual(unavailableIds({ ...initialState, settings: { cardCount: 10 } }), []);
});

test('settings: default theme is the light store look', () => {
  assert.equal(initialState.settings.theme, 'store');
  assert.deepEqual(initialState.settings.excluded, []);
});
