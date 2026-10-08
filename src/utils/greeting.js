/*
 * ================================================================
 * TIME-OF-DAY GREETING
 *
 * Real wall-clock greeting instead of a hardcoded "Good morning" -
 * shared by every dashboard-style page that greets the user by
 * name.
 * ================================================================
 */

export function greetingForHour(hour) {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Good night'
}

export function currentGreeting() {
  return greetingForHour(new Date().getHours())
}
