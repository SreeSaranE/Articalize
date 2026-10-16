import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, type } from '../theme';

export interface TopBarAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
}

interface Props {
  title: string;
  subtitle?: string;
  actions?: TopBarAction[];
  onBack?: () => void;
}

// Always-visible bar: title (+ caption) on the left, icon actions on the right.
export const TopBar: React.FC<Props> = ({ title, subtitle, actions = [], onBack }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.bar}>
      {onBack && (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.accent} />
        </Pressable>
      )}
      <View style={[styles.title, !onBack && { paddingLeft: spacing.md }]}>
        <Text style={[type.headline, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actions.map(a => (
        <Pressable
          key={a.label}
          onPress={a.onPress}
          accessibilityRole="button"
          accessibilityLabel={a.label}
          accessibilityState={{ selected: !!a.active }}
          style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Ionicons name={a.icon} size={22} color={a.active ? colors.accent : colors.text} />
        </Pressable>
      ))}
      <View style={{ width: spacing.xs }} />
    </View>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', height: 52 },
  title: { flex: 1 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
