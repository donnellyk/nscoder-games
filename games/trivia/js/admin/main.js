import { openChannel, stateMessage } from '../../../../shared/channel.js';
import { createStore } from '../../../../shared/store.js';
import { reducer, initialState } from '../reducer.js';
import { questionsById } from '../../data/questions.js';
import { mountSetupScreen } from './setupScreen.js';
import { mountPlayScreen } from './playScreen.js';
import { mountFinishedScreen } from './finishedScreen.js';

const root = document.getElementById('app');
const view = { helloReceived: false };
const channel = openChannel('trivia');

const mounters = {
  setup: mountSetupScreen,
  playing: mountPlayScreen,
  finished: mountFinishedScreen,
};

// Each phase mounts once and then only updates, so inputs keep focus while
// their own `configure` dispatches echo back.
let activePhase = null;
let activeUpdate = null;

const render = (state) => {
  if (state.phase === activePhase) {
    activeUpdate(state);
    return;
  }
  activePhase = state.phase;
  root.onclick = null;
  root.oninput = null;
  root.onchange = null;
  activeUpdate = mounters[state.phase](root, state, ctx);
};

const store = createStore({
  reducer,
  initialState,
  storageKey: 'trivia-state',
  channel,
  onHello: () => {
    view.helloReceived = true;
    render(store.getState());
  },
});

const ctx = {
  dispatch: store.dispatch,
  getState: store.getState,
  questionsById,
  view,
  openGameView: () => window.open('game.html', 'trivia-game-view'),
};

const KEY_ACTIONS = {
  Space: 'flip',
  ArrowRight: 'next',
  ArrowLeft: 'previous',
};

document.addEventListener('keydown', (event) => {
  const type = KEY_ACTIONS[event.code];
  const tag = document.activeElement?.tagName;
  if (!type || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (store.getState().phase !== 'playing') return;
  event.preventDefault();
  store.dispatch({ type });
});

store.subscribe(render);
render(store.getState());
channel.send(stateMessage(store.getState()));
