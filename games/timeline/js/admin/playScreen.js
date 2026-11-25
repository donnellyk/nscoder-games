import { formatDate } from '../dates.js';
import { el } from '../../../../shared/dom.js';
import { mountStage } from '../game/stage.js';
import { makeDraggable } from './drag.js';
import { dragMessage } from '../../../../shared/channel.js';

const END_GAME_CONFIRM_MS = 3000;

// Module-level so a confirmation started on one game doesn't leak state into
// the next; reset at the top of every mount instead. `activeResetConfirm`
// lets a single, permanent document click listener (registered once below)
// always cancel whichever mount is currently live.
let confirmingEndGame = false;
let confirmTimer = null;
let activeResetConfirm = null;

// Any click outside the End game button cancels a pending confirmation.
document.addEventListener('click', (event) => {
  if (!confirmingEndGame) return;
  if (event.target.closest?.('.end-game-button')) return;
  activeResetConfirm?.();
});

const buildStatusBar = (ctx) => {
  const deckCount = el('span', { class: 'deck-count' });
  const showDatesInput = el('input', { type: 'checkbox', 'data-action': 'toggle-dates' });
  const openGameViewBtn = el('button', { type: 'button', 'data-action': 'open-game-view' }, ['Open game view']);
  const helloStatus = el('span', { class: 'hello-status' });

  const element = el('div', { class: 'status-bar' }, [
    deckCount,
    el('label', { class: 'show-dates-toggle' }, [showDatesInput, ' Show dates to host']),
    openGameViewBtn,
    helloStatus,
  ]);

  const update = (state) => {
    deckCount.textContent = `${state.deck.length} card${state.deck.length === 1 ? '' : 's'} remaining`;
    showDatesInput.checked = ctx.view.showDatesToHost;
    helloStatus.textContent = ctx.view.helloReceived ? 'Game view connected' : 'Waiting for game view…';
    helloStatus.classList.toggle('connected', ctx.view.helloReceived);
  };

  return { element, update };
};

const buildScoreTable = (state) => {
  if (!state.players.length) return { element: null, update: () => {} };

  const rows = state.players.map((player, index) => {
    const scoreCell = el('td', { class: 'player-score' }, [String(player.score)]);
    const row = el('tr', {}, [
      el('td', { class: 'player-name' }, [player.name]),
      scoreCell,
      el('td', { class: 'score-buttons' }, [
        el('button', { type: 'button', 'data-action': 'score-minus', 'data-index': index }, ['−']),
        el('button', { type: 'button', 'data-action': 'score-plus', 'data-index': index }, ['+']),
      ]),
    ]);
    return { row, scoreCell };
  });

  const element = el('table', { class: 'score-table' }, [el('tbody', {}, rows.map((r) => r.row))]);

  const update = (nextState) => rows.forEach(({ row, scoreCell }, index) => {
    row.classList.toggle('current-turn', index === nextState.turn);
    scoreCell.textContent = String(nextState.players[index].score);
  });

  return { element, update };
};

const buildMassStats = () => {
  const element = el('p', { class: 'mass-stats' });
  const update = (state) => {
    element.hidden = state.mode !== 'mass';
    if (!element.hidden) element.textContent = `${state.stats.correct} of ${state.stats.total} correct so far`;
  };
  return { element, update };
};

const buildResultPanel = (ctx) => {
  const element = el('div', { class: 'result-panel' });
  const update = (state) => {
    if (state.current !== null || !state.lastResult) {
      element.hidden = true;
      return;
    }
    element.hidden = false;
    const item = ctx.itemsById[state.lastResult.itemId];
    element.className = `result-panel ${state.lastResult.correct ? 'correct' : 'wrong'}`;
    element.replaceChildren(
      el('p', { class: 'result-outcome' }, [state.lastResult.correct ? 'Correct' : 'Wrong']),
      el('p', { class: 'result-name' }, [item.name]),
      el('p', { class: 'result-date' }, [formatDate(item.date)]),
      el('p', { class: 'result-fact' }, [item.fact]),
    );
  };
  return { element, update };
};

const buildHostDate = (ctx) => {
  const element = el('p', { class: 'host-date' });
  const update = (state) => {
    const show = ctx.view.showDatesToHost && state.current !== null;
    element.hidden = !show;
    if (show) {
      const item = ctx.itemsById[state.current];
      element.textContent = `${item.name}: ${formatDate(item.date)}`;
    }
  };
  return { element, update };
};

