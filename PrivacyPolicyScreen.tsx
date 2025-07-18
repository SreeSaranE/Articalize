import React from 'react';
import { ScrollView, Text, StyleSheet, useColorScheme, Platform, StatusBar } from 'react-native';

export default function PrivacyPolicyScreen() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: isDarkMode ? '#000' : '#fff' },
      ]}
    >
      <Text
        style={[
          styles.heading,
          { color: isDarkMode ? '#fff' : '#000' },
        ]}
      >
        Privacy Policy
      </Text>
      <Text
        style={[
          styles.content,
          { color: isDarkMode ? '#ccc' : '#333' },
        ]}
      >
        {/* Replace this with your actual privacy policy text */}
        This is where your privacy policy goes...
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    flexGrow: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
  },
});
