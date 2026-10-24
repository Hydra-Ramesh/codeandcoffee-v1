import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * Delays updating the debounced value until after the specified delay has passed
 * since the last time the source value changed. Prevents high-frequency re-renders
 * and improves Interaction to Next Paint (INP) during rapid typing.
 *
 * @param value The value to debounce (e.g., search input query)
 * @param delay Delay in milliseconds (default: 250ms)
 */
export function useDebounce<T>(value: T, delay: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
