import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import ArticleDetailScreen from '../screens/ArticleDetailScreen';
import CollectionDetailScreen from '../screens/CollectionDetailScreen';
import TabsNavigator from './TabsNavigator';

export type RootStackParamList = {
  MainTabs: undefined;
  ArticleDetail: { articleId: string };
  CollectionDetail: { collectionId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f0f0f'
        },
        headerTintColor: '#fff',
        contentStyle: {
          backgroundColor: '#0f0f0f'
        }
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={TabsNavigator}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ArticleDetail"
        component={ArticleDetailScreen}
        options={{ title: 'Article' }}
      />

      <Stack.Screen
        name="CollectionDetail"
        component={CollectionDetailScreen}
        options={{ title: 'Collection' }}
      />
    </Stack.Navigator>
  );
}