export const mountPlayScreen = (root, state, ctx) => {
  confirmingEndGame = false;
  if (confirmTimer) {
    clearTimeout(confirmTimer);
    confirmTimer = null;
  }

  const statusBar = buildStatusBar(ctx);
  const hostDate = buildHostDate(ctx);
  const scoreTable = buildScoreTable(state);
  const massStats = buildMassStats();
  const resultPanel = buildResultPanel(ctx);

  const confirmBtn = el('button', { type: 'button', class: 'confirm-button', 'data-action': 'confirm' }, ['Confirm']);
  const skipBtn = el('button', { type: 'button', 'data-action': 'skip' }, ['Skip']);
  const nextBtn = el('button', { type: 'button', 'data-action': 'next' }, ['Next']);
  const endGameBtn = el('button', { type: 'button', class: 'end-game-button', 'data-action': 'end-game' }, ['End game']);

  const resetConfirm = () => {
    confirmingEndGame = false;
    if (confirmTimer) {
      clearTimeout(confirmTimer);
      confirmTimer = null;
    }
    endGameBtn.textContent = 'End game';
    endGameBtn.classList.remove('confirming');
  };
  activeResetConfirm = resetConfirm;

  const stagePreview = el('div', { class: 'stage-preview' });
  const stage = mountStage(stagePreview, ctx.itemsById);
  const stageBox = () => stagePreview.querySelector('.stage');

  let dragTeardown = null;
  let lastDragCardEl = null;
  let rafScheduled = false;
  let pendingRect;
  let hasPendingRect = false;

  const flushDragFraction = () => {
    rafScheduled = false;
    if (!hasPendingRect) return;
    const rect = pendingRect;
    hasPendingRect = false;

    if (rect === null) {
      stage.setDragPosition(null);
      ctx.channel.send(dragMessage(null, null));
      return;
    }

    const box = stageBox().getBoundingClientRect();
    const x = (rect.left + rect.width / 2 - box.left) / box.width;
    const y = (rect.top + rect.height / 2 - box.top) / box.height;
    stage.setDragPosition({ x, y });
    ctx.channel.send(dragMessage(x, y));
  };

  const sendDragFraction = (rect) => {
    pendingRect = rect;
    hasPendingRect = true;
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(flushDragFraction);
  };

  const attachDrag = () => {
    const card = stagePreview.querySelector('[data-draggable-card]');
    if (card === lastDragCardEl) return;
    dragTeardown?.();
    dragTeardown = null;
    lastDragCardEl = card;
    if (!card) return;
    dragTeardown = makeDraggable(card, {
      getDropZones: () => Array.from(stagePreview.querySelectorAll('[data-gap]')),
      onHover: (gap) => ctx.dispatch({ type: 'hover', gap }),
      onDrop: (gap) => ctx.dispatch({ type: 'place', gap }),
      onMove: sendDragFraction,
    });
  };

  const scorePanelChildren = [scoreTable.element, massStats.element, resultPanel.element, el('div', { class: 'controls' }, [
    confirmBtn, skipBtn, nextBtn, endGameBtn,
  ])].filter(Boolean);

  root.innerHTML = '';
  root.append(el('section', { class: 'play-screen' }, [
    statusBar.element,
    stagePreview,
    hostDate.element,
    el('div', { class: 'score-panel' }, scorePanelChildren),
  ]));

  root.onclick = (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    if (action === 'skip') return ctx.dispatch({ type: 'skip' });
    if (action === 'next') return ctx.dispatch({ type: 'next' });
    if (action === 'confirm') return ctx.dispatch({ type: 'confirm' });
    if (action === 'open-game-view') return ctx.openGameView();
    if (action === 'score-plus') {
      return ctx.dispatch({ type: 'adjustScore', playerIndex: Number(target.dataset.index), delta: 1 });
    }
    if (action === 'score-minus') {
      return ctx.dispatch({ type: 'adjustScore', playerIndex: Number(target.dataset.index), delta: -1 });
    }
    if (action === 'end-game') {
      if (!confirmingEndGame) {
        confirmingEndGame = true;
        endGameBtn.textContent = 'Confirm end game';
        endGameBtn.classList.add('confirming');
        confirmTimer = setTimeout(resetConfirm, END_GAME_CONFIRM_MS);
      } else {
        resetConfirm();
        ctx.dispatch({ type: 'endGame' });
      }
    }
  };

  root.onchange = (event) => {
    if (event.target.dataset.action === 'toggle-dates') ctx.toggleShowDates();
  };

  const update = (nextState) => {
    statusBar.update(nextState);
    hostDate.update(nextState);
    stage.render(nextState);
    attachDrag();
    scoreTable.update(nextState);
    massStats.update(nextState);
    resultPanel.update(nextState);
    confirmBtn.disabled = nextState.pendingGap === null;
    skipBtn.disabled = nextState.current === null;
    nextBtn.disabled = nextState.current !== null;
  };

  update(state);
  return update;
};
