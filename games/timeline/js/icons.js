// Simple line icons, one per item category. currentColor lets callers tint
// them to match the category's accent without a second set of assets.

const svg = (paths) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const icons = {
  hardware: svg(`
    <rect x="4.5" y="3" width="15" height="18" rx="2.2"></rect>
    <path d="M9 6.6h6"></path>
    <circle cx="12" cy="17.2" r="1.3"></circle>
  `),
  software: svg(`
    <path d="M8.5 4 3 12l5.5 8"></path>
    <path d="M15.5 4 21 12l-5.5 8"></path>
    <path d="M13.2 3.6 10.8 20.4"></path>
  `),
  accessory: svg(`
    <path d="M13 3 21 11 11 21 3 13Z"></path>
    <circle cx="8" cy="8" r="1.4"></circle>
  `),
};

export const categoryIcon = (category) => icons[category] ?? icons.hardware;
