import api from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';
import type { CreateChannelInput } from '@tennis-club/shared';

export const chatService = {
  getChannels: () => api.get(ENDPOINTS.channels.list).then((r) => r.data.data),

  getChannel: (channelId: string) =>
    api.get(ENDPOINTS.channels.detail(channelId)).then((r) => r.data.data),

  createChannel: (input: CreateChannelInput) =>
    api.post(ENDPOINTS.channels.create, input).then((r) => r.data.data),

  createSubchannel: (parentId: string, input: CreateChannelInput) =>
    api.post(ENDPOINTS.channels.subchannels(parentId), input).then((r) => r.data.data),

  getMessages: (channelId: string, cursor?: string, limit = 20) =>
    api
      .get(ENDPOINTS.channels.messages(channelId), { params: { cursor, limit } })
      .then((r) => r.data.data),

  sendMessage: (
    channelId: string,
    input: { content: string; replyToId?: string; mediaUrls?: string[] },
  ) =>
    api
      .post(ENDPOINTS.channels.messages(channelId), { ...input, channelId })
      .then((r) => r.data.data),

  deleteMessage: (messageId: string) =>
    api.delete(ENDPOINTS.channels.deleteMessage(messageId)).then((r) => r.data),

  addReaction: (messageId: string, type: string) =>
    api.post(ENDPOINTS.channels.addReaction(messageId), { messageId, type }).then((r) => r.data),

  removeReaction: (messageId: string, type: string) =>
    api.delete(ENDPOINTS.channels.removeReaction(messageId, type)).then((r) => r.data),

  searchMessages: (query: string, channelId?: string) =>
    api
      .get(ENDPOINTS.channels.search, { params: { q: query, channelId } })
      .then((r) => r.data.data),
};
