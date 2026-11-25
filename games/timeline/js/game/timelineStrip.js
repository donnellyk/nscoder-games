import { yearOf } from '../dates.js';
import { el, classNames } from '../../../../shared/dom.js';
import { categoryIcon } from '../icons.js';

// Above this many placed cards the row switches to a narrow, vertical-text
// style so a full 21-card timeline still fits in one row at 1280px wide.
const COMPACT_THRESHOLD = 8;

const cardStateClass = (id, { pendingId, flashId, flashCorrect }) => {
  if (id === pendingId) return 'placed-card--pending';
  if (id === flashId) return flashCorrect ? 'placed-card--correct' : 'placed-card--wrong';
  return null;
};

const buildIcon = (category, cls) => {
  const icon = el('div', { class: `${cls} ${cls}--${category}` });
  icon.innerHTML = categoryIcon(category);
  return icon;
};

const buildCard = (item, compact, stateClass, revealed) => el('div', {
  class: classNames('placed-card', compact && 'placed-card--compact', stateClass),
}, [
  buildIcon(item.category, 'placed-card__icon'),
  el('span', { class: 'placed-card__name' }, [item.name]),
  el('span', { class: 'placed-card__year' }, [revealed ? yearOf(item.date) : '']),
]);

// A card the host has dropped but not yet confirmed: no year (nobody knows
// yet if the guess is right), a dashed outline instead of a shadow, and
// still `data-draggable-card` so it can be picked up again from here.
const buildProvisionalCard = (item, compact) => el('div', {
  class: classNames('placed-card', compact && 'placed-card--compact', 'placed-card--provisional'),
  'data-draggable-card': true,
}, [
  buildIcon(item.category, 'placed-card__icon'),
  el('span', { class: 'placed-card__name' }, [item.name]),
  el('span', { class: 'placed-card__year' }, ['?']),
]);

const buildGap = (index, hoverGap) => el('div', {
  class: classNames('timeline-strip__gap', index === hoverGap && 'timeline-strip__gap--hover'),
  'data-gap': index,
});

// Builds one row: a gap, then a card, repeating, with one trailing gap.
// `pendingId` marks a card as not-yet-revealed (name only, no year) during
// the post-confirm reveal beat. `flashId`/`flashCorrect` mark a card with a
// correct/wrong flash color.
//
// `provisionalDrop` is a different thing: a not-yet-confirmed drop. It sits
// visually inside the gap at `provisionalDrop.gap` without changing what any
// gap index means — indices always stay relative to `itemIds` (the
// reducer's `state.timeline`, which never contains the current card before
// `confirm`), so the gap the provisional card occupies stays a normal, valid
// drop zone and re-dragging it never renumbers anything.
export const buildTimelineStrip = (itemIds, itemsById, options = {}) => {
  const {
    hoverGap = null, pendingId = null, flashId = null, flashCorrect = false, provisionalDrop = null,
  } = options;
  const compact = itemIds.length > COMPACT_THRESHOLD;

  const cards = itemIds.map((id) => buildCard(
    itemsById[id],
    compact,
    cardStateClass(id, { pendingId, flashId, flashCorrect }),
    id !== pendingId,
  ));
  const gaps = Array.from({ length: itemIds.length + 1 }, (_, i) => buildGap(i, hoverGap));

  let provisionalCard = null;
  if (provisionalDrop) {
    provisionalCard = buildProvisionalCard(itemsById[provisionalDrop.itemId], compact);
    const gapEl = gaps[provisionalDrop.gap];
    gapEl.classList.add('timeline-strip__gap--pending');
    gapEl.append(provisionalCard);
  }

  const children = gaps.flatMap((gapEl, i) => (cards[i] ? [gapEl, cards[i]] : [gapEl]));

  const element = el('div', {
    class: classNames('timeline-strip', compact && 'timeline-strip--compact'),
  }, children);

  const cardsById = new Map(itemIds.map((id, i) => [id, cards[i]]));
  if (provisionalDrop) cardsById.set(provisionalDrop.itemId, provisionalCard);

  const updateHover = (nextHoverGap) => gaps.forEach((gapEl, index) =>
    gapEl.classList.toggle('timeline-strip__gap--hover', index === nextHoverGap));

  return { element, gaps, cards, cardsById, updateHover };
};
