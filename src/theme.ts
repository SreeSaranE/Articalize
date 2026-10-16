import { useColorScheme } from 'react-native';

// Minimal system: neutral surfaces, one accent, hairline separators, no cards.
const palettes = {
  light: {
    background: '#FFFFFF',
    surface: '#F4F4F5', // inputs, chips
    text: '#111113',
    textSecondary: '#6B6B73',
    textTertiary: '#9A9AA2',
    separator: '#E4E4E7',
    accent: '#2563EB',
    onAccent: '#FFFFFF',
    danger: '#DC2626',
  },
  dark: {
    background: '#000000',
    surface: '#18181B',
    text: '#F4F4F5',
    textSecondary: '#A1A1AA',
    textTertiary: '#71717A',
    separator: '#27272A',
    accent: '#60A5FA',
    onAccent: '#000000',
    danger: '#F87171',
  },
} as const;

export type Colors = { [K in keyof (typeof palettes)['light']]: string };

export function useTheme(): { colors: Colors; scheme: 'light' | 'dark' } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { colors: palettes[scheme], scheme };
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { sm: 8, md: 12, full: 9999 } as const;

export const type = {
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  headline: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  label: { fontSize: 15, fontWeight: '500' },
  caption: { fontSize: 13, fontWeight: '400' },
} as const;
