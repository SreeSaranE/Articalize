import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLibrary } from '../../store/library';
import { TopBar } from '../../components/TopBar';
import { CollectionItem } from '../../components/CollectionItem';
import { EmptyState } from '../../components/EmptyState';
import { NamePrompt } from '../../components/NamePrompt';
import { useTheme, spacing } from '../../theme';

export default function CollectionsScreen() {
  const { colors } = useTheme();
  const { collections, articles, createCollection, ready } = useLibrary();
  const [grid, setGrid] = useState(false);
  const [creating, setCreating] = useState(false);

  const covers = useMemo(() => {
    const byId = new Map(articles.map(a => [a.id, a]));
    return new Map(
      collections.map(c => [
        c.id,
        c.articleIds.map(id => byId.get(id)).find(a => a?.imageUrl),
      ])
    );
  }, [collections, articles]);

  const open = useCallback(
    (id: string) => router.push({ pathname: '/collection/[id]', params: { id } }),
    []
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <TopBar
        title="Collections"
        subtitle={`${collections.length} collection${collections.length === 1 ? '' : 's'}`}
        actions={[
          {
            icon: grid ? 'list-outline' : 'grid-outline',
            label: grid ? 'Show as list' : 'Show as grid',
            onPress: () => setGrid(g => !g),
          },
          { icon: 'add-circle-outline', label: 'Create collection', onPress: () => setCreating(true) },
        ]}
      />
      <FlatList
        key={grid ? 'grid' : 'list'}
        data={collections}
        keyExtractor={c => c.id}
        numColumns={grid ? 2 : 1}
        columnWrapperStyle={grid ? styles.columns : undefined}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CollectionItem collection={item} cover={covers.get(item.id)} grid={grid} onPress={open} />
        )}
        ListEmptyComponent={
          ready ? (
            <View>
              <EmptyState
                title="No collections yet"
                body="Group related articles together, like a reading list or a research topic."
                actionLabel="Create collection"
                onAction={() => setCreating(true)}
              />
            </View>
          ) : undefined
        }
      />
      <NamePrompt
        visible={creating}
        title="New collection"
        confirmLabel="Create"
        onCancel={() => setCreating(false)}
        onSubmit={name => {
          const c = createCollection(name);
          setCreating(false);
          open(c.id);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  columns: { gap: spacing.md },
});
