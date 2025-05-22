
import { useState, useEffect } from 'react';

/**
 * Custom hook for using localStorage with automatic serialization/deserialization
 * @param key The localStorage key to use
 * @param initialValue The fallback value if none exists in localStorage
 * @returns A stateful value and a function to update it, like useState
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  // Update localStorage whenever the state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.warn(`Error saving to localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);
  
  return [storedValue, setStoredValue];
}
