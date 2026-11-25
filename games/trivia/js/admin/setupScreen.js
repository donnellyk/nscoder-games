import { el } from '../../../../shared/dom.js';
import { questions, categories } from '../../data/questions.js';
import { availableQuestions, dealDeck } from '../deck.js';
import { suitFor } from '../suits.js';

const THEMES = [
  { value: 'store', label: 'Apple Store' },
  { value: 'dark', label: 'Dark' },
  { value: 'gameshow', label: 'Game show' },
];

const clampCount = (value) => Math.min(questions.length, Math.max(1, Math.round(value) || 1));

const countIn = (category) => questions.filter((q) => q.category === category).length;

const toggled = (list, value, on) => (on ? [...new Set([...list, value])] : list.filter((v) => v !== value));

const fieldset = (legend, children) => el('fieldset', {}, [el('legend', {}, [legend]), ...children]);

const choice = (type, attrs, label) => el('label', { class: type }, [el('input', { type, ...attrs }), ` ${label}`]);

const categoryChoices = (settings) => categories.map((c) => choice('checkbox', {
  'data-category': c.id,
  checked: settings.categories.includes(c.id),
}, `${suitFor(c.id)} ${c.label} (${countIn(c.id)})`));

const themeChoices = (settings) => THEMES.map((t) => choice('radio', {
  name: 'theme',
  value: t.value,
  checked: settings.theme === t.value,
}, t.label));

/**
 * Built once when the host enters setup. Inputs dispatch `configure`, and
 * the echoed state only refreshes the derived lines, so typing in the count
 * field never loses focus.
 */
export const mountSetupScreen = (root, state, ctx) => {
  const countInput = el('input', { type: 'number', min: 1, max: questions.length, value: state.settings.questionCount });
  const skipInput = el('input', { type: 'checkbox', 'data-action': 'skip-asked', checked: state.settings.skipAsked });
  const askedLine = el('span', { class: 'asked-line' });
  const forgetBtn = el('button', { type: 'button', 'data-action': 'forget-asked' }, ['Forget asked questions']);
  const availableLine = el('p', { class: 'match-count' });
  const startBtn = el('button', { type: 'button', class: 'start-button', 'data-action': 'start' }, ['Start game']);

  root.replaceChildren(el('section', { class: 'setup-screen' }, [
    el('h1', {}, ['Trivia']),
    el('p', { class: 'subtitle' }, ['Set up a game']),
    fieldset('Questions to play', [countInput]),
    fieldset('Categories', categoryChoices(state.settings)),
    fieldset('Repeats', [
      el('label', { class: 'checkbox' }, [skipInput, ' Skip questions already asked']),
      el('div', { class: 'asked-row' }, [askedLine, forgetBtn]),
    ]),
    fieldset('Theme', themeChoices(state.settings)),
    availableLine,
    startBtn,
  ]));

  const configure = (settings) => ctx.dispatch({ type: 'configure', settings });

  root.oninput = (event) => {
    if (event.target === countInput) configure({ questionCount: clampCount(Number(countInput.value)) });
  };

  root.onchange = (event) => {
    const { target } = event;
    const settings = ctx.getState().settings;
    if (target === countInput) countInput.value = settings.questionCount;
    else if (target.dataset.category) configure({ categories: toggled(settings.categories, target.dataset.category, target.checked) });
    else if (target.name === 'theme') configure({ theme: target.value });
    else if (target === skipInput) configure({ skipAsked: target.checked });
  };

  root.onclick = (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    const current = ctx.getState();
    if (action === 'forget-asked') ctx.dispatch({ type: 'forgetAsked' });
    if (action === 'start') ctx.dispatch({ type: 'startGame', deck: dealDeck(questions, current.settings, current.asked) });
  };

  const update = (s) => {
    const available = availableQuestions(questions, s.settings, s.asked).length;
    const dealt = Math.min(available, s.settings.questionCount);
    availableLine.textContent = `${available} question${available === 1 ? '' : 's'} available · ${dealt} will be dealt`;
    askedLine.textContent = `${s.asked.length} of ${questions.length} asked so far`;
    forgetBtn.disabled = s.asked.length === 0;
    startBtn.disabled = available === 0;
  };

  update(state);
  return update;
};
