export const initialState = {
  phase: 'setup',
  deck: [],
  index: 0,
  revealed: false,
  asked: [],
  settings: {
    questionCount: 20,
    categories: ['history', 'swift', 'frameworks', 'tools', 'platforms'],
    skipAsked: true,
    theme: 'store',
  },
};

const withAsked = (asked, id) => (asked.includes(id) ? asked : [...asked, id]);

const isPlaying = (state) => state.phase === 'playing';

const configure = (state, action) =>
  state.phase !== 'setup' ? state : { ...state, settings: { ...state.settings, ...action.settings } };

const startGame = (state, action) =>
  action.deck.length === 0
    ? state
    : {
        ...state,
        phase: 'playing',
        deck: action.deck,
        index: 0,
        revealed: false,
        asked: withAsked(state.asked, action.deck[0]),
      };

const flip = (state) => (isPlaying(state) ? { ...state, revealed: !state.revealed } : state);

const moveTo = (state, index) => ({
  ...state,
  index,
  revealed: false,
  asked: withAsked(state.asked, state.deck[index]),
});

const next = (state) => {
  if (!isPlaying(state)) return state;
  return state.index + 1 < state.deck.length ? moveTo(state, state.index + 1) : { ...state, phase: 'finished' };
};

const previous = (state) => (isPlaying(state) && state.index > 0 ? moveTo(state, state.index - 1) : state);

const endGame = (state) => (isPlaying(state) ? { ...state, phase: 'finished' } : state);

const reset = (state) => ({ ...initialState, settings: state.settings, asked: state.asked });

const forgetAsked = (state) => (state.phase === 'setup' ? { ...state, asked: [] } : state);

const handlers = { configure, startGame, flip, next, previous, endGame, reset, forgetAsked };

export const reducer = (state = initialState, action) => handlers[action.type]?.(state, action) ?? state;

export const currentQuestionId = (state) => (isPlaying(state) ? state.deck[state.index] : null);
