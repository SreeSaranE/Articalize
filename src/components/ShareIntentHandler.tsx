import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useShareIntent } from 'expo-share-intent';
import { useLibrary } from '../store/library';
import { extractUrlFromText } from '../services/extractor';
import { useTheme, spacing, radius, type } from '../theme';

type Status = 'idle' | 'saving' | 'success' | 'error';

const AUTO_DISMISS_MS = 3000;

export const ShareIntentHandler: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { addArticle, ready } = useLibrary();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({
    debug: false,
    resetOnBackground: true,
  });

  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);

  const [slideAnim] = useState(() => new Animated.Value(40));
  const [opacityAnim] = useState(() => new Animated.Value(0));
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 30,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStatus('idle');
      setMessage('');
      setSavedId(null);
    });
  }, [clearTimer, slideAnim, opacityAnim]);

  const show = useCallback(() => {
    clearTimer();
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 160,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [clearTimer, slideAnim, opacityAnim]);

  const handleShare = useCallback(
    async (rawText: string) => {
      clearTimer();
      const url = extractUrlFromText(rawText);
      if (!url) {
        setStatus('error');
        setMessage('No link found in shared content');
        show();
        dismissTimer.current = setTimeout(dismiss, AUTO_DISMISS_MS);
        return;
      }

      setStatus('saving');
      setMessage('Saving article…');
      setSavedId(null);
      show();

      try {
        const article = await addArticle(url);
        setStatus('success');
        setMessage(article.title || 'Article saved!');
        setSavedId(article.id);
        dismissTimer.current = setTimeout(dismiss, AUTO_DISMISS_MS);
      } catch (e) {
        setStatus('error');
        setMessage(e instanceof Error ? e.message : 'Could not save article');
        dismissTimer.current = setTimeout(dismiss, AUTO_DISMISS_MS);
      }
    },
    [addArticle, clearTimer, dismiss, show]
  );

  useEffect(() => {
    if (!ready || !hasShareIntent) return;

    const raw = shareIntent.text || shareIntent.webUrl || '';
    resetShareIntent(true);

    if (raw) {
      setTimeout(() => {
        handleShare(raw);
      }, 0);
    }
  }, [ready, hasShareIntent, shareIntent, resetShareIntent, handleShare]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  if (status === 'idle') return null;

  const openSaved = () => {
    if (savedId) {
      const id = savedId;
      dismiss();
      router.push({ pathname: '/article/[id]', params: { id } });
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, 12) + 60,
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={savedId ? openSaved : undefined}
        disabled={!savedId}
        accessibilityRole={savedId ? 'button' : undefined}
        accessibilityLabel={savedId ? 'View saved article' : undefined}
        style={({ pressed }) => [
          styles.toast,
          {
            backgroundColor: colors.surface,
            borderColor: colors.separator,
            opacity: pressed && savedId ? 0.8 : 1,
          },
        ]}
      >
        <View style={styles.icon}>
          {status === 'saving' && (
            <ActivityIndicator size="small" color={colors.accent} />
          )}
          {status === 'success' && (
            <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
          )}
          {status === 'error' && (
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
          )}
        </View>

        <Text
          style={[type.caption, styles.message, { color: colors.text, fontWeight: '500' }]}
          numberOfLines={1}
        >
          {status === 'saving' ? 'Saving article…' : message}
        </Text>

        {status === 'success' && savedId && (
          <View style={[styles.viewBadge, { backgroundColor: colors.accent }]}>
            <Text style={[type.caption, { color: colors.onAccent, fontWeight: '600', fontSize: 11 }]}>
              View
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '90%',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flexShrink: 1,
  },
  viewBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
});
