import { el } from '../../../../shared/dom.js';
import { mountStage } from '../game/stage.js';

export const mountFinishedScreen = (root, state, ctx) => {
  const stagePreview = el('div', { class: 'stage-preview' });
  root.replaceChildren(el('section', { class: 'finished-screen' }, [
    el('h1', {}, ['Game over']),
    el('p', { class: 'subtitle' }, [`Played ${state.index + 1} of ${state.deck.length} questions`]),
    el('button', { type: 'button', class: 'start-button', 'data-action': 'new-game' }, ['New game']),
    stagePreview,
  ]));
  mountStage(stagePreview, ctx.questionsById).render(state);

  root.onclick = (event) => {
    if (event.target.closest('[data-action="new-game"]')) ctx.dispatch({ type: 'reset' });
  };

  return () => {};
};
