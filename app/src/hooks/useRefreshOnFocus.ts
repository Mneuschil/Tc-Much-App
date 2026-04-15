import { useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Refetch data when screen regains focus (navigation back).
 * Skips the initial mount to avoid double-fetching.
 *
 * Usage:
 *   const { data, refetch } = useTeams();
 *   useRefreshOnFocus(refetch);
 */
export function useRefreshOnFocus(refetch: () => void) {
  const isFirstMount = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
