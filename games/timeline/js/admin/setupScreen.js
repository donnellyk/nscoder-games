import { items } from '../../data/items.js';
import { filterItems, dealDeck } from '../deck.js';
import { unavailableIds } from '../reducer.js';
import { escapeHtml } from './html.js';
import { mountItemList } from './itemList.js';
import { mountSessionPanel } from './sessionPanel.js';

const CATEGORY_CHOICES = [
  { value: 'everything', label: 'Everything', categories: ['hardware', 'software', 'accessory'] },
  { value: 'hardware', label: 'Hardware', categories: ['hardware'] },
  { value: 'software', label: 'Software', categories: ['software'] },
  { value: 'accessory', label: 'Accessories', categories: ['accessory'] },
];

const TIERS = [
  { value: 1, label: 'Everyone knows it' },
  { value: 2, label: 'Apple fans' },
  { value: 3, label: 'Deep cuts' },
];

const THEMES = [
  { value: 'store', label: 'Apple Store' },
  { value: 'dark', label: 'Dark' },
  { value: 'gameshow', label: 'Game show' },
];

const clampCardCount = (value) => Math.min(20, Math.max(1, Math.round(value) || 1));

const sameSet = (a, b) => a.length === b.length && a.every((v) => b.includes(v));
const categoriesFor = (choice) => (CATEGORY_CHOICES.find((c) => c.value === choice) ?? CATEGORY_CHOICES[0]).categories;
const choiceFor = (categories) =>
  (CATEGORY_CHOICES.find((c) => sameSet(c.categories, categories)) ?? CATEGORY_CHOICES[0]).value;

const deriveDraft = (state) => ({
  mode: state.mode,
  players: state.players.length ? state.players.map((p) => p.name) : ['', ''],
  cardCount: state.settings.cardCount,
  categoryChoice: choiceFor(state.settings.categories),
  tiers: state.settings.tiers,
  tiersTouched: false,
  excluded: state.settings.excluded ?? [],
  theme: state.settings.theme ?? 'store',
});

const validNames = (draft) => draft.players.map((n) => n.trim()).filter(Boolean);

// What gets dispatched as `state.settings`: `excluded` here is the host's
// manual removals only, never session use (see unavailableIdsFor below).
const settingsFor = (draft) => ({
  cardCount: draft.cardCount,
  categories: categoriesFor(draft.categoryChoice),
  tiers: draft.tiers,
  excluded: draft.excluded,
  theme: draft.theme,
});

// A session never repeats an item, so anywhere items get filtered or dealt
// for real (matching counts, the deck itself) excludes both manual removals
// and everything the session has already used.
const unavailableIdsFor = (draft, sessionUsedIds) =>
  unavailableIds({ settings: { excluded: draft.excluded }, session: sessionUsedIds ? { usedIds: sessionUsedIds } : null });

const matchingCount = (draft, sessionUsedIds) =>
  filterItems(items, { ...settingsFor(draft), excluded: unavailableIdsFor(draft, sessionUsedIds) }).length;

const isValid = (draft, sessionUsedIds) =>
  (draft.mode !== 'headToHead' || validNames(draft).length >= 2) && matchingCount(draft, sessionUsedIds) >= 2;

const sessionWarning = (session, count, cardCount) => {
  if (!session) return null;
  if (count < 2) return 'Not enough items left in this session to start a game — end the session or widen the filters.';
  if (count < cardCount + 1) return `Only ${count} item${count === 1 ? '' : 's'} left in this session — the game will be shorter than ${cardCount} cards. End the session or widen the filters for a full game.`;
  return null;
};

const playerRow = (name, index, removable) => `
  <div class="player-row">
    <input type="text" class="player-name" data-index="${index}" value="${escapeHtml(name)}" placeholder="Player ${index + 1}" />
    <button type="button" class="remove-player" data-action="remove-player" data-index="${index}" ${removable ? '' : 'disabled'}>Remove</button>
  </div>
`;

const playersField = (draft) => (draft.mode !== 'headToHead' ? '' : `
  <fieldset class="players-field">
    <legend>Players</legend>
    <div class="player-rows">
      ${draft.players.map((name, i) => playerRow(name, i, draft.players.length > 1)).join('')}
    </div>
    <button type="button" data-action="add-player">Add player</button>
  </fieldset>
`);

const shellTemplate = (draft) => `
  <section class="setup-screen">
    <h1>Timeline</h1>
    <p class="subtitle">Set up a game</p>

    <div data-slot="session"></div>

    <fieldset class="mode-field">
      <legend>Mode</legend>
      <label class="radio">
        <input type="radio" name="mode" value="headToHead" ${draft.mode === 'headToHead' ? 'checked' : ''} />
        Head-to-head
      </label>
      <label class="radio">
        <input type="radio" name="mode" value="mass" ${draft.mode === 'mass' ? 'checked' : ''} />
        Everyone plays
      </label>
    </fieldset>

    <div data-slot="players">${playersField(draft)}</div>

    <fieldset class="card-count-field">
      <legend>Cards to play</legend>
      <input type="number" id="card-count" min="1" max="20" value="${draft.cardCount}" />
    </fieldset>

    <fieldset class="category-field">
      <legend>Categories</legend>
      ${CATEGORY_CHOICES.map((c) => `
        <label class="radio">
          <input type="radio" name="category" value="${c.value}" ${draft.categoryChoice === c.value ? 'checked' : ''} />
          ${escapeHtml(c.label)}
        </label>
      `).join('')}
    </fieldset>

    <fieldset class="tiers-field">
      <legend>Tiers</legend>
      ${TIERS.map((t) => `
        <label class="checkbox">
          <input type="checkbox" data-group="tiers" value="${t.value}" ${draft.tiers.includes(t.value) ? 'checked' : ''} />
          ${escapeHtml(t.label)}
        </label>
      `).join('')}
    </fieldset>

    <fieldset class="theme-field">
      <legend>Theme</legend>
      ${THEMES.map((t) => `
        <label class="radio">
          <input type="radio" name="theme" value="${t.value}" ${draft.theme === t.value ? 'checked' : ''} />
          ${escapeHtml(t.label)}
        </label>
      `).join('')}
    </fieldset>

    <div data-slot="items"></div>

    <p class="match-count"></p>
    <p class="session-warning" hidden></p>

    <button type="button" class="start-button" data-action="start">Start game</button>
  </section>
`;

