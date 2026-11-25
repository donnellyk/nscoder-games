import { standings } from '../reducer.js';
import { escapeHtml } from './html.js';

const headToHeadMarkup = (state) => `
  <table class="standings">
    <tbody>
      ${standings(state).map((p) => `
        <tr>
          <td class="rank">${p.rank}</td>
          <td class="name">${escapeHtml(p.name)}</td>
          <td class="score">${p.score}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
`;

const massMarkup = (state) => `
  <p class="mass-result">${state.stats.correct} of ${state.stats.total} correct</p>
`;

const sessionMarkup = (session) => (session ? `
  <p class="session-summary">Session: ${session.gamesPlayed} game${session.gamesPlayed === 1 ? '' : 's'} played · ${session.usedIds.length} item${session.usedIds.length === 1 ? '' : 's'} used</p>
` : '');

const template = (state) => `
  <section class="finished-screen">
    <h1>Game over</h1>
    ${state.mode === 'headToHead' ? headToHeadMarkup(state) : massMarkup(state)}
    ${sessionMarkup(state.session)}
    <button type="button" data-action="new-game">New game</button>
  </section>
`;

export const renderFinishedScreen = (root, state, ctx) => {
  root.innerHTML = template(state);
  root.onclick = (event) => {
    if (event.target.closest('[data-action="new-game"]')) {
      ctx.dispatch({ type: 'reset' });
    }
  };
};
