import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import Navigation from './Navigation';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <Navigation />
    </SafeAreaView>
  );
}
