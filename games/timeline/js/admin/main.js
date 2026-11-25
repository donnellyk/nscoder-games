import { openChannel, stateMessage } from '../../../../shared/channel.js';
import { createStore } from '../../../../shared/store.js';
import { createReducer, initialState } from '../reducer.js';
import { itemsById } from '../../data/items.js';
import { renderSetupScreen } from './setupScreen.js';
import { mountPlayScreen } from './playScreen.js';
import { renderFinishedScreen } from './finishedScreen.js';

const SHOW_DATES_KEY = 'timeline-admin-show-dates';

const loadShowDates = () => {
  try {
    return localStorage.getItem(SHOW_DATES_KEY) === 'true';
  } catch {
    return false;
  }
};

const saveShowDates = (value) => {
  try {
    localStorage.setItem(SHOW_DATES_KEY, String(value));
  } catch {
    // storage unavailable; the toggle still works for this session
  }
};

const root = document.getElementById('app');

const view = {
  showDatesToHost: loadShowDates(),
  helloReceived: false,
};

const channel = openChannel('timeline');

// Persistent per phase: each phase is mounted once when entered, then only
// updated. Rebuilding the DOM on every dispatch would rip the draggable card
// out from under an in-progress drag, and would drop focus/typing in the
// setup screen's text inputs every time a `configure` dispatch echoes back.
let activePhase = null;
let activeUpdate = null;

const render = (state) => {
  if (state.phase !== activePhase) {
    root.innerHTML = '';
    activePhase = state.phase;
    activeUpdate = null;

    if (state.phase === 'setup') {
      renderSetupScreen(root, state, ctx);
    } else if (state.phase === 'finished') {
      renderFinishedScreen(root, state, ctx);
    } else {
      activeUpdate = mountPlayScreen(root, state, ctx);
    }
    return;
  }

  activeUpdate?.(state);
};

const store = createStore({
  reducer: createReducer(itemsById),
  initialState,
  storageKey: 'timeline-state',
  channel,
  onHello: () => {
    view.helloReceived = true;
    render(store.getState());
  },
});

const ctx = {
  dispatch: store.dispatch,
  itemsById,
  view,
  channel,
  openGameView: () => window.open('game.html', 'timeline-game-view'),
  toggleShowDates: () => {
    view.showDatesToHost = !view.showDatesToHost;
    saveShowDates(view.showDatesToHost);
    render(store.getState());
  },
};

store.subscribe(render);

document.addEventListener('keydown', (event) => {
  if (event.code !== 'Space') return;
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  const state = store.getState();
  if (state.phase !== 'playing') return;

  // Space is the primary action: confirm a pending drop, or deal the next
  // card once a result is showing. It does nothing while a card is still
  // waiting to be placed.
  if (state.pendingGap !== null) {
    event.preventDefault();
    store.dispatch({ type: 'confirm' });
  } else if (state.current === null) {
    event.preventDefault();
    store.dispatch({ type: 'next' });
  }
});

render(store.getState());
channel.send(stateMessage(store.getState()));
