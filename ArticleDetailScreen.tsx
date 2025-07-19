import React, { useState, useEffect } from 'react';
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
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Article } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons'; // Tick icon

type ArticleDetailProps = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

export default function ArticleDetailScreen({ route, navigation }: ArticleDetailProps) {
  const { article } = route.params;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [title, setTitle] = useState(article.title);

  useEffect(() => {
    cleanUpArticles();
  }, []);

  const handleSaveMetadata = async () => {
    try {
      const stored = await AsyncStorage.getItem('articles');
      const articles: Article[] = stored ? JSON.parse(stored) : [];

      const updatedArticles = articles.map((a) =>
        a.id === article.id
          ? { ...a, title: title.trim() }
          : a
      );

      await AsyncStorage.setItem('articles', JSON.stringify(updatedArticles));
      Alert.alert('Saved', 'Article metadata updated.');
    } catch (error) {
      console.error('Error saving metadata:', error);
    }
  };

  const cleanUpArticles = async () => {
    const stored = await AsyncStorage.getItem('articles');
    if (stored) {
      const articles = JSON.parse(stored).map((article: any) => ({
        ...article,
        tags: Array.isArray(article.tags)
          ? article.tags
          : typeof article.tags === 'string'
          ? article.tags.split(',').map((tag: string) => tag.trim())
          : [],
      }));
      await AsyncStorage.setItem('articles', JSON.stringify(articles));
    }
  };

  const handleDelete = async () => {
    try {
      const stored = await AsyncStorage.getItem('articles');
      const articles: Article[] = stored ? JSON.parse(stored) : [];

      const updatedArticles = articles.filter(a => a.id !== article.id);
      await AsyncStorage.setItem('articles', JSON.stringify(updatedArticles));

      const collectionsRaw = await AsyncStorage.getItem('collections');
      if (collectionsRaw) {
        const collections = JSON.parse(collectionsRaw);

        const updatedCollections = collections.map((collection: any) => {
          const cleanedArticles = collection.articles.filter((a: any) => {
            return updatedArticles.some(updated => updated.id === a.id);
          });

          return {
            ...collection,
            articles: cleanedArticles,
          };
        });

        await AsyncStorage.setItem('collections', JSON.stringify(updatedCollections));
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${title}\n\n${article.url}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const titleChanged = title.trim() !== article.title.trim();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <TextInput
            style={[
              styles.titleInput,
              {
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? '#555' : '#ccc',
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Article Title"
            placeholderTextColor={isDarkMode ? '#555' : '#999'}
            multiline
            textAlignVertical="top"
          />
          {titleChanged && (
            <TouchableOpacity onPress={handleSaveMetadata} style={styles.tickButton}>
              <Ionicons name="checkmark" size={24} color="#4CAF50" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.metaText, { color: isDarkMode ? '#aaa' : '#555' }]}>
          ID: {article.id}
        </Text>

        <Text style={[styles.metaText, { color: isDarkMode ? '#aaa' : '#555' }]}>
          Added On: {article.dateAdded ? format(new Date(article.dateAdded), 'dd-MM-yyyy h:mm a') : 'N/A'}
        </Text>

        <TouchableOpacity onPress={() => Linking.openURL(article.url)}>
          <Text style={[styles.actionText, { color: '#4F46E5' }]}>Open in Browser</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare}>
          <Text style={[styles.actionText, { color: '#2196F3' }]}>Share Article</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('AddToCollection', { article })}>
          <Text style={[styles.actionText, { color: '#FF9800' }]}>Add to Collection</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDelete}>
          <Text style={[styles.actionText, { color: '#E53935' }]}>Delete</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    minHeight: 60,
    paddingRight: 12,
  },
  tickButton: {
    padding: 6,
  },
  metaText: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 10,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 12,
  },
});
