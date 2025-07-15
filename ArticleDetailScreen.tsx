import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ScrollView,
  useColorScheme,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Article } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';


type ArticleDetailProps = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

export default function ArticleDetailScreen({ route, navigation }: ArticleDetailProps) {
  const { article } = route.params;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const handleAddToCollection = () => {
    console.log(`Added ${article.title} to collection`);
    navigation.goBack();
  };

  const handleDelete = async () => {
    try {
      const stored = await AsyncStorage.getItem('articles');
      const articles: Article[] = stored ? JSON.parse(stored) : [];

      const updatedArticles = articles.filter(a => a.id !== article.id);

      await AsyncStorage.setItem('articles', JSON.stringify(updatedArticles));

      navigation.goBack();
      
    } catch (error) {
      console.log('Error deleting article:', error);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#111' : '#fff',
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>{article.title}</Text>
        <Text style={[styles.summary, { color: isDarkMode ? '#fff' : '#000' }]}>ID: {article.id}</Text>
        <Text style={[styles.summary, { color: isDarkMode ? '#fff' : '#000' }]}>Added On:{' '}
          {article.dateAdded ? format(new Date(article.dateAdded), 'dd-MM-yyyy h:mm a') : 'N/A'}
        </Text>

        <TouchableOpacity
          onPress={() => Linking.openURL(article.url)}
          style={[styles.linkButton, { backgroundColor: '#4F46E5' }]}
        >
          <Text style={styles.linkButtonText}>Open in Browser</Text>
        </TouchableOpacity>
      </ScrollView>

      <View
        style={[
          styles.bottomButtons,
          {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
            borderColor: isDarkMode ? '#333' : '#ddd',
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: isDarkMode ? '#333' : '#4F46E5' }]}
          onPress={() => navigation.navigate('AddToCollection', { article })}
        >
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>Add to Collection</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: isDarkMode ? '#333' : '#4F46E5' }]}
          onPress={handleDelete}
        >
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  summary: { fontSize: 16, marginBottom: 24 },
  linkButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  linkButtonText: { color: '#fff', fontWeight: '600' },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  actionButtonText: {
    fontWeight: '600' },
    addToCollectionButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    marginVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCollectionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
