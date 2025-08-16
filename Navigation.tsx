import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import BottomTabsNavigation from './BottomTabsNavigation';
import ArticleDetailScreen from './ArticleDetailScreen';
import { RootStackParamList } from './types';
import PrivacyPolicyScreen from './PrivacyPolicyScreen';
import AddToCollectionScreen from './AddToCollectionScreen';
import CollectionDetailScreen from './CollectionDetailScreen';
import NonArticleDomainsScreen from './NonArticleDomainsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  const colorScheme = useColorScheme();

  return (
    <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
          },
        }}
      >
        <Stack.Screen name="Home" component={BottomTabsNavigation} />
        <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="AddToCollection" component={AddToCollectionScreen} />
        <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} />
        <Stack.Screen name="NonArticleDomains" component={NonArticleDomainsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
//