import { el } from '../../../../shared/dom.js';
import { categories, categoryLabel } from '../../data/questions.js';
import { suitFor } from '../suits.js';

const fan = (categoryIds) =>
  el('div', { class: 'fan', style: `--count: ${categoryIds.length}` }, categoryIds.map((id, i) =>
    el('div', { class: 'fan__card', 'data-category': id, style: `--i: ${i}` }, [
      el('span', { class: 'fan__suit' }, [suitFor(id)]),
      el('span', { class: 'fan__label' }, [categoryLabel(id)]),
    ])));

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

const finishedLine = (state) => `${plural(state.index + 1, 'question')} played`;

const content = (state) => {
  if (!state) return { title: 'Trivia', line: 'Waiting for the host', ids: categories.map((c) => c.id) };
  if (state.phase === 'finished') return { title: 'That’s a wrap', line: finishedLine(state), ids: state.settings.categories };
  return { title: 'Trivia', line: plural(state.settings.questionCount, 'question'), ids: state.settings.categories };
};

const signatureOf = (state) =>
  JSON.stringify(state && { phase: state.phase, settings: state.settings, index: state.index });

/** The title screen shown before a game starts and after it ends. */
export const mountLobby = (container, state) => {
  let signature;

  const render = (s) => {
    const next = signatureOf(s);
    if (next === signature) return;
    signature = next;
    const { title, line, ids } = content(s);
    container.replaceChildren(el('div', { class: 'lobby' }, [
      fan(ids),
      el('h1', { class: 'lobby__title' }, [title]),
      el('p', { class: 'lobby__line' }, [line]),
    ]));
  };

  render(state);
  return render;
};
