import { shuffle } from '../../../shared/shuffle.js';

export { shuffle };

export const filterItems = (items, { categories, tiers, excluded = [] } = {}) =>
  items.filter((item) =>
    (!categories || categories.includes(item.category)) &&
    (!tiers || tiers.includes(item.tier)) &&
    !excluded.includes(item.id)
  );

export const dealDeck = (items, { categories, tiers, excluded, cardCount }, random = Math.random) =>
  shuffle(filterItems(items, { categories, tiers, excluded }), random)
    .slice(0, cardCount + 1)
    .map((item) => item.id);
