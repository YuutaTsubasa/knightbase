/**
 * Game time utilities - handles 5 AM cutoff for game days
 * Game day starts at 5:00 AM local time instead of midnight
 */

/**
 * Get the current game date (5 AM cutoff)
 * If current time is before 5 AM, returns previous calendar day
 */
export function getGameDate(date: Date = new Date()): string {
  const gameDate = new Date(date);
  
  // If before 5 AM, subtract a day
  if (gameDate.getHours() < 5) {
    gameDate.setDate(gameDate.getDate() - 1);
  }
  
  return gameDate.toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Get the Monday of the current game week (5 AM cutoff)
 * Game week starts on Monday at 5:00 AM local time
 */
export function getGameWeekMonday(date: Date = new Date()): string {
  const gameDate = new Date(date);
  
  // If before 5 AM, subtract a day
  if (gameDate.getHours() < 5) {
    gameDate.setDate(gameDate.getDate() - 1);
  }
  
  // Get Monday of this week
  const monday = new Date(gameDate);
  monday.setDate(gameDate.getDate() - gameDate.getDay() + (gameDate.getDay() === 0 ? -6 : 1));
  
  return monday.toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Check if two dates are the same game day
 */
export function isSameGameDay(date1: Date, date2: Date): boolean {
  return getGameDate(date1) === getGameDate(date2);
}

/**
 * Check if a date string is today's game date
 */
export function isToday(dateString: string): boolean {
  return getGameDate() === dateString;
}

/**
 * Check if a date string is this game week's Monday
 */
export function isThisWeek(mondayString: string): boolean {
  return getGameWeekMonday() === mondayString;
}

/**
 * Get all dates in a game week (Monday to Sunday)
 */
export function getGameWeekDates(mondayDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(mondayDate);
  
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}