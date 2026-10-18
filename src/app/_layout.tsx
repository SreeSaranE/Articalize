import React, { useEffect, useMemo } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LibraryProvider } from '../store/library';
import { ShareIntentHandler } from '../components/ShareIntentHandler';
import { useTheme } from '../theme';

export default function RootLayout() {
  const { colors, scheme } = useTheme();

  // Navigation's default theme is light: without this, screens flash white mid-transition in dark mode.
  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.separator,
        primary: colors.accent,
      },
    };
  }, [scheme, colors]);

  // Also paints the native window behind the app (covers the gaps during animations).
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);
  }, [colors.background]);

  return (
    <SafeAreaProvider>
      <LibraryProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style="auto" />
          <ShareIntentHandler />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="article/[id]" />
            <Stack.Screen name="collection/[id]" />
            <Stack.Screen name="add-article" options={{ presentation: 'modal' }} />
            <Stack.Screen name="pick-collection/[id]" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </LibraryProvider>
    </SafeAreaProvider>
  );
}
