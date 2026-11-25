import { el } from '../../../../shared/dom.js';
import { categoryLabel } from '../../data/questions.js';
import { currentQuestionId } from '../reducer.js';
import { suitFor } from '../suits.js';
import { mountStage } from '../game/stage.js';

const END_GAME_CONFIRM_MS = 3000;

const buildStatusBar = (ctx) => {
  const helloStatus = el('span', { class: 'hello-status' });
  const element = el('div', { class: 'status-bar' }, [
    el('button', { type: 'button', 'data-action': 'open-game-view' }, ['Open game view']),
    helloStatus,
    el('span', { class: 'key-hints' }, ['Space flips · ← → move between cards']),
  ]);
  const update = () => {
    helloStatus.textContent = ctx.view.helloReceived ? 'Game view connected' : 'Waiting for game view…';
    helloStatus.classList.toggle('connected', ctx.view.helloReceived);
  };
  return { element, update };
};

const buildHostCard = (ctx) => {
  const element = el('article', { class: 'host-card' });
  let shownId = null;

  const update = (state) => {
    const id = currentQuestionId(state);
    element.classList.toggle('host-card--revealed', state.revealed);
    if (id === shownId) return;
    shownId = id;
    const question = ctx.questionsById[id];
    element.dataset.category = question.category;
    element.replaceChildren(
      el('p', { class: 'host-card__meta' }, [
        `${suitFor(question.category)} ${categoryLabel(question.category)} · Question ${state.index + 1} of ${state.deck.length}`,
      ]),
      el('p', { class: 'host-card__question' }, [question.question]),
      el('div', { class: 'host-card__answer' }, [
        el('span', { class: 'host-card__label' }, ['Answer']),
        el('p', {}, [question.answer]),
        question.detail && el('p', { class: 'host-card__detail' }, [question.detail]),
      ]),
    );
  };

  return { element, update };
};

export const mountPlayScreen = (root, state, ctx) => {
  const statusBar = buildStatusBar(ctx);
  const hostCard = buildHostCard(ctx);
  const prevBtn = el('button', { type: 'button', 'data-action': 'previous' }, ['← Previous']);
  const flipBtn = el('button', { type: 'button', class: 'flip-button', 'data-action': 'flip' });
  const nextBtn = el('button', { type: 'button', 'data-action': 'next' });
  const endBtn = el('button', { type: 'button', class: 'end-game-button', 'data-action': 'end-game' }, ['End game']);

  const stagePreview = el('div', { class: 'stage-preview' });
  const stage = mountStage(stagePreview, ctx.questionsById);

  let confirmTimer = null;
  const resetConfirm = () => {
    clearTimeout(confirmTimer);
    confirmTimer = null;
    endBtn.textContent = 'End game';
    endBtn.classList.remove('confirming');
  };

  root.replaceChildren(el('section', { class: 'play-screen' }, [
    statusBar.element,
    el('div', { class: 'play-layout' }, [
      el('div', { class: 'host-column' }, [
        hostCard.element,
        el('div', { class: 'controls' }, [prevBtn, flipBtn, nextBtn]),
        el('div', { class: 'controls controls--secondary' }, [endBtn]),
      ]),
      stagePreview,
    ]),
  ]));

  root.onclick = (event) => {
    const button = event.target.closest('[data-action]');
    const action = button?.dataset.action;
    // Keep focus off the button so Space flips the card instead of re-clicking it.
    button?.blur();
    if (action !== 'end-game' && confirmTimer) resetConfirm();
    if (action === 'open-game-view') ctx.openGameView();
    if (action === 'previous') ctx.dispatch({ type: 'previous' });
    if (action === 'flip') ctx.dispatch({ type: 'flip' });
    if (action === 'next') ctx.dispatch({ type: 'next' });
    if (action !== 'end-game') return;
    if (confirmTimer) {
      resetConfirm();
      ctx.dispatch({ type: 'endGame' });
      return;
    }
    endBtn.textContent = 'Confirm end game';
    endBtn.classList.add('confirming');
    confirmTimer = setTimeout(resetConfirm, END_GAME_CONFIRM_MS);
  };

  const update = (s) => {
    statusBar.update(s);
    hostCard.update(s);
    stage.render(s);
    prevBtn.disabled = s.index === 0;
    flipBtn.textContent = s.revealed ? 'Show question' : 'Flip to reveal';
    nextBtn.textContent = s.index + 1 < s.deck.length ? 'Next →' : 'Finish →';
  };

  update(state);
  return update;
};
