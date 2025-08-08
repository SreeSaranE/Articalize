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
import { Ionicons } from '@expo/vector-icons';

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
        a.id === article.id ? { ...a, title: title.trim() } : a
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
    Alert.alert(
      'Delete Article',
      'Are you sure you want to delete this article?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const stored = await AsyncStorage.getItem('articles');
              const articles: Article[] = stored ? JSON.parse(stored) : [];

              const updatedArticles = articles.filter(a => a.id !== article.id);
              await AsyncStorage.setItem('articles', JSON.stringify(updatedArticles));

              const collectionsRaw = await AsyncStorage.getItem('collections');
              if (collectionsRaw) {
                const collections = JSON.parse(collectionsRaw);
                const updatedCollections = collections.map((collection: any) => ({
                  ...collection,
                  articles: collection.articles.filter((a: any) => 
                    updatedArticles.some(updated => updated.id === a.id)
                  ),
                }));
                await AsyncStorage.setItem('collections', JSON.stringify(updatedCollections));
              }

              navigation.goBack();
            } catch (error) {
              console.error('Error deleting article:', error);
            }
          },
        },
      ]
    );
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
        {/* Article Title */}
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
            <TouchableOpacity onPress={handleSaveMetadata} style={styles.saveButton}>
              <Ionicons name="checkmark" size={24} color="#4CAF50" />
            </TouchableOpacity>
          )}
        </View>

        {/* Article Metadata */}
        <Text style={[styles.dateText, { color: isDarkMode ? '#aaa' : '#666' }]}>
          {article.dateAdded ? format(new Date(article.dateAdded), 'MMMM d, yyyy • h:mm a') : 'N/A'}
        </Text>
      </ScrollView>

      {/* Action Buttons Bar */}
      <View style={[styles.actionBar, { backgroundColor: isDarkMode ? '#1C1C1E' : '#F5F5F5' }]}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Linking.openURL(article.url)}
        >
          <Ionicons name="open-outline" size={24} color={isDarkMode ? '#0A84FF' : '#007AFF'} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color={isDarkMode ? '#30D158' : '#34C759'} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddToCollection', { article })}
        >
          <Ionicons name="folder-outline" size={24} color={isDarkMode ? '#FF9F0A' : '#FF9500'} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={24} color={isDarkMode ? '#FF453A' : '#FF3B30'} />
        </TouchableOpacity>
      </View>
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
    paddingBottom: 80, // Space for action bar
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    minHeight: 60,
    paddingRight: 12,
  },
  saveButton: {
    padding: 6,
    marginLeft: 8,
  },
  dateText: {
    fontSize: 14,
    marginBottom: 20,
  },
  actionBar: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  actionLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});