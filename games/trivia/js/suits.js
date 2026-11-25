const SUITS = {
  history: '♠',
  swift: '♥',
  frameworks: '♦',
  tools: '♣',
  platforms: '★',
};

export const suitFor = (category) => SUITS[category] ?? '★';
