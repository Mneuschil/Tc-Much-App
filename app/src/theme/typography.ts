// Design System – Typography Scale

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  bodyLarge: { fontSize: 17, fontWeight: '400' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 15, fontWeight: '600' as const, lineHeight: 20 },
  labelSmall: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18, letterSpacing: 0.5 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },

  // Aliases for existing screens
  display: { fontSize: 34, fontWeight: '800' as const, lineHeight: 40, letterSpacing: -0.5 },
  h4: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const, lineHeight: 22 },
  captionMedium: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  buttonSmall: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
};

export type Typography = typeof typography;
