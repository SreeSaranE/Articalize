import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  useColorScheme,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const navigation = useNavigation<NavigationProp>();

  const [username, setUsername] = useState('USER0');
  const [originalUsername, setOriginalUsername] = useState('USER0');

  useEffect(() => {
    const loadData = async () => {
      const storedName = await AsyncStorage.getItem('username');
      if (storedName) {
        setUsername(storedName);
        setOriginalUsername(storedName);
      }
    };
    loadData();
  }, []);

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('username', username);
      setOriginalUsername(username);
      Alert.alert('Profile updated');
    } catch (e) {
      console.error('Save error:', e);
      Alert.alert('Error saving profile');
    }
  };

  const handleExportData = async () => {
    try {
      const storedArticles = await AsyncStorage.getItem('articles');
      const storedCollections = await AsyncStorage.getItem('collections');

      const data = {
        username,
        articles: storedArticles ? JSON.parse(storedArticles) : [],
        collections: storedCollections ? JSON.parse(storedCollections) : [],
      };

      const json = JSON.stringify(data, null, 2);
      const fileUri = FileSystem.documentDirectory + 'data-export.json';
      await FileSystem.writeAsStringAsync(fileUri, json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Failed to export data');
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.assets?.[0]?.uri) {
        const json = await FileSystem.readAsStringAsync(result.assets[0].uri);
        const data = JSON.parse(json);

        if (data.username) {
          await AsyncStorage.setItem('username', data.username);
          setUsername(data.username);
          setOriginalUsername(data.username);
        }
        if (data.articles) {
          await AsyncStorage.setItem('articles', JSON.stringify(data.articles));
        }
        if (data.collections) {
          await AsyncStorage.setItem('collections', JSON.stringify(data.collections));
        }

        Alert.alert('Data imported successfully!');
      }
    } catch (error) {
      console.error('Import failed:', error);
      Alert.alert('Failed to import data');
    }
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#000' : '#fff',
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        },
      ]}
    >
      <View style={styles.profileContainer}>
        <TextInput
          value={username}
          onChangeText={setUsername}
          style={[
            styles.usernameInput,
            {
              color: isDarkMode ? '#fff' : '#000',
              borderColor: isDarkMode ? '#555' : '#ccc',
            },
          ]}
        />

        {username !== originalUsername && (
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, { backgroundColor: isDarkMode ? '#333' : '#4F46E5' }]}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
        <Text style={[styles.settingText, { color: isDarkMode ? '#ccc' : '#333' }]}>Export Data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={handleImportData}>
        <Text style={[styles.settingText, { color: isDarkMode ? '#ccc' : '#333' }]}>Import Data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}
        onPress={() => navigation.navigate('NonArticleDomains')}>
        <Text style={[styles.settingText, { color: isDarkMode ? '#ccc' : '#333' }]}>Non-Article Domains</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
        <Text style={[styles.settingText, { color: isDarkMode ? '#ccc' : '#333' }]}>Privacy Policy</Text>
      </TouchableOpacity>

      <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
        <Text style={[styles.settingText, { color: isDarkMode ? '#777' : '#666' }]}>Version 1.0.2</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  usernameInput: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    borderBottomWidth: 1,
    width: '70%',
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  settingItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  settingText: {
    fontSize: 16,
  },
});
