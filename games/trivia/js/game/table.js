import { el } from '../../../../shared/dom.js';
import { currentQuestionId } from '../reducer.js';
import { buildCard } from './card.js';

const PILE_DEPTH = 4;
const DISCARD_MS = 650;

const remainingAfter = (state) => state.deck.length - state.index - 1;

const counterText = (state) => `Question ${state.index + 1} of ${state.deck.length}`;

const pileCards = (count) =>
  Array.from({ length: Math.min(count, PILE_DEPTH) }, (_, i) =>
    el('div', { class: 'pile__card', style: `--depth: ${i + 1}` }));

/**
 * The playing table: one card face up in the middle, with the undealt cards
 * stacked behind it. Moving forward throws the old card off to the left and
 * deals the new one from the pile; moving back returns the old card to the
 * pile and slides the earlier one back in from the left.
 */
export const mountTable = (container, state, questionsById) => {
  const counter = el('p', { class: 'table__counter' });
  const pile = el('div', { class: 'pile' });
  const slot = el('div', { class: 'table__slot' }, [pile]);
  container.append(el('div', { class: 'table' }, [counter, slot]));

  let shownId = null;
  let shownIndex = -1;
  let card = null;

  const discard = (oldCard, direction) => {
    if (!oldCard) return;
    oldCard.classList.add(`card--out-${direction}`);
    setTimeout(() => oldCard.remove(), DISCARD_MS);
  };

  const deal = (s) => {
    const direction = s.index >= shownIndex ? 'forward' : 'back';
    discard(card, direction);
    card = buildCard(questionsById[currentQuestionId(s)], s.index + 1);
    card.classList.add(`card--in-${direction}`);
    slot.append(card);
    shownId = currentQuestionId(s);
    shownIndex = s.index;
  };

  const update = (s) => {
    if (currentQuestionId(s) !== shownId || s.index !== shownIndex) deal(s);
    card.classList.toggle('card--revealed', s.revealed);
    counter.textContent = counterText(s);
    pile.replaceChildren(...pileCards(remainingAfter(s)));
  };

  update(state);
  return update;
};
