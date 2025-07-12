import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import DashboardScreen from './DashboardScreen';
import CollectionScreen from './CollectionScreen';
import SettingsScreen from './SettingsScreen';
import { useColorScheme } from 'react-native';

const Tab = createBottomTabNavigator();

export default function BottomTabsNavigation() {
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap = 'dashboard';

          if (route.name === 'Dashboard') iconName = 'dashboard';
          if (route.name === 'Collection') iconName = 'collections-bookmark';
          if (route.name === 'Settings') iconName = 'settings';

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colorScheme === 'dark' ? '#ffffff' : '#4F46E5',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff',
          borderTopWidth: 0,
          elevation: 10,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Collection" component={CollectionScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
