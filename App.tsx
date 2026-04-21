import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}