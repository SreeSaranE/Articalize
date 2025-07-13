import React from 'react';
import { StatusBar } from 'react-native';
import Navigation from './Navigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <Navigation />
    </SafeAreaProvider>
  );
}
