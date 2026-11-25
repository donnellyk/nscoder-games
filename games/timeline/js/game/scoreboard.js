import { el } from '../../../../shared/dom.js';

const buildPlayerRow = (player, active) => {
  const row = el('div', {
    class: `scoreboard__player${active ? ' scoreboard__player--active' : ''}`,
  }, [
    el('span', { class: 'scoreboard__name' }, [player.name]),
    el('span', { class: 'scoreboard__score' }, [String(player.score)]),
  ]);
  return row;
};

const buildHeadToHead = (state) => {
  const rows = state.players.map((player, i) => buildPlayerRow(player, i === state.turn));
  const element = el('div', { class: 'scoreboard scoreboard--head-to-head' }, rows);

  const update = (nextState) => rows.forEach((row, i) => {
    const player = nextState.players[i];
    row.classList.toggle('scoreboard__player--active', i === nextState.turn);
    row.querySelector('.scoreboard__name').textContent = player.name;
    row.querySelector('.scoreboard__score').textContent = String(player.score);
  });

  return { element, update };
};

const buildMass = (state) => {
  const countEl = el('span', { class: 'scoreboard__count' });
  const element = el('div', { class: 'scoreboard scoreboard--mass' }, [countEl]);

  const setText = (s) => {
    countEl.textContent = `${s.stats.correct} of ${s.stats.total} correct`;
  };

  setText(state);
  return { element, update: setText };
};

export const buildScoreboard = (state) => (state.mode === 'mass' ? buildMass(state) : buildHeadToHead(state));
