import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useLibrary } from '../../store/library';
import { TopBar } from '../../components/TopBar';
import { ArticleRow } from '../../components/ArticleRow';
import { EmptyState } from '../../components/EmptyState';
import { NamePrompt } from '../../components/NamePrompt';
import { useTheme, spacing, type } from '../../theme';

export default function CollectionScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { collections, articles, renameCollection, deleteCollection, removeFromCollection } = useLibrary();
  const collection = collections.find(c => c.id === id);

  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [renaming, setRenaming] = useState(false);

  const items = useMemo(() => {
    if (!collection) return [];
    const byId = new Map(articles.map(a => [a.id, a]));
    return collection.articleIds.flatMap(aid => byId.get(aid) ?? []);
  }, [collection, articles]);

  const onRowPress = useCallback(
    (aid: string) => {
      if (editing) {
        setSelected(prev => {
          const next = new Set(prev);
          if (next.has(aid)) next.delete(aid);
          else next.add(aid);
          return next;
        });
      } else {
        router.push({ pathname: '/article/[id]', params: { id: aid } });
      }
    },
    [editing]
  );

  if (!collection) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <TopBar title="Collection" onBack={() => router.back()} />
        <EmptyState title="Collection not found" body="It may have been deleted." />
      </SafeAreaView>
    );
  }

  const stopEditing = () => {
    setEditing(false);
    setSelected(new Set());
  };

  const confirmDelete = () =>
    Alert.alert('Delete collection', `Delete "${collection.name}"? The articles stay in your library.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          router.back();
          deleteCollection(collection.id);
        },
      },
    ]);

  const removeSelected = () => {
    removeFromCollection(collection.id, [...selected]);
    stopEditing();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <TopBar
        title={collection.name}
        subtitle={`${items.length} article${items.length === 1 ? '' : 's'}`}
        onBack={() => router.back()}
        actions={
          editing
            ? [{ icon: 'checkmark', label: 'Done editing', onPress: stopEditing }]
            : [
                { icon: 'create-outline', label: 'Rename collection', onPress: () => setRenaming(true) },
                ...(items.length
                  ? [{ icon: 'checkbox-outline' as const, label: 'Select articles', onPress: () => setEditing(true) }]
                  : []),
                { icon: 'trash-outline', label: 'Delete collection', onPress: confirmDelete },
              ]
        }
      />
      <FlatList
        data={items}
        keyExtractor={a => a.id}
        extraData={[editing, selected]}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ArticleRow
            article={item}
            onPress={onRowPress}
            selecting={editing}
            selected={selected.has(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Nothing here yet"
            body="Open an article and choose “Add to collection” to put it here."
          />
        }
      />
      {editing && (
        <View style={[styles.footer, { borderTopColor: colors.separator, backgroundColor: colors.background }]}>
          <Pressable
            onPress={removeSelected}
            disabled={selected.size === 0}
            accessibilityRole="button"
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Text style={[type.label, { color: selected.size ? colors.danger : colors.textTertiary }]}>
              {selected.size ? `Remove ${selected.size} from collection` : 'Select articles to remove'}
            </Text>
          </Pressable>
        </View>
      )}
      <NamePrompt
        visible={renaming}
        title="Rename collection"
        initialValue={collection.name}
        onCancel={() => setRenaming(false)}
        onSubmit={name => {
          renameCollection(collection.id, name);
          setRenaming(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
