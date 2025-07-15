import React from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types'
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const navigation = useNavigation<NavigationProp>();


  const handleExportData = async () => {
      try {
        const data = {
          username: 'SREESARAN E',
          articles: [], // Add real app data here
        };

        const json = JSON.stringify(data, null, 2);

        const fileUri = FileSystem.documentDirectory + 'data-export.json';
        await FileSystem.writeAsStringAsync(fileUri, json);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          alert('Sharing is not available on this device');
        }
      } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export data');
      }
    };

  const handleSignOut = () => {
    navigation.replace('Login');
  };

  const handlePrivacyPolicy = () => {
  navigation.navigate('PrivacyPolicy');
  };

  return (
    <SafeAreaView
        style={[
          styles.container,
          { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
        ]}
      >
        <Text style={[styles.headerText, { color: isDarkMode ? '#fff' : '#000' }]}>Settings</Text>

        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <Image
            source={require('./assets/dp.jpg')}
            style={styles.profileImage}
          />
          <Text style={[styles.username, { color: isDarkMode ? '#fff' : '#000' }]}>
            SREESARAN E
          </Text>
        </View>

        <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
          <Text style={[styles.settingText, { color: isDarkMode ? '#ccc' : '#333' }]}>
            Export Data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
          <Text style={[styles.settingText, { color: isDarkMode ? '#ccc' : '#333' }]}>
            Sign Out
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
          <Text style={[styles.settingText, { color: isDarkMode ? '#ccc' : '#333' }]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>

        <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
          <Text style={[styles.settingText, { color: isDarkMode ? '#777' : '#666' }]}>
            Version 1.0.0
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
