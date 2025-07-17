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

type ArticleDetailProps = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

export default function ArticleDetailScreen({ route, navigation }: ArticleDetailProps) {
  const { article } = route.params;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [title, setTitle] = useState(article.title);
  const [tags, setTags] = useState(Array.isArray(article.tags) ? article.tags.join(", ") : "");
  const [readingTime, setReadingTime] = useState(0);

  useEffect(() => {
    console.log('Loaded article:', article);
    estimateReadingTime(article.content || '');

    const runCleanup = async () => {
      await cleanUpArticles();
    };

    runCleanup();
  }, [article.content]);

  
  const estimateReadingTime = (content: string) => {
    if (!content) {
      setReadingTime(0);
      return;
    }
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    setReadingTime(Math.ceil(words / wordsPerMinute));
  };


  const handleSaveMetadata = async () => {
    try {
      const stored = await AsyncStorage.getItem('articles');
      const articles: Article[] = stored ? JSON.parse(stored) : [];

      const updatedArticles = articles.map((a) =>
        a.id === article.id
          ? {
              ...a,
              title: title.trim(),
              tags: tags
                ? tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
                : [],
            }
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
      console.log('Articles cleaned up.');
    }
  };

  const handleDelete = async () => {
    try {
      const stored = await AsyncStorage.getItem('articles');
      const articles: Article[] = stored ? JSON.parse(stored) : [];
      const updatedArticles = articles.filter(a => a.id !== article.id);
      await AsyncStorage.setItem('articles', JSON.stringify(updatedArticles));
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

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDarkMode ? '#000' : '#fff' },
      ]}
    >
      <ScrollView contentContainerStyle={[styles.content, { flexGrow: 1 }]}>
        <TextInput
          style={[
            styles.titleInput,
            { color: isDarkMode ? '#fff' : '#000', borderColor: isDarkMode ? '#555' : '#ccc' },
          ]}
          value={title}
          onChangeText={setTitle}
          placeholder="Article Title"
          placeholderTextColor={isDarkMode ? '#555' : '#999'}
        />

        <Text style={[styles.metaText, { color: isDarkMode ? '#aaa' : '#555' }]}>
          ID: {article.id}
        </Text>

        <Text style={[styles.metaText, { color: isDarkMode ? '#aaa' : '#555' }]}>
          Added On: {article.dateAdded ? format(new Date(article.dateAdded), 'dd-MM-yyyy h:mm a') : 'N/A'}
        </Text>

        <Text style={[styles.metaText, { color: isDarkMode ? '#aaa' : '#555' }]}>
          Reading Time: {article.content ? (readingTime > 0 ? `${readingTime} min` : 'Less than 1 min') : 'Content missing'}
        </Text>


        <TextInput
          style={[
            styles.tagInput,
            { color: isDarkMode ? '#fff' : '#000', borderColor: isDarkMode ? '#555' : '#ccc' },
          ]}
          value={tags}
          onChangeText={setTags}
          placeholder="Tags (comma separated)"
          placeholderTextColor={isDarkMode ? '#555' : '#999'}
        />

        <TouchableOpacity
          onPress={() => Linking.openURL(article.url)}
          style={[styles.button, { backgroundColor: isDarkMode ? '#333' : '#4F46E5' }]}
        >
          <Text style={styles.buttonText}>Open in Browser</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSaveMetadata}
          style={[styles.button, { backgroundColor: isDarkMode ? '#555' : '#4CAF50' }]}
        >
          <Text style={styles.buttonText}>Save Metadata</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShare}
          style={[styles.button, { backgroundColor: isDarkMode ? '#333' : '#2196F3' }]}
        >
          <Text style={styles.buttonText}>Share Article</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
        <TouchableOpacity
          style={[styles.footerButton, { backgroundColor: isDarkMode ? '#333' : '#4F46E5' }]}
          onPress={() => navigation.navigate('AddToCollection', { article })}
        >
          <Text style={styles.footerButtonText}>Add to Collection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerButton, { backgroundColor: '#E53935' }]}
          onPress={handleDelete}
        >
          <Text style={styles.footerButtonText}>Delete</Text>
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
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  metaText: {
    fontSize: 14,
    marginBottom: 8,
  },
  tagInput: {
    fontSize: 16,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    marginHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
