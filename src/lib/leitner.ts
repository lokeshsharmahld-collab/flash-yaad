import { addDays, format } from 'date-fns';
import { Card } from './schema';

export const LEITNER_INTERVALS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14,
};

/**
 * Add days to a local date string "YYYY-MM-DD" safely avoiding UTC timezone jumps.
 */
export function addDaysToDateString(dateStr: string, daysToAdd: number): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid date string format: ${dateStr}`);
  }
  const [year, month, day] = parts;
  const localDate = new Date(year, month - 1, day, 12, 0, 0);
  const resultDate = addDays(localDate, daysToAdd);
  return format(resultDate, 'yyyy-MM-dd');
}

/**
 * Get today's local date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Pure Leitner algorithm review state transition
 */
export function applyReview(
  card: Card,
  result: 'correct' | 'wrong',
  today: string
): Card {
  const newBox: 1 | 2 | 3 | 4 | 5 =
    result === 'correct'
      ? (Math.min(card.box + 1, 5) as 1 | 2 | 3 | 4 | 5)
      : 1;

  const intervalDays = LEITNER_INTERVALS[newBox];
  const nextReviewOn = addDaysToDateString(today, intervalDays);

  return {
    ...card,
    box: newBox,
    lastReviewedOn: today,
    nextReviewOn,
    totalReviews: card.totalReviews + 1,
    totalCorrect: card.totalCorrect + (result === 'correct' ? 1 : 0),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Computes due cards for today, respecting daily new card limits
 */
export function getDueCards(
  cards: Card[],
  today: string,
  dailyNewCardLimit: number = 20
): Card[] {
  const eligible = cards.filter(
    (c) => c.deletedAt === null && c.nextReviewOn <= today
  );

  // Separate reviews (totalReviews > 0) from brand new cards (totalReviews === 0)
  const reviews: Card[] = [];
  const newCards: Card[] = [];

  for (const c of eligible) {
    if (c.totalReviews > 0) {
      reviews.push(c);
    } else {
      newCards.push(c);
    }
  }

  // Sort new cards by createdAt ASC and cap at dailyNewCardLimit
  newCards.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const limitedNewCards = newCards.slice(0, dailyNewCardLimit);

  // Combine and sort by: box ASC (hardest first), then nextReviewOn ASC, then createdAt ASC
  const combined = [...reviews, ...limitedNewCards];
  combined.sort((a, b) => {
    if (a.box !== b.box) return a.box - b.box;
    if (a.nextReviewOn !== b.nextReviewOn) return a.nextReviewOn.localeCompare(b.nextReviewOn);
    return a.createdAt.localeCompare(b.createdAt);
  });

  return combined;
}

/**
 * "Study ahead" cards (cards scheduled after today)
 */
export function getStudyAheadCards(cards: Card[], today: string): Card[] {
  return cards
    .filter((c) => c.deletedAt === null && c.nextReviewOn > today)
    .sort((a, b) => {
      if (a.nextReviewOn !== b.nextReviewOn) return a.nextReviewOn.localeCompare(b.nextReviewOn);
      if (a.box !== b.box) return a.box - b.box;
      return a.createdAt.localeCompare(b.createdAt);
    });
}
