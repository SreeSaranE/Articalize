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
      Alert.alert('Saved', 'Article title updated.');
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
    Alert.alert('Delete Article', 'Are you sure you want to delete this article?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // 1. Remove from Articles
            const stored = await AsyncStorage.getItem('articles');
            const articles: Article[] = stored ? JSON.parse(stored) : [];
            const updatedArticles = articles.filter((a) => a.id !== article.id);
            await AsyncStorage.setItem('articles', JSON.stringify(updatedArticles));

            // 2. Remove from Collections
            const collectionsRaw = await AsyncStorage.getItem('collections');
            if (collectionsRaw) {
              const collections = JSON.parse(collectionsRaw);

              const updatedCollections = collections.map((collection: any) => ({
                ...collection,
                articles: collection.articles.filter((a: any) => {
                  // If articles are stored as IDs
                  if (typeof a === 'string') {
                    return a !== article.id;
                  }
                  // If articles are stored as full objects
                  return a.id !== article.id;
                }),
              }));

              await AsyncStorage.setItem('collections', JSON.stringify(updatedCollections));
            }

            navigation.goBack();
          } catch (error) {
            console.error('Error deleting article:', error);
          }
        },
      },
    ]);
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
        {/* Title */}
        <View style={styles.titleWrapper}>
          <TextInput
            style={[styles.titleInput, { color: isDarkMode ? '#fff' : '#000' }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Article Title"
            placeholderTextColor={isDarkMode ? '#555' : '#999'}
            multiline
            scrollEnabled={false}
            textAlignVertical="top"
          />
          {titleChanged && (
            <TouchableOpacity onPress={handleSaveMetadata} style={styles.saveButton}>
              <Ionicons name="checkmark" size={22} color="#4CAF50" />
            </TouchableOpacity>
          )}
        </View>

        {/* Divider (only one) */}
        <View style={[styles.divider, { borderBottomColor: isDarkMode ? '#333' : '#ddd' }]} />

        {/* Date */}
        <Text style={[styles.dateText, { color: isDarkMode ? '#888' : '#666' }]}>
          {article.dateAdded
            ? format(new Date(article.dateAdded), 'MMMM d, yyyy • h:mm a')
            : 'N/A'}
        </Text>

        {/* Summary */}
        <Text style={[styles.summaryText, { color: isDarkMode ? '#ccc' : '#333' }]}>
          {article.summary || 'No summary available'}
        </Text>
      </ScrollView>

      {/* Minimal Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: isDarkMode ? '#0A84FF20' : '#007AFF20' }]}
          onPress={() => Linking.openURL(article.url)}
        >
          <Ionicons name="open-outline" size={22} color={isDarkMode ? '#0A84FF' : '#007AFF'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: isDarkMode ? '#30D15820' : '#34C75920' }]}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={22} color={isDarkMode ? '#30D158' : '#34C759'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: isDarkMode ? '#FF9F0A20' : '#FF950020' }]}
          onPress={() => navigation.navigate('AddToCollection', { article })}
        >
          <Ionicons name="folder-outline" size={22} color={isDarkMode ? '#FF9F0A' : '#FF9500'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: isDarkMode ? '#FF453A20' : '#FF3B3020' }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={22} color={isDarkMode ? '#FF453A' : '#FF3B30'} />
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
    paddingBottom: 100,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 25,
  },
  saveButton: {
    marginLeft: 8,
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: 10,
  },
  dateText: {
    fontSize: 13,
    marginBottom: 14,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 22,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    gap: 12,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
