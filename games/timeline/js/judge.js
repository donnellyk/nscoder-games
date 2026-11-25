import { dateRange } from './dates.js';

// Imprecise dates (month- or year-only) give items an overlapping range rather
// than a single point. When two ranges overlap, neither item can be proven to
// come before the other, so a gap between them is valid from either side.
export const isValidGap = (timelineItems, item, gap) => {
  const [itemStart, itemEnd] = dateRange(item.date);
  const left = timelineItems[gap - 1];
  const right = timelineItems[gap];
  const leftOk = !left || dateRange(left.date)[0] <= itemEnd;
  const rightOk = !right || dateRange(right.date)[1] >= itemStart;
  return leftOk && rightOk;
};

export const correctGap = (timelineItems, item, droppedGap) => {
  const validGaps = Array.from({ length: timelineItems.length + 1 }, (_, gap) => gap)
    .filter((gap) => isValidGap(timelineItems, item, gap));

  return validGaps.reduce((nearest, gap) =>
    Math.abs(gap - droppedGap) < Math.abs(nearest - droppedGap) ? gap : nearest
  , validGaps[0]);
};

export const judge = (timelineItems, item, droppedGap) => ({
  correct: isValidGap(timelineItems, item, droppedGap),
  correctGap: correctGap(timelineItems, item, droppedGap),
});
