import { el } from '../../../../shared/dom.js';
import { yearOf, formatDate } from '../dates.js';
import { buildTimelineStrip } from './timelineStrip.js';
import { buildScoreboard } from './scoreboard.js';
import { categoryIcon } from '../icons.js';
import { imagePath } from '../../data/images.js';
import { playConfetti, playEmojiShower } from './effects.js';

const insertAt = (list, index, value) => [...list.slice(0, index), value, ...list.slice(index)];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A wrong drop needs a beat to read, then a slide to its true spot; a correct
// drop needs the same reveal beat before the score visibly ticks up, so the
// two feel like one consistent rhythm rather than two different pacings.
const REVEAL_DELAY = 300;
const FLIP_DURATION = 550;
const HOLD = 450;
const SLIDE_DURATION = 700;

const resultKeyOf = (lastResult) =>
  lastResult && `${lastResult.itemId}:${lastResult.droppedGap}:${lastResult.correctGap}`;

// A photo could give the era away, so this only ever runs from the result
// screen, once the card has already been confirmed and revealed.
const buildMediaTile = (item) => {
  const path = imagePath(item.id);
  if (path) {
    return el('div', { class: 'verdict__media' }, [
      el('img', { class: 'verdict__image', src: path, alt: item.name }),
    ]);
  }
  const icon = el('div', { class: `verdict__media-icon verdict__media-icon--${item.category}` });
  icon.innerHTML = categoryIcon(item.category);
  return el('div', { class: 'verdict__media verdict__media--empty' }, [icon]);
};

const buildVerdict = (item, result) => el('section', {
  class: `verdict verdict--pending verdict--${result.correct ? 'correct' : 'wrong'}`,
}, [
  buildMediaTile(item),
  el('div', { class: 'verdict__body' }, [
    el('p', { class: 'verdict__badge' }, [result.correct ? 'Correct' : 'Wrong']),
    el('h1', { class: 'verdict__name' }, [item.name]),
    el('p', { class: 'verdict__date' }, [formatDate(item.date)]),
    el('p', { class: 'verdict__fact' }, [item.fact]),
  ]),
]);

// Scores already carry the point in `state`; this rolls the acting player's
// score back by one so the scoreboard can visibly tick up once the reveal
// has had its moment, instead of showing the point before the card flips.
const scoreboardStateBeforeReveal = (state, result) => {
  if (state.mode !== 'headToHead' || !result.correct) return state;
  return {
    ...state,
    players: state.players.map((p, i) => (i === result.playerIndex ? { ...p, score: p.score - 1 } : p)),
  };
};

const slideToFinalSpot = (movedCard, rectBefore) => {
  const rectAfter = movedCard.getBoundingClientRect();
  const dx = rectBefore.left - rectAfter.left;
  if (dx === 0) return;

  movedCard.style.transform = `translateX(${dx}px)`;
  void movedCard.offsetWidth; // force layout so the starting transform applies before the transition kicks in
  movedCard.classList.add('placed-card--settling');
  requestAnimationFrame(() => {
    movedCard.style.transform = '';
  });
};

const runAnimation = (container, state, itemsById) => {
  const result = state.lastResult;
  const item = itemsById[result.itemId];
  const withoutItem = state.timeline.filter((id) => id !== result.itemId);
  const preLayout = insertAt(withoutItem, result.droppedGap, result.itemId);

  let strip = buildTimelineStrip(preLayout, itemsById, { pendingId: result.itemId });
  const timelineWrap = el('div', { class: 'result__timeline' }, [strip.element]);

  const verdict = buildVerdict(item, result);
  const scoreboard = buildScoreboard(scoreboardStateBeforeReveal(state, result));
  const handle = { scoreboard, settled: false, cancelled: false, stopEffect: null };

  container.append(el('div', { class: 'result' }, [
    el('div', { class: 'result__bar' }, [scoreboard.element]),
    timelineWrap,
    el('div', { class: 'result__current' }, [verdict]),
  ]));

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scale = reduced ? 0 : 1;

  (async () => {
    await delay(REVEAL_DELAY * scale);
    if (handle.cancelled) return;

    const movedCard = strip.cardsById.get(result.itemId);
    movedCard.classList.remove('placed-card--pending');
    movedCard.classList.add(result.correct ? 'placed-card--correct' : 'placed-card--wrong');
    movedCard.querySelector('.placed-card__year').textContent = yearOf(item.date);
    verdict.classList.remove('verdict--pending');

    handle.stopEffect = result.correct ? playConfetti(container) : playEmojiShower(container);

    await delay((FLIP_DURATION + HOLD) * scale);
    if (handle.cancelled) return;

    if (!result.correct) {
      const rectBefore = movedCard.getBoundingClientRect();
      const nextStrip = buildTimelineStrip(state.timeline, itemsById, {
        flashId: result.itemId,
        flashCorrect: false,
      });
      timelineWrap.replaceChildren(nextStrip.element);
      strip = nextStrip;
      slideToFinalSpot(nextStrip.cardsById.get(result.itemId), rectBefore);
      await delay(SLIDE_DURATION * scale);
    }

    scoreboard.update(state);
    handle.settled = true;
  })();

  return handle;
};

export const mountResult = (container, state, itemsById) => {
  let key = resultKeyOf(state.lastResult);
  let handle = runAnimation(container, state, itemsById);

  const update = (nextState) => {
    const nextKey = resultKeyOf(nextState.lastResult);
    if (nextKey !== key) {
      handle.cancelled = true;
      handle.stopEffect?.();
      container.innerHTML = '';
      key = nextKey;
      handle = runAnimation(container, nextState, itemsById);
      return;
    }
    // Ignore late duplicate snapshots of the same result until the reveal
    // sequence has finished, so the score doesn't jump ahead of the animation.
    if (handle.settled) handle.scoreboard.update(nextState);
  };

  // Called by stage.js when the stage switches away from this screen, so a
  // running confetti/emoji loop never keeps drawing onto a screen it no
  // longer owns.
  update.teardown = () => {
    handle.cancelled = true;
    handle.stopEffect?.();
  };

  return update;
};
