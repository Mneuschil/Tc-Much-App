import { useEffect } from 'react';
import axios from 'axios';
import { BACKEND_BASE_URL } from '../lib/constants';
import { useToast } from './ui/Toast';

/**
 * Pingt beim App-Start einmalig den Backend-Health-Endpoint.
 * Bei Fehler: Toast mit der konkreten URL — verhindert dass die App
 * stumm auf dem Splash haengt wenn das Backend nicht laeuft.
 */
export function BackendHealthCheck() {
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${BACKEND_BASE_URL}/api/v1/health`, { timeout: 5000 })
      .then(() => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[health] OK', BACKEND_BASE_URL);
        }
      })
      .catch(() => {
        if (cancelled) return;
        showToast(`Backend nicht erreichbar (${BACKEND_BASE_URL})`, 'error');
        if (__DEV__) {
          console.warn(`[health] FAIL ${BACKEND_BASE_URL} — laeuft "npm run dev" im tennis-club/?`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  return null;
}
