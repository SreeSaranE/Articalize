import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useColorScheme,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { sampleArticles } from './articles';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Article } from './types';
import { fetchPageTitle} from './fetchPageTitle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDarkMode = useColorScheme() === 'dark';

  const [articles, setArticles] = useState<Article[]>(sampleArticles);
  const [linkInputValue, setLinkInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadArticles();
      cleanUpCollections();
    }, [])
  );

  const loadArticles = async () => {
    try {
      const stored = await AsyncStorage.getItem('articles');
      if (stored) {
        setArticles(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Failed to load articles', error);
    }
  };

  const saveArticles = async (updatedArticles: Article[]) => {
    try {
      await AsyncStorage.setItem('articles', JSON.stringify(updatedArticles));
    } catch (error) {
      console.log('Failed to save articles', error);
    }
  };

  const cleanUpCollections = async () => {
    try {
      const storedArticles = await AsyncStorage.getItem('articles');
      const articles: Article[] = storedArticles ? JSON.parse(storedArticles) : [];

      const storedCollections = await AsyncStorage.getItem('collections');
      if (storedCollections) {
        const collections = JSON.parse(storedCollections);

        const updatedCollections = collections.map((collection: any) => {
          const cleanedArticles = collection.articles.filter((a: any) =>
            articles.some(existing => existing.id === a.id)
          );

          return {
            ...collection,
            articles: cleanedArticles,
          };
        });

        await AsyncStorage.setItem('collections', JSON.stringify(updatedCollections));
        console.log('Collections cleaned up successfully.');
      }
    } catch (error) {
      console.error('Error cleaning collections:', error);
    }
  };

  const handleAddLink = async () => {
    if (!linkInputValue.trim()) return;

    try {
      const url = linkInputValue.trim();
      const pageTitle = await fetchPageTitle(url);

      const newArticle: Article = {
        id: Date.now().toString(),
        title: (pageTitle || 'Untitled Article').split(' ').slice(0, 10).join(' '),
        url: url,
        dateAdded: new Date().toISOString(),
      };

      const updatedArticles = [...articles, newArticle];
      setArticles(updatedArticles);
      await saveArticles(updatedArticles);

      setLinkInputValue('');
      setShowInput(false);
    } catch (error) {
      console.log('Error adding article:', error);
    }
  };


  const handlePress = (item: Article) => {
    navigation.navigate('ArticleDetail', { article: item });
  };

  const renderArticle = ({ item }: { item: Article }) => (
    <TouchableOpacity onPress={() => handlePress(item)} style={styles.articleRow}>
      <Text style={[styles.articleTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#fff' }}>
      <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Dashboard</Text>
        <Text style={{ color: isDarkMode ? '#ccc' : '#333' }}>{articles.length} Articles Saved</Text>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: isDarkMode ? '#333' : '#4F46E5' }]}
            onPress={() => setShowInput(!showInput)}
          >
            <Text style={{ color:'#fff'}}>Add Link</Text>
          </TouchableOpacity>
        </View>

        {showInput && (
          <View style={{ marginTop: 10 }}>
            <TextInput
              value={linkInputValue}
              onChangeText={setLinkInputValue}
              placeholder="Paste link here"
              placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
              style={[styles.input, { color: isDarkMode ? '#fff' : '#000' }]}
            />
            <TouchableOpacity
              style={[styles.headerButton, { marginTop: 10, backgroundColor: isDarkMode ? '#333' : '#ddd' }]}
              onPress={handleAddLink}
            >
              <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Save Link</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={articles}
          keyExtractor={(item) => item.id}
          renderItem={renderArticle}
          contentContainerStyle={{ paddingVertical: 10 }}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: isDarkMode ? '#333' : '#ddd' }} />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  headerButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
  },
  articleRow: {
    paddingVertical: 14,
  },
  articleTitle: {
    fontSize: 17,
  },
});
