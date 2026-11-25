import { el } from '../../../../shared/dom.js';
import { mountWaiting } from './waitingScreen.js';
import { mountPlaying } from './playingScreen.js';
import { mountResult } from './resultScreen.js';
import { mountFinished } from './finishedScreen.js';

const screenFor = (state) => {
  if (!state || state.phase === 'setup') return 'waiting';
  if (state.phase === 'finished') return 'finished';
  if (state.current !== null) return 'playing';
  if (state.lastResult) return 'result';
  return 'waiting';
};

const mounters = {
  waiting: mountWaiting,
  playing: mountPlaying,
  result: mountResult,
  finished: mountFinished,
};

/**
 * Mounts a self-contained, fixed 16:9 "stage" into `rootElement`, letterboxed
 * and centred in whatever box the caller gives it (see .stage-host/.stage in
 * css/game.css). Everything the stage draws sizes itself in container query
 * units against that fixed-ratio box, so the same markup and the same
 * fraction-of-stage coordinates mean the same thing whether the stage fills
 * a projector window or sits embedded at admin size.
 */
export const mountStage = (rootElement, itemsById) => {
  rootElement.classList.add('stage-host');
  const stage = el('div', { class: 'stage' });
  rootElement.replaceChildren(stage);

  let activeScreen = null;
  let activeUpdate = null;
  let cardEl = null;
  let restFraction = null;
  let dragPosition = null;

  const captureRest = () => {
    if (!cardEl) {
      restFraction = null;
      return;
    }
    const stageRect = stage.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();
    restFraction = {
      x: (cardRect.left + cardRect.width / 2 - stageRect.left) / stageRect.width,
      y: (cardRect.top + cardRect.height / 2 - stageRect.top) / stageRect.height,
    };
  };

  // `cardEl` is the current card wherever it currently lives: resting at the
  // bottom, or provisionally dropped into a timeline gap (see
  // `provisionalDrop` in timelineStrip.js). Either way it carries
  // `data-draggable-card`, and lifting it works the same: a shared class for
  // the scale/shadow treatment, plus collapsing its origin gap (if any) back
  // to a plain thin gap while the card floats elsewhere.
  const applyDragPosition = () => {
    if (!cardEl) return;
    const originGap = cardEl.closest('.timeline-strip__gap--pending');

    if (!dragPosition || !restFraction) {
      cardEl.classList.remove('stage-card--lifted');
      originGap?.classList.remove('timeline-strip__gap--lifted');
      if (!cardEl.classList.contains('dragging')) cardEl.style.transform = '';
      return;
    }

    cardEl.classList.add('stage-card--lifted');
    originGap?.classList.add('timeline-strip__gap--lifted');

    // The admin's own drag.js already positions the natively dragged element
    // via position:fixed + left/top; layering a translate on top of that
    // would double the movement, so only the mirroring side (which never
    // gets drag.js's `.dragging` class) applies the transform itself.
    if (cardEl.classList.contains('dragging')) return;

    const stageRect = stage.getBoundingClientRect();
    const dx = (dragPosition.x - restFraction.x) * stageRect.width;
    const dy = (dragPosition.y - restFraction.y) * stageRect.height;
    cardEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`;
  };

  const render = (state) => {
    const screen = screenFor(state);
    stage.dataset.theme = state?.settings?.theme ?? 'store';

    if (screen !== activeScreen) {
      // A screen mounter may return an update function carrying a
      // `.teardown` (see resultScreen.js's confetti/emoji cleanup); other
      // screens have none, so this is a no-op for them.
      activeUpdate?.teardown?.();
      stage.innerHTML = '';
      activeUpdate = mounters[screen](stage, state, itemsById);
      activeScreen = screen;
    } else {
      activeUpdate?.(state);
    }

    const nextCardEl = screen === 'playing' ? stage.querySelector('[data-draggable-card]') : null;
    if (nextCardEl !== cardEl) {
      cardEl = nextCardEl;
      dragPosition = null;
      captureRest();
    }

    applyDragPosition();
  };

  const setDragPosition = (position) => {
    dragPosition = position;
    applyDragPosition();
  };

  return { render, setDragPosition };
};
