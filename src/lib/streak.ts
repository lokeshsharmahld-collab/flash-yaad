import { addDaysToDateString } from './leitner';
import { StreakState } from './schema';

/**
 * Returns yesterday's date string given a YYYY-MM-DD date string.
 */
export function getYesterdayDateString(today: string): string {
  return addDaysToDateString(today, -1);
}

/**
 * Pure function to calculate updated streak on a review event.
 * Streak is updated once per day on the first review of that day.
 */
export function updateStreak(streak: StreakState, today: string): StreakState {
  if (streak.lastActiveOn === today) {
    return streak;
  }

  const yesterday = getYesterdayDateString(today);
  let newCurrent = 1;

  if (streak.lastActiveOn === yesterday) {
    newCurrent = streak.current + 1;
  } else {
    newCurrent = 1;
  }

  const newLongest = Math.max(streak.longest, newCurrent);

  return {
    current: newCurrent,
    longest: newLongest,
    lastActiveOn: today,
  };
}

/**
 * Checks if the streak is at risk (active yesterday, but not yet studied today).
 */
export function isStreakAtRisk(streak: StreakState, today: string): boolean {
  if (streak.current <= 0 || !streak.lastActiveOn) return false;
  if (streak.lastActiveOn === today) return false;
  const yesterday = getYesterdayDateString(today);
  return streak.lastActiveOn === yesterday;
}
