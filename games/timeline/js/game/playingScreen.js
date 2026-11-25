import { el } from '../../../../shared/dom.js';
import { buildTimelineStrip } from './timelineStrip.js';
import { buildScoreboard } from './scoreboard.js';
import { categoryIcon } from '../icons.js';

const categoryLabel = { hardware: 'Hardware', software: 'Software', accessory: 'Accessory' };

const turnLabel = (state) => {
  if (state.mode === 'mass') return 'Where does it go?';
  const player = state.players[state.turn];
  return player ? `${player.name}’s turn` : '';
};

const waitingLabel = (state) => {
  if (state.mode === 'mass') return 'Waiting to confirm';
  const player = state.players[state.turn];
  return player ? `${player.name}’s answer — waiting to confirm` : 'Waiting to confirm';
};

const sameTimeline = (a, b) => a.length === b.length && a.every((id, i) => id === b[i]);

const buildIcon = (category, cls) => {
  const icon = el('div', { class: `${cls} ${cls}--${category}` });
  icon.innerHTML = categoryIcon(category);
  return icon;
};

// Not yet placed: the card rests at the bottom, draggable.
const buildDraggableCard = (item, state) => el('section', {
  class: 'current-card', 'data-draggable-card': true,
}, [
  buildIcon(item.category, 'current-card__icon'),
  el('p', { class: 'current-card__category' }, [categoryLabel[item.category]]),
  el('h1', { class: 'current-card__name' }, [item.name]),
  el('p', { class: 'current-card__turn' }, [turnLabel(state)]),
]);

// Placed but not yet confirmed: the card itself lives in the timeline (see
// `provisionalDrop` in timelineStrip.js); the bottom area just names whose
// guess is waiting on the host's Confirm.
const buildWaitingPrompt = (state) => el('p', { class: 'pending-prompt' }, [waitingLabel(state)]);

const buildView = (container, state, itemsById) => {
  const item = itemsById[state.current];
  const pending = state.pendingGap !== null;

  const remaining = state.deck.length + 1;
  const remainingEl = el('p', { class: 'playing__remaining' }, [
    `${remaining} card${remaining === 1 ? '' : 's'} left`,
  ]);

  const scoreboard = buildScoreboard(state);
  const strip = buildTimelineStrip(state.timeline, itemsById, {
    hoverGap: state.hoverGap,
    provisionalDrop: pending ? { itemId: state.current, gap: state.pendingGap } : null,
  });

  const bottom = pending ? buildWaitingPrompt(state) : buildDraggableCard(item, state);

  container.append(el('div', { class: 'playing' }, [
    el('div', { class: 'playing__bar' }, [scoreboard.element, remainingEl]),
    el('div', { class: 'playing__timeline' }, [strip.element]),
    el('div', { class: 'playing__current' }, [bottom]),
  ]));

  return { state, strip, scoreboard };
};

export const mountPlaying = (container, state, itemsById) => {
  let ctx = buildView(container, state, itemsById);

  return (nextState) => {
    const structural = nextState.current !== ctx.state.current
      || nextState.pendingGap !== ctx.state.pendingGap
      || !sameTimeline(nextState.timeline, ctx.state.timeline);

    if (structural) {
      container.innerHTML = '';
      ctx = buildView(container, nextState, itemsById);
      return;
    }

    ctx.strip.updateHover(nextState.hoverGap);
    ctx.scoreboard.update(nextState);
    ctx.state = nextState;
  };
};
