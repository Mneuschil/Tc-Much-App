import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolves the backend base host (protocol + host + port) at runtime.
 *
 * Priority:
 * 1. `EXPO_PUBLIC_API_HOST` env override (z.B. fuer Staging/Tunnel)
 * 2. Physisches Geraet via Expo Go: leite Host aus `Constants.expoConfig.hostUri`
 *    ab — das ist die IP, ueber die Metro den Bundle ausliefert. Damit ist
 *    der Backend-Host garantiert erreichbar, wenn die App geladen werden konnte.
 * 3. Fallback: localhost (Simulator, Web, Android Emulator → 10.0.2.2)
 *
 * Backend laeuft immer auf Port 3000.
 */
const BACKEND_PORT = 3000;

function resolveBackendHost(): string {
  const override = process.env.EXPO_PUBLIC_API_HOST;
  if (override) {
    return override.replace(/\/$/, '');
  }

  // hostUri sieht z.B. so aus: "192.168.1.42:8081" oder "192.168.1.42:8081/--/foo"
  const manifest2 = Constants.manifest2 as
    | { extra?: { expoGo?: { developer?: { hostUri?: string } } } }
    | undefined;
  const hostUri = Constants.expoConfig?.hostUri ?? manifest2?.extra?.expoGo?.developer?.hostUri;

  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    // localhost auf physischem Geraet ist nutzlos → fallthrough
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:${BACKEND_PORT}`;
    }
  }

  // Android Emulator erreicht den Host ueber 10.0.2.2
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${BACKEND_PORT}`;
  }

  return `http://localhost:${BACKEND_PORT}`;
}

const BACKEND_HOST = resolveBackendHost();

export const API_URL = `${BACKEND_HOST}/api/v1`;
export const SOCKET_URL = BACKEND_HOST;
export const BACKEND_BASE_URL = BACKEND_HOST;

if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log(`[api] Backend: ${BACKEND_HOST}`);
}
