import { describe, it, expect } from 'vitest';
import { applyReview, getDueCards, addDaysToDateString } from './leitner';
import { updateStreak, getYesterdayDateString } from './streak';
import { Card } from './schema';

function makeDummyCard(overrides: Partial<Card> = {}): Card {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    deckId: '00000000-0000-0000-0000-000000000002',
    front: 'Question',
    back: 'Answer',
    box: 1,
    lastReviewedOn: null,
    nextReviewOn: '2026-09-06',
    totalReviews: 0,
    totalCorrect: 0,
    createdAt: '2026-09-06T00:00:00.000Z',
    updatedAt: '2026-09-06T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

describe('YaadKaro Acceptance Tests: Leitner & Streak (T1 - T15)', () => {
  const today = '2026-09-06';

  // T1: Box1 + correct -> Box2, nextReviewOn = today+2
  it('T1: Box1 + correct -> Box2, nextReviewOn = today+2', () => {
    const card = makeDummyCard({ box: 1 });
    const reviewed = applyReview(card, 'correct', today);
    expect(reviewed.box).toBe(2);
    expect(reviewed.nextReviewOn).toBe('2026-09-08');
  });

  // T2: Box4 + correct -> Box5, nextReviewOn = today+14
  it('T2: Box4 + correct -> Box5, nextReviewOn = today+14', () => {
    const card = makeDummyCard({ box: 4 });
    const reviewed = applyReview(card, 'correct', today);
    expect(reviewed.box).toBe(5);
    expect(reviewed.nextReviewOn).toBe('2026-09-20');
  });

  // T3: Box5 + correct -> Box5 (stays), nextReviewOn = today+14
  it('T3: Box5 + correct -> Box5 (stays), nextReviewOn = today+14', () => {
    const card = makeDummyCard({ box: 5 });
    const reviewed = applyReview(card, 'correct', today);
    expect(reviewed.box).toBe(5);
    expect(reviewed.nextReviewOn).toBe('2026-09-20');
  });

  // T4: Box5 + wrong -> Box1, nextReviewOn = today+1
  it('T4: Box5 + wrong -> Box1, nextReviewOn = today+1', () => {
    const card = makeDummyCard({ box: 5 });
    const reviewed = applyReview(card, 'wrong', today);
    expect(reviewed.box).toBe(1);
    expect(reviewed.nextReviewOn).toBe('2026-09-07');
  });

  // T5: Box3 + wrong -> Box1
  it('T5: Box3 + wrong -> Box1', () => {
    const card = makeDummyCard({ box: 3 });
    const reviewed = applyReview(card, 'wrong', today);
    expect(reviewed.box).toBe(1);
    expect(reviewed.nextReviewOn).toBe('2026-09-07');
  });

  // T6: totalReviews and totalCorrect increment correctly
  it('T6: totalReviews and totalCorrect increment correctly', () => {
    const card = makeDummyCard({ totalReviews: 5, totalCorrect: 4 });
    const correctReview = applyReview(card, 'correct', today);
    expect(correctReview.totalReviews).toBe(6);
    expect(correctReview.totalCorrect).toBe(5);

    const wrongReview = applyReview(card, 'wrong', today);
    expect(wrongReview.totalReviews).toBe(6);
    expect(wrongReview.totalCorrect).toBe(4);
  });

  // T7: dueCards excludes cards with nextReviewOn = tomorrow
  it('T7: dueCards excludes cards with nextReviewOn = tomorrow', () => {
    const tomorrow = '2026-09-07';
    const card = makeDummyCard({ nextReviewOn: tomorrow });
    const due = getDueCards([card], today);
    expect(due).toHaveLength(0);
  });

  // T8: dueCards includes cards with nextReviewOn = yesterday (overdue)
  it('T8: dueCards includes cards with nextReviewOn = yesterday (overdue)', () => {
    const yesterday = '2026-09-05';
    const card = makeDummyCard({ nextReviewOn: yesterday });
    const due = getDueCards([card], today);
    expect(due).toHaveLength(1);
    expect(due[0].id).toBe(card.id);
  });

  // T9: dueCards excludes soft-deleted cards
  it('T9: dueCards excludes soft-deleted cards', () => {
    const card = makeDummyCard({
      nextReviewOn: today,
      deletedAt: '2026-09-06T00:00:00.000Z',
    });
    const due = getDueCards([card], today);
    expect(due).toHaveLength(0);
  });

  // T10: Streak: yesterday active -> today review -> current+1
  it('T10: Streak: yesterday active -> today review -> current+1', () => {
    const yesterday = getYesterdayDateString(today);
    const initialStreak = { current: 3, longest: 5, lastActiveOn: yesterday };
    const updated = updateStreak(initialStreak, today);
    expect(updated.current).toBe(4);
    expect(updated.lastActiveOn).toBe(today);
  });

  // T11: Streak: 2 days gap -> current resets to 1
  it('T11: Streak: 2 days gap -> current resets to 1', () => {
    const twoDaysAgo = '2026-09-04';
    const initialStreak = { current: 3, longest: 5, lastActiveOn: twoDaysAgo };
    const updated = updateStreak(initialStreak, today);
    expect(updated.current).toBe(1);
    expect(updated.longest).toBe(5);
    expect(updated.lastActiveOn).toBe(today);
  });

  // T12: Streak: two reviews same day -> current unchanged
  it('T12: Streak: two reviews same day -> current unchanged', () => {
    const initialStreak = { current: 4, longest: 5, lastActiveOn: today };
    const updated = updateStreak(initialStreak, today);
    expect(updated.current).toBe(4);
    expect(updated.lastActiveOn).toBe(today);
  });

  // T13: Streak: longest updates correctly
  it('T13: Streak: longest updates correctly', () => {
    const yesterday = getYesterdayDateString(today);
    const initialStreak = { current: 5, longest: 5, lastActiveOn: yesterday };
    const updated = updateStreak(initialStreak, today);
    expect(updated.current).toBe(6);
    expect(updated.longest).toBe(6);
  });

  // T14: Date "2026-12-31" + 1 day = "2027-01-01"
  it('T14: Date "2026-12-31" + 1 day = "2027-01-01"', () => {
    const nextDay = addDaysToDateString('2026-12-31', 1);
    expect(nextDay).toBe('2027-01-01');
  });

  // T15: Month boundary: "2026-02-28" + 2 days = "2026-03-02"
  it('T15: Month boundary: "2026-02-28" + 2 days = "2026-03-02"', () => {
    const res = addDaysToDateString('2026-02-28', 2);
    expect(res).toBe('2026-03-02');
  });
});
