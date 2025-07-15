import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { sampleArticles } from './articles';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Article } from './types';
import { fetchPageTitle } from './fetchPageTitle';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [articles, setArticles] = useState<Article[]>(sampleArticles);
  const [linkInputValue, setLinkInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [gridView, setGridView] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const handlePress = (item: Article) => {
    navigation.navigate('ArticleDetail', { article: item });
  };

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

  const handleAddLink = async () => {
    if (!linkInputValue.trim()) return;

    try {
      const pageTitle = await fetchPageTitle(linkInputValue.trim());

      const newArticle: Article = {
        id: Date.now().toString(),
        title: pageTitle || 'Untitled Article',
        url: linkInputValue.trim(),
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

  const renderItem = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={[
        styles.articleItem,
        gridView && styles.articleGridItem,
        { backgroundColor: isDarkMode ? '#222' : '#fff' },
      ]}
      onPress={() => handlePress(item)}
    >
      <Text style={[styles.articleTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#111' : '#f0f0f0' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          Dashboard
        </Text>
        <Text style={{ color: isDarkMode ? '#ccc' : '#333' }}>
          {articles.length} Articles Saved
        </Text>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: isDarkMode ? '#333' : '#ddd' }]}
            onPress={() => setGridView(!gridView)}
          >
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
              {gridView ? 'List View' : 'Grid View'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: isDarkMode ? '#333' : '#ddd' }]}
            onPress={() => setShowInput(!showInput)}
          >
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
              Add
            </Text>
          </TouchableOpacity>
        </View>

        {showInput && (
          <View style={{ marginTop: 10 }}>
            <TextInput
              value={linkInputValue}
              onChangeText={setLinkInputValue}
              placeholder="Paste link here"
              placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
              style={[
                {
                  borderColor: isDarkMode ? '#444' : '#ccc',
                  borderWidth: 1,
                  padding: 10,
                  borderRadius: 8,
                  color: isDarkMode ? '#fff' : '#000',
                },
              ]}
            />
            <TouchableOpacity
              style={[
                styles.headerButton,
                {
                  marginTop: 10,
                  backgroundColor: isDarkMode ? '#333' : '#ddd',
                },
              ]}
              onPress={handleAddLink}
            >
              <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
                Save Link
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={articles}
        key={gridView ? 'g' : 'l'}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={gridView ? 2 : 1}
        contentContainerStyle={{ padding: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    marginTop: 10,
  },
  headerButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  articleItem: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  articleGridItem: {
    marginHorizontal: 5,
    flexBasis: '48%',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  articleSummary: {
    marginTop: 6,
    fontSize: 14,
  },
});
