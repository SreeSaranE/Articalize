import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useLibrary } from '../../store/library';
import { NamePrompt } from '../../components/NamePrompt';
import { EmptyState } from '../../components/EmptyState';
import { useTheme, spacing, type } from '../../theme';

// Sheet to choose which collections an article belongs to.
export default function PickCollectionScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { collections, setArticleCollections, createCollection } = useLibrary();
  const [creating, setCreating] = useState(false);

  const current = collections.filter(c => c.articleIds.includes(id)).map(c => c.id);
  const toggle = (cid: string) =>
    setArticleCollections(id, current.includes(cid) ? current.filter(x => x !== cid) : [...current, cid]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => setCreating(true)} hitSlop={8} accessibilityRole="button" style={styles.side}>
          <Text style={[type.label, { color: colors.accent }]}>New</Text>
        </Pressable>
        <Text style={[type.headline, { color: colors.text }]}>Add to collection</Text>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" style={[styles.side, styles.sideEnd]}>
          <Text style={[type.label, { color: colors.accent }]}>Done</Text>
        </Pressable>
      </View>
      <FlatList
        data={collections}
        keyExtractor={c => c.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No collections yet"
            body="Create one to group related articles."
            actionLabel="New collection"
            onAction={() => setCreating(true)}
          />
        }
        renderItem={({ item }) => {
          const on = current.includes(item.id);
          return (
            <Pressable
              onPress={() => toggle(item.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={({ pressed }) => [styles.row, { borderBottomColor: colors.separator, opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[type.body, { color: colors.text, flex: 1 }]}>{item.name}</Text>
              {on && <Ionicons name="checkmark" size={20} color={colors.accent} />}
            </Pressable>
          );
        }}
      />
      <NamePrompt
        visible={creating}
        title="New collection"
        confirmLabel="Create"
        onCancel={() => setCreating(false)}
        onSubmit={name => {
          const c = createCollection(name);
          setArticleCollections(id, [...current, c.id]);
          setCreating(false);
        }}
      />
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
  list: { paddingHorizontal: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
