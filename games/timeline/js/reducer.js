import { judge } from './judge.js';

export const initialState = {
  phase: 'setup',
  mode: 'headToHead',
  players: [],
  turn: 0,
  deck: [],
  timeline: [],
  current: null,
  hoverGap: null,
  pendingGap: null,
  lastResult: null,
  stats: { correct: 0, total: 0 },
  session: null,
  settings: {
    cardCount: 10,
    categories: ['hardware', 'software', 'accessory'],
    tiers: [1, 2, 3],
    excluded: [],
    theme: 'store',
  },
};

const insertAt = (list, index, value) => [...list.slice(0, index), value, ...list.slice(index)];

// A session spans several games; every item shown in one is withheld from the next.
const markUsed = (session, ids) =>
  session && { ...session, usedIds: [...new Set([...session.usedIds, ...ids.filter((id) => id !== null && id !== undefined)])] };

const nextTurn = (state) => (state.players.length ? (state.turn + 1) % state.players.length : 0);

const startGame = (state, action) => {
  const [seed, first, ...rest] = action.deck;
  const players = action.mode === 'headToHead'
    ? action.names.map((name) => ({ name, score: 0 }))
    : [];

  return {
    ...initialState,
    phase: 'playing',
    mode: action.mode,
    players,
    settings: action.settings ?? initialState.settings,
    timeline: [seed],
    current: first ?? null,
    deck: rest,
    session: state.session && {
      ...markUsed(state.session, [seed, first]),
      gamesPlayed: state.session.gamesPlayed + 1,
    },
  };
};

const configure = (state, action) =>
  state.phase !== 'setup'
    ? state
    : {
        ...state,
        mode: action.mode ?? state.mode,
        settings: { ...state.settings, ...action.settings },
      };

const hover = (state, action) =>
  action.gap === state.hoverGap ? state : { ...state, hoverGap: action.gap };

const drop = (itemsById) => (state, action) => {
  if (state.phase !== 'playing' || state.current === null) return state;

  const item = itemsById[state.current];
  const timelineItems = state.timeline.map((id) => itemsById[id]);
  const { correct, correctGap } = judge(timelineItems, item, action.gap);
  const scored = correct && state.mode === 'headToHead';

  return {
    ...state,
    timeline: insertAt(state.timeline, correctGap, state.current),
    players: scored
      ? state.players.map((p, i) => (i === state.turn ? { ...p, score: p.score + 1 } : p))
      : state.players,
    current: null,
    hoverGap: null,
    pendingGap: null,
    lastResult: {
      itemId: state.current,
      droppedGap: action.gap,
      correctGap,
      correct,
      playerIndex: state.mode === 'headToHead' ? state.turn : null,
    },
    stats: {
      total: state.stats.total + 1,
      correct: state.stats.correct + (correct ? 1 : 0),
    },
  };
};

const place = (state, action) =>
  state.phase !== 'playing' || state.current === null
    ? state
    : { ...state, pendingGap: action.gap, hoverGap: null };

const confirm = (itemsById) => (state) =>
  state.pendingGap === null ? state : drop(itemsById)(state, { gap: state.pendingGap });

const dealNext = (state) =>
  state.deck.length === 0
    ? { ...state, current: null, pendingGap: null, phase: 'finished' }
    : {
        ...state,
        current: state.deck[0],
        pendingGap: null,
        deck: state.deck.slice(1),
        session: markUsed(state.session, [state.deck[0]]),
      };

const next = (state) => {
  if (state.current !== null || state.phase !== 'playing') return state;
  const dealt = dealNext({ ...state, lastResult: null });
  return dealt.phase === 'finished' ? dealt : { ...dealt, turn: nextTurn(state) };
};

const skip = (state) =>
  state.phase !== 'playing' || state.current === null ? state : dealNext(state);

const adjustScore = (state, action) => ({
  ...state,
  players: state.players.map((p, i) =>
    i === action.playerIndex ? { ...p, score: p.score + action.delta } : p
  ),
});

const endGame = (state) => ({ ...state, pendingGap: null, phase: 'finished' });

const reset = (state) => ({
  ...initialState,
  settings: state.settings,
  mode: state.mode,
  session: state.session,
  players: state.players.map((p) => ({ ...p, score: 0 })),
});

const startSession = (state) =>
  state.phase !== 'setup' ? state : { ...state, session: { usedIds: [], gamesPlayed: 0 } };

const endSession = (state) => (state.phase !== 'setup' ? state : { ...state, session: null });

export const createReducer = (itemsById) => {
  const handlers = {
    configure,
    startSession,
    endSession,
    startGame,
    hover,
    drop: drop(itemsById),
    place,
    confirm: confirm(itemsById),
    next,
    skip,
    adjustScore,
    endGame,
    reset,
  };

  return (state = initialState, action) => (handlers[action.type]?.(state, action) ?? state);
};

export const unavailableIds = (state) => [
  ...(state.settings?.excluded ?? []),
  ...(state.session?.usedIds ?? []),
];

export const standings = (state) => {
  const sorted = [...state.players].sort((a, b) => b.score - a.score);
  return sorted.map((p, i) => ({
    ...p,
    rank: sorted.findIndex((x) => x.score === p.score) + 1,
  }));
};
