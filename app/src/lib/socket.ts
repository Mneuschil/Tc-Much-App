import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './constants';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket | null {
  if (socket?.connected) {
    return socket;
  }

  try {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });

    if (__DEV__) {
      socket.on('connect', () => {
        // eslint-disable-next-line no-console
        console.log('[socket] connected', SOCKET_URL);
      });
      socket.on('disconnect', (reason) => {
        // eslint-disable-next-line no-console
        console.log('[socket] disconnected:', reason);
      });
      socket.on('connect_error', (err) => {
        // eslint-disable-next-line no-console
        console.log('[socket] connect_error:', err.message);
      });
    }

    return socket;
  } catch {
    return null;
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
