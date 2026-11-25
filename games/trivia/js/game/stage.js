import { el } from '../../../../shared/dom.js';
import { mountLobby } from './lobby.js';
import { mountTable } from './table.js';

const screenFor = (state) => (state?.phase === 'playing' ? 'table' : 'lobby');

/**
 * Mounts the fixed 16:9 stage into `rootElement`. The admin page embeds the
 * same stage as its preview, so both windows draw from one code path.
 */
export const mountStage = (rootElement, questionsById) => {
  rootElement.classList.add('stage-host');
  const stage = el('div', { class: 'stage' });
  rootElement.replaceChildren(stage);

  let activeScreen = null;
  let activeUpdate = null;

  const render = (state) => {
    const screen = screenFor(state);
    stage.dataset.theme = state?.settings?.theme ?? 'store';

    if (screen === activeScreen) {
      activeUpdate(state);
      return;
    }

    stage.replaceChildren();
    activeScreen = screen;
    activeUpdate = screen === 'table' ? mountTable(stage, state, questionsById) : mountLobby(stage, state);
  };

  return { render };
};
