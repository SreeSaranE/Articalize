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
  KeyboardAvoidingView,
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
      const pageTitle = await fetchPageTitle(url);
      const summary = await fetchAndSummarize(url);

      const newArticle: Article = {
        id: Date.now().toString(),
        title: pageTitle || url,
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

  const renderArticle = ({ item }: { item: Article }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ArticleDetail', { article: item })}
      style={styles.articleRow}
    >
      <Text style={[styles.articleTitle, { color: isDarkMode ? '#fff' : '#000' }]}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
  >
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#000' : '#fff',
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        },
      ]}
    >
      {/* Article List */}
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={renderArticle}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Floating Input (separate from bottom bar) */}
      {showInput && (
        <View style={[styles.floatingInputBar, { backgroundColor: isDarkMode ? '#111' : '#f9f9f9' }]}>
          <TextInput
            ref={inputRef}
            value={linkInputValue}
            onChangeText={setLinkInputValue}
            placeholder="Paste article link"
            placeholderTextColor={isDarkMode ? '#777' : '#888'}
            style={[styles.floatingInput, { color: isDarkMode ? '#fff' : '#000' }]}
            onSubmitEditing={handleAddLink}
            returnKeyType="done"
            autoFocus
          />
          <TouchableOpacity onPress={handleAddLink} style={styles.sendButton}>
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Icon name="checkmark" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Bar (always visible) */}
      <View style={styles.bottomBar}>
        <Text style={{ fontSize: 15, color: isDarkMode ? '#ccc' : '#333', fontWeight: '600' }}>
          Articles: {articles.length}
        </Text>
        <TouchableOpacity onPress={() => setShowInput(!showInput)} style={styles.iconWrapper}>
          {isProcessing && !showInput ? (
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
  </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  articleRow: { paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#444' },
  articleTitle: { fontSize: 17, fontWeight: '500' },

  floatingInputContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
  },
  floatingInputBar: {
    position: 'absolute',
    bottom: 60, // stays above bottom bar
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  floatingInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    paddingHorizontal: 8,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#2563eb',
    borderRadius: 6,
    padding: 8,
  },

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
  },
  iconWrapper: { padding: 6 },
});
