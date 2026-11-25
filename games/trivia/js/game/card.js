import { el } from '../../../../shared/dom.js';
import { categoryLabel } from '../../data/questions.js';
import { suitFor } from '../suits.js';

const lengthClass = (text, medium, long) =>
  text.length > long ? 'is-long' : text.length > medium ? 'is-medium' : 'is-short';

const corner = (position, number, suit) =>
  el('span', { class: `card__corner card__corner--${position}`, 'aria-hidden': 'true' }, [
    el('span', { class: 'card__corner-number' }, [String(number)]),
    el('span', { class: 'card__corner-suit' }, [suit]),
  ]);

const corners = (number, suit) => [corner('top', number, suit), corner('bottom', number, suit)];

const front = (question, number, suit) =>
  el('div', { class: 'card__face card__face--front' }, [
    ...corners(number, suit),
    el('p', { class: 'card__eyebrow' }, [`${suit} ${categoryLabel(question.category)}`]),
    el('p', { class: `card__question ${lengthClass(question.question, 60, 110)}` }, [question.question]),
    el('p', { class: 'card__footer' }, ['Flip to reveal']),
  ]);

const back = (question, number, suit) =>
  el('div', { class: 'card__face card__face--back' }, [
    ...corners(number, suit),
    el('p', { class: 'card__eyebrow' }, ['Answer']),
    el('p', { class: `card__answer ${lengthClass(question.answer, 24, 60)}` }, [question.answer]),
    question.detail && el('p', { class: 'card__detail' }, [question.detail]),
  ]);

export const buildCard = (question, number) => {
  const suit = suitFor(question.category);
  return el('div', { class: 'card', 'data-category': question.category }, [
    el('div', { class: 'card__inner' }, [front(question, number, suit), back(question, number, suit)]),
  ]);
};
