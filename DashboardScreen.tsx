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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchAndSummarize } from './fetchAndSummarize';
import { RootStackParamList, Article } from './types';

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
      const summary = await fetchAndSummarize(url);

// You might want to fetch title, content, excerpt differently, or set defaults
      const newArticle: Article = {
        id: Date.now().toString(),
        title: url,         // or extract title separately if possible
        url,
        dateAdded: new Date().toISOString(),
        content: '',        // placeholder or fetch separately
        excerpt: '',        // placeholder or fetch separately
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

  const renderArticle = ({ item }: { item: Article }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ArticleDetail', { article: item })}
      style={styles.articleRow}
    >
      <Text style={[styles.articleTitle, { color: isDarkMode ? '#fff' : '#000' }]}>{item.title}</Text>
      <Text style={[styles.articleSummary, { color: isDarkMode ? '#aaa' : '#555' }]} numberOfLines={2}>
        {item.summary}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
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
  articleSummary: { fontSize: 14, marginTop: 4 },
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
    bottom: 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrapper: { padding: 6 },
});