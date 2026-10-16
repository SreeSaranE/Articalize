import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AVAILABLE_MODELS } from '../../types';
import { useTheme, spacing, radius, type } from '../../theme';
import { SectionLabel, SettingsPage } from './shared';
import { ApiUsage, UsageService } from '../../services/usage';
import { useLibrary } from '../../store/library';

export const ApiSettings: React.FC = () => {
  const { colors } = useTheme();
  const { settings, saveSettings } = useLibrary();
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [showKey, setShowKey] = useState(false);
  const [usage, setUsage] = useState<ApiUsage | null>(null);

  useEffect(() => {
    UsageService.get().then(u => setUsage({ ...u }));
  }, []);

  const commitKey = () => {
    const trimmed = apiKey.trim();
    if (trimmed !== settings.geminiApiKey) saveSettings({ ...settings, geminiApiKey: trimmed });
  };

  // Leaving the page (back button) may not blur the field, so save on unmount too.
  const latest = useRef({ apiKey, settings, saveSettings });
  useEffect(() => {
    latest.current = { apiKey, settings, saveSettings };
  });
  useEffect(
    () => () => {
      const { apiKey: key, settings: s, saveSettings: save } = latest.current;
      const trimmed = key.trim();
      if (trimmed !== s.geminiApiKey) save({ ...s, geminiApiKey: trimmed });
    },
    []
  );

  return (
    <SettingsPage>
      <SectionLabel>Gemini API key</SectionLabel>
      <View style={[styles.field, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[type.body, styles.input, { color: colors.text }]}
          placeholder="API key"
          placeholderTextColor={colors.textTertiary}
          value={apiKey}
          onChangeText={setApiKey}
          onBlur={commitKey}
          onSubmitEditing={commitKey}
          secureTextEntry={!showKey}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          onPress={() => setShowKey(!showKey)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={showKey ? 'Hide API key' : 'Show API key'}
        >
          <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
      <Text style={[type.caption, styles.hint, { color: colors.textSecondary }]}>
        Get a key from Google AI Studio. It is stored in your device keystore and only sent to Google.
      </Text>

      <SectionLabel>Model</SectionLabel>
      {AVAILABLE_MODELS.map(m => {
        const selected = settings.geminiModel === m.value;
        return (
          <Pressable
            key={m.value}
            onPress={() => saveSettings({ ...settings, geminiModel: m.value })}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.optionRow,
              { borderBottomColor: colors.separator, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[type.body, { color: colors.text, flex: 1 }]}>{m.label}</Text>
            {selected && <Ionicons name="checkmark" size={20} color={colors.accent} />}
          </Pressable>
        );
      })}

      <SectionLabel>Usage today</SectionLabel>
      <UsageRow label="Requests" value={(usage?.requests ?? 0).toLocaleString('en-US')} />
      <UsageRow label="Tokens" value={(usage?.tokens ?? 0).toLocaleString('en-US')} />
      <UsageRow label="Failed requests" value={(usage?.failed ?? 0).toLocaleString('en-US')} />
      <Text style={[type.caption, styles.hint, { color: colors.textSecondary }]}>
        Counted by this app on this device only, per calendar day.
      </Text>
    </SettingsPage>
  );
};

function UsageRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.optionRow, { borderBottomColor: colors.separator }]}>
      <Text style={[type.body, { color: colors.text, flex: 1 }]}>{label}</Text>
      <Text style={[type.body, { color: colors.textSecondary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { marginTop: spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
  },
  input: { flex: 1, paddingVertical: 0 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
