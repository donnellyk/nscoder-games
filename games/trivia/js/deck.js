import { shuffle } from '../../../shared/shuffle.js';

export const availableQuestions = (questions, { categories, skipAsked = false }, asked = []) =>
  questions.filter((q) => categories.includes(q.category) && !(skipAsked && asked.includes(q.id)));

export const dealDeck = (questions, settings, asked = [], random = Math.random) =>
  shuffle(availableQuestions(questions, settings, asked), random)
    .slice(0, settings.questionCount)
    .map((q) => q.id);
