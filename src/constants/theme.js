export const COLORS = {
  // Brand & Accent
  primary: '#2563EB',      // Blue
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryMuted: 'rgba(37, 99, 235, 0.12)',

  secondary: '#0D9488',    // Teal
  secondaryLight: '#14B8A6',
  secondaryMuted: 'rgba(13, 148, 136, 0.12)',

  accent: '#8B5CF6',       // Purple

  // Status Colors
  success: '#10B981',      // Emerald Green
  successMuted: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',      // Amber
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',       // Red
  dangerMuted: 'rgba(239, 68, 68, 0.15)',
  info: '#06B6D4',         // Cyan
  infoMuted: 'rgba(6, 182, 212, 0.15)',

  // Sensor Specific Colors
  water: '#0284C7',
  waterLight: '#E0F2FE',
  sound: '#F59E0B',
  soundLight: '#FEF3C7',
  temperature: '#EF4444',
  temperatureLight: '#FEE2E2',
  humidity: '#06B6D4',
  humidityLight: '#CFFAFE',
  gate: '#8B5CF6',
  gateLight: '#EDE9FE',

  // Background & Neutral (Modern Dark & Light supportive)
  background: '#0F172A',   // Slate 900
  cardBg: '#1E293B',       // Slate 800
  cardBgHover: '#334155',  // Slate 700
  surface: '#1E293B',
  border: '#334155',
  borderLight: '#475569',

  // Typography
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,
  radiusFull: 9999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
};
