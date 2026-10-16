import React, { useCallback, useState } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLibrary } from '../../store/library';
import { TopBar } from '../../components/TopBar';
import { NavRow, SettingsPage } from '../../components/settings/shared';
import { ApiSettings } from '../../components/settings/ApiSettings';
import { DataSettings } from '../../components/settings/DataSettings';
import { AVAILABLE_MODELS } from '../../types';
import { useTheme } from '../../theme';

type Page = 'home' | 'api' | 'data';

const TITLES: Record<Page, string> = { home: 'Settings', api: 'API', data: 'Data' };

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { settings, articles, collections } = useLibrary();
  const [page, setPage] = useState<Page>('home');

  // Android back steps out of a sub-page instead of leaving the app.
  useFocusEffect(
    useCallback(() => {
      if (page === 'home') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setPage('home');
        return true;
      });
      return () => sub.remove();
    }, [page])
  );

  const modelLabel = AVAILABLE_MODELS.find(m => m.value === settings.geminiModel)?.label ?? settings.geminiModel;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <TopBar title={TITLES[page]} onBack={page === 'home' ? undefined : () => setPage('home')} />
      {page === 'home' && (
        <SettingsPage>
          <NavRow
            icon="key-outline"
            title="API"
            subtitle={settings.geminiApiKey ? modelLabel : 'Gemini API key not set'}
            onPress={() => setPage('api')}
          />
          <NavRow
            icon="trash-outline"
            title="Data"
            subtitle={`${articles.length} article${articles.length === 1 ? '' : 's'} · ${collections.length} collection${collections.length === 1 ? '' : 's'}`}
            onPress={() => setPage('data')}
          />
        </SettingsPage>
      )}
      {page === 'api' && <ApiSettings />}
      {page === 'data' && <DataSettings />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
