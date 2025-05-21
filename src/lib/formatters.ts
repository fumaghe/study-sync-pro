
/**
 * Format study hours into a readable format (e.g., 1.5 hours -> 1h 30m)
 */
export const formatStudyTime = (hours: number): string => {
  if (!hours) return '0h';
  
  // Convert hours to total minutes
  const totalMinutes = Math.round(hours * 60);
  
  // Split into hours and minutes
  const displayHours = Math.floor(totalMinutes / 60);
  const displayMinutes = totalMinutes % 60;
  
  if (displayHours === 0) {
    return `${displayMinutes}m`;
  } else if (displayMinutes === 0) {
    return `${displayHours}h`;
  } else {
    return `${displayHours}h ${displayMinutes}m`;
  }
};
