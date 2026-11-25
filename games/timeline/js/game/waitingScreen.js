import { el, classNames } from '../../../../shared/dom.js';
import { categoryIcon } from '../icons.js';

const CATEGORY_CHOICES = [
  { value: 'everything', label: 'Everything', categories: ['hardware', 'software', 'accessory'] },
  { value: 'hardware', label: 'Hardware', categories: ['hardware'] },
  { value: 'software', label: 'Software', categories: ['software'] },
  { value: 'accessory', label: 'Accessories', categories: ['accessory'] },
];

const sameSet = (a, b) => a.length === b.length && a.every((v) => b.includes(v));
const choiceFor = (categories) =>
  CATEGORY_CHOICES.find((c) => sameSet(c.categories, categories)) ?? CATEGORY_CHOICES[0];

const modeLabel = (mode) => (mode === 'mass' ? 'Everyone plays' : 'Head-to-head');

const buildTile = (choice, selected) => {
  const icons = el('div', { class: 'setup-tile__icons' },
    choice.categories.map((category) => {
      const icon = el('span', { class: `setup-tile__icon setup-tile__icon--${category}` });
      icon.innerHTML = categoryIcon(category);
      return icon;
    }));

  return el('div', {
    class: classNames('setup-tile', selected && 'setup-tile--selected'),
  }, [icons, el('p', { class: 'setup-tile__label' }, [choice.label])]);
};

const buildSetupPreview = (state) => {
  const selected = choiceFor(state.settings.categories);
  const cardCount = state.settings.cardCount;

  return el('div', { class: 'setup-preview' }, [
    el('div', { class: 'setup-preview__tiles' }, CATEGORY_CHOICES.map((c) => buildTile(c, c === selected))),
    el('p', { class: 'setup-preview__meta' }, [
      `${modeLabel(state.mode)} · ${cardCount} card${cardCount === 1 ? '' : 's'}`,
    ]),
    state.session && el('p', { class: 'setup-preview__session' }, [
      `Session · Game ${state.session.gamesPlayed + 1}`,
    ]),
  ]);
};

const buildView = (container, state) => {
  const children = [el('h1', { class: 'waiting__title' }, ['Timeline'])];

  children.push(state
    ? buildSetupPreview(state)
    : el('p', { class: 'waiting__subtitle' }, ['Waiting for the host']));

  container.append(el('div', { class: 'waiting' }, children));
};

const signatureOf = (state) => (state ? JSON.stringify({ mode: state.mode, settings: state.settings, session: state.session }) : null);

export const mountWaiting = (container, state) => {
  // Not null: signatureOf(null) is itself null, and this must still render
  // the very first time (the common no-state-yet case).
  let signature;

  const render = (s) => {
    const next = signatureOf(s);
    if (next === signature) return;
    signature = next;
    container.innerHTML = '';
    buildView(container, s);
  };

  render(state);
  return render;
};
