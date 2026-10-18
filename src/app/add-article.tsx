import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useLibrary } from '../store/library';
import { extractUrlFromText, normalizeUrl } from '../services/extractor';
import { useTheme, spacing, radius, type } from '../theme';

export default function AddArticleScreen() {
  const { colors } = useTheme();
  const { addArticle } = useLibrary();
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Leaving the screen cancels a fetch that is still running.
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  // Pre-fill with a link on the clipboard.
  useEffect(() => {
    Clipboard.getStringAsync()
      .then(text => {
        const found = extractUrlFromText(text);
        if (found) setUrl(found);
      })
      .catch(() => undefined);
  }, []);

  const valid = !!normalizeUrl(url);

  const save = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    try {
      abortRef.current = new AbortController();
      const article = await addArticle(url, abortRef.current.signal);
      router.replace({ pathname: '/article/[id]', params: { id: article.id } });
    } catch (e) {
      if (abortRef.current?.signal.aborted) return;
      setError(e instanceof Error ? e.message : 'Could not save this article');
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" style={styles.side}>
          <Text style={[type.label, { color: colors.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Text style={[type.headline, { color: colors.text }]}>Add article</Text>
        <Pressable
          onPress={save}
          disabled={!valid || busy}
          hitSlop={8}
          accessibilityRole="button"
          style={[styles.side, styles.sideEnd]}
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Text style={[type.label, { color: valid ? colors.accent : colors.textTertiary }]}>Save</Text>
          )}
        </Pressable>
      </View>
      <View style={styles.body}>
        <TextInput
          style={[type.body, styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Paste a link"
          placeholderTextColor={colors.textTertiary}
          value={url}
          onChangeText={t => {
            setUrl(t);
            setError('');
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          onSubmitEditing={save}
          editable={!busy}
          autoFocus
        />
        {error ? <Text style={[type.caption, { color: colors.danger }]}>{error}</Text> : null}
        <Text style={[type.caption, { color: colors.textSecondary }]}>
          The page is fetched and cleaned on your device. Summaries are generated when you open an article.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: 56,
  },
  side: { width: 64 },
  sideEnd: { alignItems: 'flex-end' },
  body: { paddingHorizontal: spacing.md, gap: spacing.sm },
  input: { height: 44, paddingHorizontal: spacing.md, borderRadius: radius.sm, borderCurve: 'continuous' },
});
