import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLibrary } from '../../store/library';
import { TopBar } from '../../components/TopBar';
import { ArticleRow } from '../../components/ArticleRow';
import { EmptyState } from '../../components/EmptyState';
import { useTheme, spacing, radius, type } from '../../theme';

type View_ = 'unread' | 'saved' | 'read';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { articles, ready } = useLibrary();
  const [view, setView] = useState<View_>('unread');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter(a => {
      if (view === 'read' ? !a.isRead : view === 'saved' ? !a.isBookmarked : a.isRead) return false;
      return !q || a.title.toLowerCase().includes(q) || a.source.toLowerCase().includes(q);
    });
  }, [articles, view, query]);

  const open = useCallback((id: string) => router.push({ pathname: '/article/[id]', params: { id } }), []);
  const toggleView = (v: View_) => setView(cur => (cur === v ? 'unread' : v));

  const label = view === 'read' ? 'Read · ' : view === 'saved' ? 'Saved · ' : '';
  const subtitle = `${label}${visible.length} article${visible.length === 1 ? '' : 's'}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <TopBar
        title="Articalize"
        subtitle={subtitle}
        actions={[
          { icon: 'search', label: 'Search', active: searching, onPress: () => { setSearching(s => !s); setQuery(''); } },
          {
            icon: view === 'read' ? 'checkmark-done' : 'checkmark-done-outline',
            label: 'Show read articles',
            active: view === 'read',
            onPress: () => toggleView('read'),
          },
          {
            icon: view === 'saved' ? 'bookmark' : 'bookmark-outline',
            label: 'Show saved articles',
            active: view === 'saved',
            onPress: () => toggleView('saved'),
          },
          { icon: 'add-circle-outline', label: 'Add article', onPress: () => router.push('/add-article') },
        ]}
      />
      {searching && (
        <View style={[styles.search, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <TextInput
            style={[type.body, styles.searchInput, { color: colors.text }]}
            placeholder="Search"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
          />
        </View>
      )}
      <FlatList
        data={visible}
        keyExtractor={a => a.id}
        renderItem={({ item }) => <ArticleRow article={item} onPress={open} />}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          ready ? (
            query || view !== 'unread' || articles.length > 0 ? (
              <EmptyState
                title={query ? 'No matches' : view === 'unread' ? 'All caught up' : 'Nothing here yet'}
                body={
                  query
                    ? 'No saved article matches your search.'
                    : view === 'unread'
                      ? 'You have read everything you saved.'
                      : view === 'saved'
                        ? 'Bookmark an article to find it here.'
                        : 'Articles you mark as read appear here.'
                }
              />
            ) : (
              <EmptyState
                title="No articles yet"
                body="Paste a link from Android Police, Wikipedia or any site to save it."
                actionLabel="Add article"
                onAction={() => router.push('/add-article')}
              />
            )
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 40,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
  },
  searchInput: { flex: 1, paddingVertical: 0 },
});
