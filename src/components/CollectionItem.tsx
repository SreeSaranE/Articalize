import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Article, Collection } from '../types';
import { useTheme, spacing, radius, type } from '../theme';

interface Props {
  collection: Collection;
  cover?: Article; // first article with an image
  grid: boolean;
  onPress: (id: string) => void;
}

const CollectionItemBase: React.FC<Props> = ({ collection, cover, grid, onPress }) => {
  const { colors } = useTheme();
  const count = collection.articleIds.length;
  const countText = `${count} article${count === 1 ? '' : 's'}`;

  const thumb = (style: object) =>
    cover?.imageUrl ? (
      <Image source={{ uri: cover.imageUrl }} style={[style, { backgroundColor: colors.surface }]} contentFit="cover" cachePolicy="disk" />
    ) : (
      <View style={[style, styles.placeholder, { backgroundColor: colors.surface }]}>
        <Ionicons name="albums-outline" size={24} color={colors.textTertiary} />
      </View>
    );

  if (grid) {
    return (
      <Pressable
        onPress={() => onPress(collection.id)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.6 : 1 }]}
      >
        {thumb(styles.tileImage)}
        <Text style={[type.label, { color: colors.text }]} numberOfLines={1}>
          {collection.name}
        </Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>{countText}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => onPress(collection.id)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, { borderBottomColor: colors.separator, opacity: pressed ? 0.6 : 1 }]}
    >
      {thumb(styles.rowImage)}
      <View style={styles.rowText}>
        <Text style={[type.headline, { color: colors.text }]} numberOfLines={1}>
          {collection.name}
        </Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>{countText}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
};

export const CollectionItem = React.memo(CollectionItemBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowImage: { width: 56, height: 56, borderRadius: radius.sm, borderCurve: 'continuous' },
  rowText: { flex: 1, gap: 2 },
  tile: { flex: 1, gap: 2, marginBottom: spacing.md },
  tileImage: { width: '100%', aspectRatio: 1.4, borderRadius: radius.md, borderCurve: 'continuous', marginBottom: spacing.xs },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});
