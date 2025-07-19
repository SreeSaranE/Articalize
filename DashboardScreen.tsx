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
  Platform,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import { sampleArticles } from './articles';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Article } from './types';
import { fetchPageTitle } from './fetchPageTitle';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDarkMode = useColorScheme() === 'dark';

  const [articles, setArticles] = useState<Article[]>(sampleArticles);
  const [linkInputValue, setLinkInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);

  const inputRef = useRef<TextInput>(null);

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
      Keyboard.dismiss();
    } catch (error) {
      console.log('Error adding article:', error);
    }
  };

  const handleToggleInput = () => {
    if (showInput) {
      setShowInput(false);
      setLinkInputValue('');
      Keyboard.dismiss();
    } else {
      setShowInput(true);
      setTimeout(() => inputRef.current?.focus(), 100);
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#fff' }}>
          <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
            <FlatList
              data={articles}
              keyExtractor={(item) => item.id}
              renderItem={renderArticle}
              contentContainerStyle={{ paddingBottom: 100 }}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: isDarkMode ? '#333' : '#ddd' }} />
              )}
            />
          </View>

          {/* Input Field Above Bottom Bar */}
          {showInput && (
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
              <TextInput
                ref={inputRef}
                value={linkInputValue}
                onChangeText={setLinkInputValue}
                placeholder="Paste link here"
                placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
                style={[styles.input, { color: isDarkMode ? '#fff' : '#000' }]}
                onSubmitEditing={handleAddLink}
                returnKeyType="done"
              />
            </View>
          )}

          {/* Bottom Info + Action */}
          <View style={styles.bottomBar}>
            <Text style={{ fontSize: 15, color: isDarkMode ? '#ccc' : '#333', fontWeight: '600' }}>
              Articles: {articles.length}
            </Text>

            <TouchableOpacity onPress={showInput ? handleAddLink : handleToggleInput} style={styles.iconWrapper}>
              <Icon
                name={showInput ? 'close' : 'add-outline'}
                size={30}
                color={showInput ? '#DC2626' : '#2563EB'}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  articleRow: {
    paddingVertical: 14,
  },
  articleTitle: {
    fontSize: 17,
  },
  inputWrapper: {
    position: 'absolute',
    bottom: 65,
    left: 20,
    right: 20,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  input: {
    height: 40,
    fontSize: 16,
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
    borderTopWidth: 0,
  },
  iconWrapper: {
    marginLeft: 12,
  },
});
