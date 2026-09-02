export type ThemeColors = {
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  background: string;
  surface: string;
  onBackground: string;
  onSurface: string;
  tertiary: string;
  secondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  error: string;
  errorContainer: string;
  card: string;
  textLight: string;
};

export const LightColors: ThemeColors = {
  primary: '#94442E',
  primaryContainer: '#B35C44',
  onPrimary: '#FFFFFF',
  background: '#FCF9F6',
  surface: '#FCF9F6',
  onBackground: '#1B1C1A',
  onSurface: '#1B1C1A',
  tertiary: '#006195',
  secondary: '#4E6078',
  textMuted: '#55433E',
  border: '#88726D',
  borderLight: '#DBC1BA',
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  card: '#FFFFFF',
  textLight: '#FFFFFF',
};

export const DarkColors: ThemeColors = {
  primary: '#1D72B8', // Royal / accessible blue replacing brown/terracotta in Dark Mode!
  primaryContainer: '#174A7C',
  onPrimary: '#FFFFFF',
  background: '#12151A', // Soft dark charcoal / blue-black
  surface: '#181E26',
  onBackground: '#F3F4F6', // Crisp light readable text
  onSurface: '#F3F4F6',
  tertiary: '#38BDF8', // Sky/accent blue
  secondary: '#94A3B8', // Muted slate blue secondary text
  textMuted: '#9CA3AF', // Muted light gray text
  border: '#374151', // Dark slate border
  borderLight: '#262F3C', // Subtle divider border
  error: '#EF4444',
  errorContainer: '#451A1A',
  card: '#1A202A', // Dark charcoal card surface
  textLight: '#FFFFFF',
};

let currentMode: 'light' | 'dark' = 'light';

export const getThemeMode = () => currentMode;

export const setThemeMode = (mode: 'light' | 'dark') => {
  currentMode = mode;
};

export const Colors: ThemeColors = new Proxy(LightColors, {
  get(target, prop: string) {
    const active = currentMode === 'dark' ? DarkColors : LightColors;
    return (active as any)[prop] ?? (target as any)[prop];
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  marginMobile: 20,
  touchTarget: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  soft: {
    shadowColor: '#762D19',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  glow: {
    shadowColor: '#94CCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 6,
  },
};
