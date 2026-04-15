export const FEATURES = {
  news: true,
  courtView: true,
  channels: true,
  todos: true,
  forms: true,
  channelsManage: true,
  settings: true,
  notifications: true,

  tournaments: false,
  ranking: false,
  training: false,
  files: false,
  resultHistory: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isFeatureEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}
