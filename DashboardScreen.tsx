import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useColorScheme,
  SafeAreaView,
  Keyboard,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchAndSummarize } from './fetchAndSummarize';
import { RootStackParamList, Article } from './types';
import { fetchPageTitle } from './fetchPageTitle';

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDarkMode = useColorScheme() === 'dark';

  const [articles, setArticles] = useState<Article[]>([]);
  const [linkInputValue, setLinkInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadArticles();
    AsyncStorage.removeItem('articles');
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadArticles();
    }, [])
  );

  const loadArticles = async () => {
    try {
      const stored = await AsyncStorage.getItem('articles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every(a => typeof a === 'object' && a !== null && 'title' in a)) {
          setArticles(parsed as Article[]);
        } else {
          console.warn('Invalid articles data found, clearing storage');
          await AsyncStorage.removeItem('articles');
          setArticles([]);
        }
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
    setIsProcessing(true);

    try {
      const url = linkInputValue.trim();

      // 🔹 Fetch actual page title
      const pageTitle = await fetchPageTitle(url);

      // 🔹 Get summary
      const summary = await fetchAndSummarize(url);

      const newArticle: Article = {
        id: Date.now().toString(),
        title: pageTitle || url, // fallback to URL if no title found
        url,
        dateAdded: new Date().toISOString(),
        content: '',
        excerpt: '',
        summary,
      };

      const updatedArticles = [newArticle, ...articles];
      setArticles(updatedArticles);
      await saveArticles(updatedArticles);

      setLinkInputValue('');
      setShowInput(false);
      Keyboard.dismiss();
    } catch (error) {
      console.log('Error adding article:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 🔹 Only title, no summary
  const renderArticle = ({ item }: { item: Article }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ArticleDetail', { article: item })}
      style={styles.articleRow}
    >
      <Text style={[styles.articleTitle, { color: isDarkMode ? '#fff' : '#000' }]}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#000' : '#fff',
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        },
      ]}
    >
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={renderArticle}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {showInput && (
        <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#111' : '#f9f9f9' }]}>
          <TextInput
            ref={inputRef}
            value={linkInputValue}
            onChangeText={setLinkInputValue}
            placeholder="Paste article link"
            placeholderTextColor={isDarkMode ? '#777' : '#888'}
            style={[styles.input, { color: isDarkMode ? '#fff' : '#000' }]}
            onSubmitEditing={handleAddLink}
            returnKeyType="done"
          />
        </View>
      )}

      <View style={styles.bottomBar}>
        <Text style={{ color: isDarkMode ? '#ccc' : '#333' }}>Articles: {articles.length}</Text>
        <TouchableOpacity onPress={() => setShowInput(!showInput)} style={styles.iconWrapper}>
          {isProcessing ? (
            <ActivityIndicator color={isDarkMode ? '#fff' : '#000'} />
          ) : (
            <Icon
              name={showInput ? 'close' : 'add-outline'}
              size={28}
              color={showInput ? '#e11d48' : '#2563eb'}
            />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  articleRow: { paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#444' },
  articleTitle: { fontSize: 16, fontWeight: '500' },
  inputWrapper: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  input: { height: 40, fontSize: 16 },
  bottomBar: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
  },
  iconWrapper: { padding: 6 },
});
