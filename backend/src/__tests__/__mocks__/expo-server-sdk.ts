export type ExpoPushMessage = {
  to: string;
  sound?: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
};

export type ExpoPushTicket = { status: 'ok'; id: string } | { status: 'error'; message: string };
export type ExpoPushReceiptId = string;
export type ExpoPushReceipt = { status: 'ok' } | { status: 'error'; message: string; details?: { error: string } };

const sentMessages: ExpoPushMessage[][] = [];

export class Expo {
  static isExpoPushToken(token: string): boolean {
    return typeof token === 'string' && token.startsWith('ExponentPushToken[');
  }

  chunkPushNotifications(messages: ExpoPushMessage[]): ExpoPushMessage[][] {
    return [messages];
  }

  async sendPushNotificationsAsync(chunk: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    sentMessages.push(chunk);
    return chunk.map(() => ({
      status: 'ok' as const,
      id: 'receipt-' + Math.random().toString(36).slice(2),
    }));
  }

  chunkPushNotificationReceiptIds(ids: ExpoPushReceiptId[]): ExpoPushReceiptId[][] {
    return [ids];
  }

  async getPushNotificationReceiptsAsync(ids: ExpoPushReceiptId[]): Promise<Record<string, ExpoPushReceipt>> {
    const result: Record<string, ExpoPushReceipt> = {};
    for (const id of ids) {
      if (id.includes('invalid')) {
        result[id] = { status: 'error', message: 'Device not registered', details: { error: 'DeviceNotRegistered' } };
      } else {
        result[id] = { status: 'ok' };
      }
    }
    return result;
  }

  static _sentMessages = sentMessages;
}

export default Expo;