export const renderSetupScreen = (root, state, ctx) => {
  const draft = deriveDraft(state);
  let session = state.session;

  root.innerHTML = shellTemplate(draft);

  const sessionSlot = root.querySelector('[data-slot="session"]');
  const playersSlot = root.querySelector('[data-slot="players"]');
  const itemsSlot = root.querySelector('[data-slot="items"]');
  const matchCountEl = root.querySelector('.match-count');
  const warningEl = root.querySelector('.session-warning');
  const startBtn = root.querySelector('.start-button');

  const syncDerived = () => {
    const count = matchingCount(draft, session?.usedIds);
    matchCountEl.textContent = `${count} matching item${count === 1 ? '' : 's'}`;
    startBtn.disabled = !isValid(draft, session?.usedIds);

    const warning = sessionWarning(session, count, draft.cardCount);
    warningEl.textContent = warning ?? '';
    warningEl.hidden = !warning;

    sessionPanel.render(session, count);
  };

  const drawPlayers = () => {
    playersSlot.innerHTML = playersField(draft);
  };

  const sessionPanel = mountSessionPanel(sessionSlot, {
    onStart: () => {
      ctx.dispatch({ type: 'startSession' });
      session = { usedIds: [], gamesPlayed: 0 };
      syncDerived();
    },
    onEnd: () => {
      ctx.dispatch({ type: 'endSession' });
      session = null;
      syncDerived();
    },
  });

  const itemList = mountItemList(items, draft.excluded, session?.usedIds ?? [], {
    onChange: (excluded) => {
      draft.excluded = excluded;
      ctx.dispatch({ type: 'configure', settings: { excluded } });
      syncDerived();
    },
  });
  itemsSlot.append(itemList.element);

  syncDerived();

  root.onclick = (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    if (action === 'add-player') {
      draft.players = [...draft.players, ''];
      drawPlayers();
      return;
    }

    if (action === 'remove-player') {
      const index = Number(target.dataset.index);
      draft.players = draft.players.filter((_, i) => i !== index);
      drawPlayers();
      return;
    }

    if (action === 'start') {
      if (!isValid(draft, session?.usedIds)) return;
      const settings = settingsFor(draft);
      const deck = dealDeck(items, { ...settings, excluded: unavailableIdsFor(draft, session?.usedIds) });
      ctx.dispatch({
        type: 'startGame',
        mode: draft.mode,
        names: draft.mode === 'headToHead' ? validNames(draft) : [],
        deck,
        settings,
      });
    }
  };

  root.oninput = (event) => {
    const target = event.target;
    if (target.classList.contains('player-name')) {
      const index = Number(target.dataset.index);
      draft.players = draft.players.map((n, i) => (i === index ? target.value : n));
      return;
    }
    if (target.id === 'card-count') {
      draft.cardCount = clampCardCount(Number(target.value));
      ctx.dispatch({ type: 'configure', settings: { cardCount: draft.cardCount } });
      syncDerived();
    }
  };

  root.onchange = (event) => {
    const target = event.target;

    if (target.name === 'mode') {
      draft.mode = target.value;
      if (!draft.tiersTouched) draft.tiers = draft.mode === 'mass' ? [1] : [1, 2, 3];
      drawPlayers();
      ctx.dispatch({ type: 'configure', mode: draft.mode, settings: { tiers: draft.tiers } });
      syncDerived();
      return;
    }

    if (target.name === 'category') {
      draft.categoryChoice = target.value;
      ctx.dispatch({ type: 'configure', settings: { categories: categoriesFor(draft.categoryChoice) } });
      syncDerived();
      return;
    }

    if (target.name === 'theme') {
      draft.theme = target.value;
      ctx.dispatch({ type: 'configure', settings: { theme: draft.theme } });
      return;
    }

    if (target.dataset.group === 'tiers') {
      const value = Number(target.value);
      draft.tiersTouched = true;
      draft.tiers = target.checked ? [...draft.tiers, value] : draft.tiers.filter((t) => t !== value);
      ctx.dispatch({ type: 'configure', settings: { tiers: draft.tiers } });
      syncDerived();
      return;
    }

    if (target.id === 'card-count') {
      draft.cardCount = clampCardCount(Number(target.value));
      target.value = draft.cardCount;
      ctx.dispatch({ type: 'configure', settings: { cardCount: draft.cardCount } });
      syncDerived();
    }
  };
};
