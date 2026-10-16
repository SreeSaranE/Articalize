import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme, spacing, radius, type } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  initialValue?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onSubmit: (value: string) => void;
}

// Small centered dialog with a single text field (create / rename a collection).
export const NamePrompt: React.FC<Props> = ({
  visible,
  title,
  initialValue = '',
  confirmLabel = 'Save',
  onCancel,
  onSubmit,
}) => {
  const { colors } = useTheme();
  const [value, setValue] = useState(initialValue);
  const [wasVisible, setWasVisible] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setValue(initialValue);
  }
  const trimmed = value.trim();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: colors.background, borderColor: colors.separator }]}>
          <Text style={[type.headline, { color: colors.text }]}>{title}</Text>
          <TextInput
            style={[type.body, styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            value={value}
            onChangeText={setValue}
            placeholder="Name"
            placeholderTextColor={colors.textTertiary}
            autoFocus
            maxLength={60}
            returnKeyType="done"
            onSubmitEditing={() => trimmed && onSubmit(trimmed)}
          />
          <View style={styles.buttons}>
            <Pressable onPress={onCancel} hitSlop={8} accessibilityRole="button">
              <Text style={[type.label, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => trimmed && onSubmit(trimmed)}
              disabled={!trimmed}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={[type.label, { color: trimmed ? colors.accent : colors.textTertiary }]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    paddingTop: '40%', // sits above the keyboard
    paddingHorizontal: spacing.lg,
  },
  dialog: {
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { height: 44, paddingHorizontal: spacing.md, borderRadius: radius.sm, borderCurve: 'continuous' },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg },
});
