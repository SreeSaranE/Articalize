import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, spacing, radius, type } from '../theme';

interface Props {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<Props> = ({ title, body, actionLabel, onAction }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[type.headline, { color: colors.text }]}>{title}</Text>
      <Text style={[type.body, styles.body, { color: colors.textSecondary }]}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.accent, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[type.label, { color: colors.onAccent }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl * 2,
    gap: spacing.sm,
  },
  body: { textAlign: 'center', maxWidth: 280, marginBottom: spacing.md },
  button: {
    paddingHorizontal: spacing.lg,
    height: 44,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderCurve: 'continuous',
  },
});
