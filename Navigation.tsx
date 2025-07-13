import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';
import BottomTabsNavigation from './BottomTabsNavigation';
import ArticleDetailScreen from './ArticleDetailScreen';
import { RootStackParamList } from './types'; // Make sure this exists and is correct

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Home" component={BottomTabsNavigation} />
        <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
