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

  const [slideAnim] = useState(() => new Animated.Value(-120));
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setStatus('idle');
      setMessage('');
      setSavedId(null);
    });
  }, [clearTimer, slideAnim]);

  const show = useCallback(() => {
    clearTimer();
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 160,
    }).start();
  }, [clearTimer, slideAnim]);

  const handleShare = useCallback(
    async (rawText: string) => {
      clearTimer();
      const url = extractUrlFromText(rawText);
      if (!url) {
        setStatus('error');
        setMessage('No link found in shared content');
        show();
        dismissTimer.current = setTimeout(dismiss, 4000);
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
        dismissTimer.current = setTimeout(dismiss, 5000);
      } catch (e) {
        setStatus('error');
        setMessage(e instanceof Error ? e.message : 'Could not save article');
        dismissTimer.current = setTimeout(dismiss, 4000);
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
          top: insets.top + spacing.sm,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.banner,
          {
            backgroundColor: colors.surface,
            borderColor: colors.separator,
            shadowColor: '#000',
          },
        ]}
      >
        <View style={styles.iconCol}>
          {status === 'saving' && (
            <ActivityIndicator size="small" color={colors.accent} />
          )}
          {status === 'success' && (
            <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
          )}
          {status === 'error' && (
            <Ionicons name="alert-circle" size={22} color={colors.danger} />
          )}
        </View>

        <View style={styles.textCol}>
          <Text
            style={[type.caption, { color: colors.textSecondary, fontWeight: '500' }]}
            numberOfLines={1}
          >
            {status === 'saving'
              ? 'Incoming Share'
              : status === 'success'
                ? 'Saved to Library'
                : 'Share Error'}
          </Text>
          <Text
            style={[type.body, { color: colors.text, fontWeight: '500' }]}
            numberOfLines={2}
          >
            {message}
          </Text>
        </View>

        {status === 'success' && savedId && (
          <Pressable
            onPress={openSaved}
            accessibilityRole="button"
            accessibilityLabel="View article"
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[type.label, { color: colors.onAccent, fontSize: 13 }]}>View</Text>
          </Pressable>
        )}

        <Pressable
          onPress={dismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss banner"
          style={styles.closeButton}
        >
          <Ionicons name="close" size={18} color={colors.textTertiary} />
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  iconCol: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: spacing.xs,
  },
});
