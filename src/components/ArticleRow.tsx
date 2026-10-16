import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Article } from '../types';
import { useTheme, spacing, radius, type } from '../theme';

// "5m ago", "3h ago", "Yesterday", "4d ago", then "Oct 14" for anything older.
export const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface Props {
  article: Article;
  onPress: (id: string) => void;
  selected?: boolean; // collection edit mode
  selecting?: boolean;
}

// A flat list row: no card, separated by a hairline.
const ArticleRowBase: React.FC<Props> = ({ article, onPress, selected, selecting }) => {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onPress(article.id)}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.separator, opacity: pressed ? 0.6 : article.isRead && !selecting ? 0.6 : 1 },
      ]}
    >
      {selecting && (
        <Ionicons
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={selected ? colors.accent : colors.textTertiary}
        />
      )}
      <View style={styles.text}>
        <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={1}>
          {article.source} · {formatDate(article.savedAt)} · {article.readMinutes} min
        </Text>
        <Text style={[type.headline, { color: colors.text }]} numberOfLines={3}>
          {article.title}
        </Text>
        {article.isBookmarked && (
          <Ionicons name="bookmark" size={14} color={colors.accent} style={{ marginTop: 2 }} />
        )}
      </View>
      {article.imageUrl ? (
        <Image
          source={{ uri: article.imageUrl }}
          style={[styles.thumb, { backgroundColor: colors.surface }]}
          contentFit="cover"
          cachePolicy="disk"
          recyclingKey={article.id}
        />
      ) : null}
    </Pressable>
  );
};

export const ArticleRow = React.memo(ArticleRowBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, gap: 4 },
  thumb: { width: 76, height: 76, borderRadius: radius.sm, borderCurve: 'continuous' },
});
