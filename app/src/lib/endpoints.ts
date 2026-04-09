// Centralized API endpoint paths

export const ENDPOINTS = {
  // Auth
  auth: {
    refresh: '/auth/refresh',
  },

  // Rankings
  rankings: {
    list: '/rankings',
    init: '/rankings/init',
    history: (userId: string) => `/rankings/${userId}/history`,
    challenges: '/rankings/challenges',
    challenge: '/rankings/challenge',
    respondChallenge: (challengeId: string) => `/rankings/challenge/${challengeId}/respond`,
  },

  // Channels / Chat
  channels: {
    list: '/channels',
    detail: (channelId: string) => `/channels/${channelId}`,
    create: '/channels',
    subchannels: (parentId: string) => `/channels/${parentId}/subchannels`,
    messages: (channelId: string) => `/channels/${channelId}/messages`,
    deleteMessage: (messageId: string) => `/channels/messages/${messageId}`,
    addReaction: (messageId: string) => `/channels/messages/${messageId}/reactions`,
    removeReaction: (messageId: string, type: string) =>
      `/channels/messages/${messageId}/reactions/${type}`,
    search: '/channels/search',
  },

  // Matches
  matches: {
    submitResult: (matchId: string) => `/matches/${matchId}/result`,
    confirmResult: (matchId: string) => `/matches/${matchId}/result/confirm`,
    rejectResult: (matchId: string) => `/matches/${matchId}/result/reject`,
    resolveDispute: (matchId: string) => `/matches/${matchId}/result/resolve`,
    resultsForEvent: (eventId: string) => `/matches/results/event/${eventId}`,
    lineup: (eventId: string) => `/matches/lineup/${eventId}`,
    setLineup: '/matches/lineup',
    autoLineup: (eventId: string) => `/matches/lineup/${eventId}/auto`,
  },

  // Training
  training: {
    groups: '/training/groups',
    attendance: (eventId: string) => `/training/attendance/${eventId}`,
    setAttendance: '/training/attendance',
    overview: '/training/overview',
  },

  // Todos
  todos: {
    list: '/todos',
    create: '/todos',
    update: (todoId: string) => `/todos/${todoId}`,
    toggleStatus: (todoId: string) => `/todos/${todoId}/status`,
    delete: (todoId: string) => `/todos/${todoId}`,
  },

  // Users / Profile
  users: {
    me: '/users/me',
    list: '/users',
    updateRoles: (userId: string) => `/users/${userId}/roles`,
  },

  // Uploads
  uploads: {
    avatar: '/uploads/avatar',
  },

  // Teams
  teams: {
    list: '/teams',
    detail: (teamId: string) => `/teams/${teamId}`,
    create: '/teams',
    addMember: (teamId: string) => `/teams/${teamId}/members`,
    removeMember: (teamId: string, userId: string) => `/teams/${teamId}/members/${userId}`,
    ensureChannel: (teamId: string) => `/teams/${teamId}/ensure-channel`,
  },

  // Events / Availability
  events: {
    detail: (eventId: string) => `/events/${eventId}`,
    create: '/events',
    update: (eventId: string) => `/events/${eventId}`,
    delete: (eventId: string) => `/events/${eventId}`,
    availability: (eventId: string) => `/events/${eventId}/availability`,
  },

  // Files
  files: {
    channel: (channelId: string) => `/files/channel/${channelId}`,
    folders: (channelId: string) => `/files/folders/${channelId}`,
    createFolder: '/files/folders',
    delete: (fileId: string) => `/files/${fileId}`,
    upload: '/upload',
  },

  // Tournaments
  tournaments: {
    list: '/tournaments',
    detail: (id: string) => `/tournaments/${id}`,
    bracket: (id: string) => `/tournaments/${id}/bracket`,
    registrations: (id: string) => `/tournaments/${id}/registrations`,
    register: (tournamentId: string) => `/tournaments/${tournamentId}/register`,
    reportResult: (tournamentId: string) => `/tournaments/${tournamentId}/result`,
  },

  // Notifications
  notifications: {
    list: '/notifications',
    markAsRead: (notificationId: string) => `/notifications/${notificationId}/read`,
    markAllAsRead: '/notifications/read-all',
    preferences: '/notifications/preferences',
  },

  // Calendar
  calendar: {
    list: '/calendar',
    week: '/calendar/week',
  },

  // Forms
  forms: {
    courtDamage: '/forms/court-damage',
    mediaUpload: '/forms/media-upload',
    courtDamageStatus: (formId: string) => `/forms/court-damage/${formId}/status`,
  },
} as const;
