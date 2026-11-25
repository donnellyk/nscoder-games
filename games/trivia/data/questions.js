import { history } from './history.js';
import { swift } from './swift.js';
import { frameworks } from './frameworks.js';
import { tools } from './tools.js';
import { platforms } from './platforms.js';

const sources = [
  { id: 'history', label: 'Apple History', questions: history },
  { id: 'swift', label: 'Swift', questions: swift },
  { id: 'frameworks', label: 'Frameworks', questions: frameworks },
  { id: 'tools', label: 'Tools', questions: tools },
  { id: 'platforms', label: 'Platforms', questions: platforms },
];

export const categories = sources.map(({ id, label }) => ({ id, label }));

export const questions = sources.flatMap(({ id, questions: list }) => list.map((q) => ({ ...q, category: id })));

export const questionsById = Object.fromEntries(questions.map((q) => [q.id, q]));

export const categoryLabel = (id) => categories.find((c) => c.id === id)?.label ?? id;
