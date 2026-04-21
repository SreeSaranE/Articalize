import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

import CollectionScreen from '../screens/CollectionScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: '#222'
        },

        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#777',

        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'home';

          if (route.name === 'Dashboard') iconName = 'home';
          if (route.name === 'Collections') iconName = 'folder';
          if (route.name === 'Settings') iconName = 'settings';

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        }
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
      />

      <Tab.Screen
        name="Collections"
        component={CollectionScreen}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
      />
    </Tab.Navigator>
  );
}