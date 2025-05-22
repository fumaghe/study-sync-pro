
import { useEffect } from 'react';

/**
 * Custom hook to manage dark mode by modifying the HTML class list
 * @param isDarkMode Boolean indicating whether dark mode is active
 */
export function useDarkMode(isDarkMode: boolean): void {
  useEffect(() => {
    const classList = document.documentElement.classList;
    if (isDarkMode) {
      classList.add('dark');
    } else {
      classList.remove('dark');
    }
  }, [isDarkMode]);
}
