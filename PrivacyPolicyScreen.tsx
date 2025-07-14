import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';import { StatusBar, Platform } from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Privacy Policy</Text>
      <Text style={styles.content}>
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
