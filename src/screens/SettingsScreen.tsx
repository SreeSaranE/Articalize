import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity
} from 'react-native';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <TouchableOpacity style={styles.item}>
        <Text style={styles.text}>Export Backup</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item}>
        <Text style={styles.text}>Import Backup</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item}>
        <Text style={styles.text}>Privacy Policy</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Articalize v2.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    padding: 20
  },
  header: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 20
  },
  item: {
    backgroundColor: '#1a1a1a',
    padding: 18,
    borderRadius: 14,
    marginBottom: 12
  },
  text: {
    color: '#fff',
    fontSize: 16
  },
  version: {
    color: '#666',
    marginTop: 20
  }
});