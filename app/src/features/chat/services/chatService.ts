import api from '../../../lib/api';

export const chatService = {
  getChannels: () =>
    api.get('/channels').then(r => r.data.data),

  getChannel: (channelId: string) =>
    api.get(`/channels/${channelId}`).then(r => r.data.data),

  createChannel: (input: any) =>
    api.post('/channels', input).then(r => r.data.data),

  createSubchannel: (parentId: string, input: any) =>
    api.post(`/channels/${parentId}/subchannels`, input).then(r => r.data.data),

  getMessages: (channelId: string, cursor?: string, limit = 20) =>
    api.get(`/channels/${channelId}/messages`, { params: { cursor, limit } }).then(r => r.data.data),

  sendMessage: (channelId: string, input: { content: string; replyToId?: string; mediaUrls?: string[] }) =>
    api.post(`/channels/${channelId}/messages`, { ...input, channelId }).then(r => r.data.data),

  deleteMessage: (messageId: string) =>
    api.delete(`/channels/messages/${messageId}`).then(r => r.data),

  addReaction: (messageId: string, type: string) =>
    api.post(`/channels/messages/${messageId}/reactions`, { messageId, type }).then(r => r.data),

  removeReaction: (messageId: string, type: string) =>
    api.delete(`/channels/messages/${messageId}/reactions/${type}`).then(r => r.data),

  searchMessages: (query: string, channelId?: string) =>
    api.get(`/channels/search?q=${query}${channelId ? `&channelId=${channelId}` : ''}`).then(r => r.data.data),
};
