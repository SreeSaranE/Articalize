import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import Navigation from './Navigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Ignore noisy xmldom parse errors
LogBox.ignoreLogs([
  '[xmldom error]',  // catch all xmldom errors
  'attribute invalid close char' // specifically this one
]);

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <Navigation />
    </SafeAreaProvider>
  );
}
