import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme, spacing, radius, type } from '../../theme';
import { SectionLabel, SettingsPage } from './shared';
import { useLibrary } from '../../store/library';

// A whole number of days between 1 and 365, or null if the text isn't valid.
const parseDays = (text: string): number | null => {
  const n = Number(text.trim());
  return Number.isInteger(n) && n >= 1 && n <= 365 ? n : null;
};

export const DataSettings: React.FC = () => {
  const { colors } = useTheme();
  const { settings, saveSettings, deleteOlderThan, clearAll, exportJson, importJson } = useLibrary();
  const [days, setDays] = useState(String(settings.deleteOlderThanDays));
  const parsed = parseDays(days);

  const commitDays = () => {
    if (parsed !== null && parsed !== settings.deleteOlderThanDays) {
      saveSettings({ ...settings, deleteOlderThanDays: parsed });
    }
  };

  // Leaving the page may not blur the field, so save the draft on unmount too.
  const latest = useRef({ parsed, settings, saveSettings });
  useEffect(() => {
    latest.current = { parsed, settings, saveSettings };
  });
  useEffect(
    () => () => {
      const { parsed: p, settings: s, saveSettings: save } = latest.current;
      if (p !== null && p !== s.deleteOlderThanDays) save({ ...s, deleteOlderThanDays: p });
    },
    []
  );

  const confirmDeleteOlder = () => {
    if (parsed === null) {
      Alert.alert('Invalid number', 'Enter a whole number of days between 1 and 365.');
      return;
    }
    commitDays();
    Alert.alert(
      'Delete old articles',
      `Delete all articles saved more than ${parsed} day${parsed === 1 ? '' : 's'} ago? Bookmarked articles are kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const removed = deleteOlderThan(parsed);
            Alert.alert('Done', removed === 0 ? 'No articles were older than that.' : `Deleted ${removed} article${removed === 1 ? '' : 's'}.`);
          },
        },
      ]
    );
  };

  // Backups are files: sharing a multi-MB string through an Android intent would crash.
  const doExport = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Export unavailable', 'Sharing is not available on this device.');
        return;
      }
      const file = new File(Paths.cache, 'articalize-backup.json');
      if (file.exists) file.delete();
      file.create();
      file.write(await exportJson());
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Articalize backup' });
    } catch {
      Alert.alert('Export failed', 'Could not create the backup file.');
    }
  };

  const doImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const added = await importJson(await new File(result.assets[0].uri).text());
      Alert.alert('Imported', `Added ${added} article${added === 1 ? '' : 's'}.`);
    } catch (e) {
      Alert.alert(
        'Import failed',
        e instanceof Error && e.message.startsWith('This is not')
          ? e.message
          : 'Choose an Articalize backup file.'
      );
    }
  };

  const confirmClear = () =>
    Alert.alert('Clear library', 'This deletes all saved articles, summaries and collections. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: async () => {
          await clearAll();
          Alert.alert('Library cleared', 'Everything was removed from this device.');
        },
      },
    ]);

  const action = (label: string, onPress: () => void, color = colors.accent) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.5 : 1 }]}
    >
      <Text style={[type.label, { color }]}>{label}</Text>
    </Pressable>
  );

  return (
    <SettingsPage>
      <SectionLabel>Delete articles older than</SectionLabel>
      <View style={styles.row}>
        <TextInput
          style={[
            type.body,
            styles.input,
            { backgroundColor: colors.surface, color: parsed === null ? colors.danger : colors.text },
          ]}
          value={days}
          onChangeText={t => setDays(t.replace(/[^0-9]/g, ''))}
          onBlur={commitDays}
          keyboardType="number-pad"
          maxLength={3}
          accessibilityLabel="Delete articles older than, in days"
        />
        <Text style={[type.body, { color: colors.textSecondary }]}>days</Text>
      </View>
      <Text style={[type.caption, styles.hint, { color: colors.textSecondary }]}>
        Uses the date you saved each article. Bookmarked articles are never deleted.
      </Text>
      {action('Delete older articles now', confirmDeleteOlder, colors.danger)}

      <SectionLabel>Backup</SectionLabel>
      <Text style={[type.body, { color: colors.textSecondary }]}>
        Export saves your library as a file you can keep anywhere. Import merges a backup file into this library; existing items are kept.
      </Text>
      {action('Export library', doExport)}
      {action('Import from file', doImport)}

      <SectionLabel>Storage</SectionLabel>
      <Text style={[type.body, { color: colors.textSecondary }]}>
        Removes all articles, summaries and collections from this device.
      </Text>
      {action('Clear library', confirmClear, colors.danger)}
    </SettingsPage>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    width: 80,
    height: 44,
    paddingHorizontal: spacing.md,
    textAlign: 'center',
    borderRadius: radius.sm,
    borderCurve: 'continuous',
  },
  hint: { marginTop: spacing.sm },
  button: { paddingVertical: spacing.md },
});
