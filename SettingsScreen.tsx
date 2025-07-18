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
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const navigation = useNavigation<NavigationProp>();

  const [username, setUsername] = useState('USER0');
  const [profileUri, setProfileUri] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const storedName = await AsyncStorage.getItem('username');
      const storedUri = await AsyncStorage.getItem('profileUri');
      if (storedName) setUsername(storedName);
      if (storedUri) setProfileUri(storedUri);
    };
    loadData();
  }, []);

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('username', username);
      if (profileUri) await AsyncStorage.setItem('profileUri', profileUri);
      setIsEditing(false);
      Alert.alert('Profile updated');
    } catch (e) {
      console.error('Save error:', e);
      Alert.alert('Error saving profile');
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required to access photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setProfileUri(result.assets[0].uri);
      setIsEditing(true);
    }
  };

  const handleExportData = async () => {
    try {
      const data = {
        username,
        profileUri,
        articles: [],
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
      <Text style={[styles.headerText, { color: isDarkMode ? '#fff' : '#000' }]}>
        Settings
      </Text>

      <View style={styles.profileContainer}>
        <TouchableOpacity onPress={handlePickImage}>
          <Image
            source={
              profileUri ? { uri: profileUri } : require('./assets/icon.png')
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>

        {isEditing ? (
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
        ) : (
          <Text style={[styles.username, { color: isDarkMode ? '#fff' : '#000' }]}>
            {username}
          </Text>
        )}

        {isEditing ? (
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.editButton, { backgroundColor: isDarkMode ? '#333' : '#4F46E5' }]}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            style={[styles.editButton, { backgroundColor: isDarkMode ? '#333' : '#4F46E5' }]}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
        <Text style={[styles.settingText, { color: isDarkMode ? '#ccc' : '#333' }]}>
          Export Data
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
        <Text style={[styles.settingText, { color: isDarkMode ? '#ccc' : '#333' }]}>
          Privacy Policy
        </Text>
      </TouchableOpacity>

      <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
        <Text style={[styles.settingText, { color: isDarkMode ? '#777' : '#666' }]}>
          Version 2.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  usernameInput: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    borderBottomWidth: 1,
    width: '60%',
    textAlign: 'center',
  },
  editButton: {
    paddingVertical: 10,
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
