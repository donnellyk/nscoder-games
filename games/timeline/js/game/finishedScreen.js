import { el } from '../../../../shared/dom.js';
import { standings } from '../reducer.js';
import { buildTimelineStrip } from './timelineStrip.js';

const winnerText = (ranked) => {
  const winners = ranked.filter((p) => p.rank === 1);
  return winners.length === 1
    ? `${winners[0].name} wins`
    : `Tied for the win: ${winners.map((p) => p.name).join(', ')}`;
};

const buildHeadToHead = (state) => {
  const ranked = standings(state);
  return el('div', { class: 'finished__result' }, [
    el('h1', { class: 'finished__winner' }, [winnerText(ranked)]),
    el('ol', { class: 'standings' }, ranked.map((p) => el('li', { class: 'standings__row' }, [
      el('span', { class: 'standings__rank' }, [`#${p.rank}`]),
      el('span', { class: 'standings__name' }, [p.name]),
      el('span', { class: 'standings__score' }, [String(p.score)]),
    ]))),
  ]);
};

const buildMass = (state) => el('div', { class: 'finished__result' }, [
  el('h1', { class: 'finished__winner' }, ['Game over']),
  el('p', { class: 'finished__stat' }, [`${state.stats.correct} of ${state.stats.total} correct`]),
]);

const signatureOf = (state) => JSON.stringify({ players: state.players, stats: state.stats, timeline: state.timeline });

export const mountFinished = (container, state, itemsById) => {
  let signature = null;

  const render = (s) => {
    const next = signatureOf(s);
    if (next === signature) return;
    signature = next;

    const summary = s.mode === 'mass' ? buildMass(s) : buildHeadToHead(s);
    const strip = buildTimelineStrip(s.timeline, itemsById, {});

    container.innerHTML = '';
    container.append(el('div', { class: 'finished' }, [
      summary,
      el('div', { class: 'finished__timeline' }, [strip.element]),
    ]));
  };

  render(state);
  return render;
};
