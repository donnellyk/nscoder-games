import { hardware } from './hardware.js';
import { software } from './software.js';
import { accessories } from './accessories.js';

export const items = [...hardware, ...software, ...accessories];

export const itemsById = Object.fromEntries(items.map((item) => [item.id, item]));
