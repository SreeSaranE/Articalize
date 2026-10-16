import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useLibrary } from '../../store/library';
import { StorageService } from '../../services/storage';
import { TopBar } from '../../components/TopBar';
import { EmptyState } from '../../components/EmptyState';
import { SectionLabel } from '../../components/settings/shared';
import { useTheme, spacing, radius, type } from '../../theme';

const fullDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function ArticleScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { articles, collections, settings, toggleBookmark, toggleRead, deleteArticle, summarize } = useLibrary();
  const article = articles.find(a => a.id === id);

  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState('');
  const [showText, setShowText] = useState(false);
  const [fullText, setFullText] = useState<string | null>(null);
  const autoTried = useRef(false);

  // The text is only read from storage when the section is opened.
  useEffect(() => {
    if (!showText || fullText !== null) return;
    let cancelled = false;
    StorageService.getContent(id).then(t => {
      if (!cancelled) setFullText(t);
    });
    return () => {
      cancelled = true;
    };
  }, [showText, fullText, id]);

  const runSummary = useCallback(async () => {
    setSummarizing(true);
    setError('');
    try {
      await summarize(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not summarize this article');
    } finally {
      setSummarizing(false);
    }
  }, [id, summarize]);

  // First open with a key configured: summarize automatically, once.
  const needsSummary = !!article && !article.summary;
  const hasKey = !!settings.geminiApiKey;
  useEffect(() => {
    if (needsSummary && hasKey && !autoTried.current) {
      autoTried.current = true;
      runSummary();
    }
  }, [needsSummary, hasKey, runSummary]);

  if (!article) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <TopBar title="Article" onBack={() => router.back()} />
        <EmptyState title="Article not found" body="It may have been deleted." />
      </SafeAreaView>
    );
  }

  const inCollections = collections.filter(c => c.articleIds.includes(article.id));

  const openOriginal = async () => {
    try {
      await WebBrowser.openBrowserAsync(article.url, {
        toolbarColor: colors.background,
        controlsColor: colors.accent,
      });
    } catch {
      // ignore
    }
  };
  const share = () =>
    Share.share({ title: article.title, message: `${article.title}\n${article.url}`, url: article.url }).catch(
      () => undefined
    );
  const confirmDelete = () =>
    Alert.alert('Delete article', 'Remove this article from your library?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          router.back();
          deleteArticle(article.id);
        },
      },
    ]);

  const meta = [article.author, fullDate(article.publishedAt), `${article.readMinutes} min read`]
    .filter(Boolean)
    .join(' · ');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <TopBar
        title={article.source}
        onBack={() => router.back()}
        actions={[
          {
            icon: article.isRead ? 'checkmark-done' : 'checkmark-done-outline',
            label: article.isRead ? 'Mark as unread' : 'Mark as read',
            active: article.isRead,
            onPress: () => toggleRead(article.id),
          },
          {
            icon: article.isBookmarked ? 'bookmark' : 'bookmark-outline',
            label: article.isBookmarked ? 'Remove bookmark' : 'Bookmark',
            active: article.isBookmarked,
            onPress: () => toggleBookmark(article.id),
          },
          { icon: 'share-outline', label: 'Share', onPress: share },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {article.imageUrl ? (
          <Image
            source={{ uri: article.imageUrl }}
            style={[styles.hero, { backgroundColor: colors.surface }]}
            contentFit="cover"
            transition={150}
            cachePolicy="disk"
          />
        ) : null}
        <Text style={[type.title, { color: colors.text }]}>{article.title}</Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>{meta}</Text>
        {article.description ? (
          <Text style={[type.body, { color: colors.textSecondary }]}>{article.description}</Text>
        ) : null}

        <View style={styles.links}>
          <ActionLink icon="open-outline" label="Open original" onPress={openOriginal} />
          <ActionLink
            icon="albums-outline"
            label={inCollections.length ? `In ${inCollections.length} collection${inCollections.length === 1 ? '' : 's'}` : 'Add to collection'}
            onPress={() => router.push({ pathname: '/pick-collection/[id]', params: { id: article.id } })}
          />
        </View>

        <SectionLabel>Summary</SectionLabel>
        {article.summary ? (
          <View style={styles.summary}>
            {article.summary.bullets.map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
                <Text style={[type.body, styles.bulletText, { color: colors.text }]}>{b}</Text>
              </View>
            ))}
            {article.summary.significance ? (
              <Text style={[type.body, { color: colors.textSecondary }]}>
                <Text style={{ fontWeight: '600', color: colors.text }}>Why it matters  </Text>
                {article.summary.significance}
              </Text>
            ) : null}
            <Pressable onPress={runSummary} disabled={summarizing} hitSlop={8} accessibilityRole="button">
              <Text style={[type.caption, { color: colors.accent }]}>
                {summarizing ? 'Summarizing…' : 'Regenerate summary'}
              </Text>
            </Pressable>
          </View>
        ) : summarizing ? (
          <View style={styles.row}>
            <ActivityIndicator size="small" color={colors.textSecondary} />
            <Text style={[type.body, { color: colors.textSecondary }]}>Summarizing…</Text>
          </View>
        ) : (
          <View style={styles.summary}>
            <Text style={[type.body, { color: colors.textSecondary }]}>
              {hasKey
                ? 'No summary yet.'
                : 'Add your Gemini API key in Settings to summarize articles.'}
            </Text>
            <Pressable
              onPress={hasKey ? runSummary : () => router.navigate('/settings')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, { backgroundColor: colors.accent, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[type.label, { color: colors.onAccent }]}>{hasKey ? 'Summarize' : 'Open settings'}</Text>
            </Pressable>
          </View>
        )}
        {error ? <Text style={[type.caption, { color: colors.danger }]}>{error}</Text> : null}

        <Pressable
          onPress={() => setShowText(v => !v)}
          accessibilityRole="button"
          style={[styles.row, { marginTop: spacing.lg }]}
        >
          <Text style={[type.label, { color: colors.text, flex: 1 }]}>Full text</Text>
          <Ionicons name={showText ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
        </Pressable>
        {showText && fullText === '' && (
          <Text style={[type.body, { color: colors.textSecondary }]}>No text was extracted from this page.</Text>
        )}
        {showText &&
          fullText?.split('\n\n').map((para, i) => (
            <Text key={i} style={[type.body, { color: colors.text }]}>
              {para}
            </Text>
          ))}

        <Pressable onPress={confirmDelete} accessibilityRole="button" style={styles.delete}>
          <Text style={[type.label, { color: colors.danger }]}>Delete article</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionLink({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.link, { backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 }]}
    >
      <Ionicons name={icon} size={16} color={colors.text} />
      <Text style={[type.caption, { color: colors.text, fontWeight: '500' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl * 2, gap: spacing.sm + 4 },
  hero: { width: '100%', height: 200, borderRadius: radius.md, borderCurve: 'continuous' },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  summary: { gap: spacing.sm + 4 },
  bulletRow: { flexDirection: 'row', gap: spacing.sm + 4 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 9 },
  bulletText: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  button: {
    alignSelf: 'flex-start',
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderCurve: 'continuous',
  },
  delete: { paddingVertical: spacing.md, marginTop: spacing.lg },
});
