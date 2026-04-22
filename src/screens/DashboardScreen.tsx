import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchPageTitle } from '../services/fetchPageTitle';
import { addArticle, getArticles } from '../services/storage';
import { Article } from '../types';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();

  const [url, setUrl] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  const loadArticles = async () => {
    const data = await getArticles();
    setArticles(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadArticles();
    }, [])
  );

  const handleAdd = async () => {
    if (!url.trim()) return;

    try {
      setLoading(true);

      const title = await fetchPageTitle(url.trim());

      const article: Article = {
        id: Date.now().toString(),
        url: url.trim(),
        title,
        summary: '',
        description: '',
        dateAdded: new Date().toISOString()
      };

      await addArticle(article);

      setUrl('');
      loadArticles();
    } catch {
      Alert.alert('Failed to add article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Articalize</Text>

      <View style={styles.row}>
        <TextInput
          placeholder="Paste article link"
          placeholderTextColor="#888"
          value={url}
          onChangeText={setUrl}
          style={styles.input}
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.button} onPress={handleAdd}>
          <Text style={styles.buttonText}>
            {loading ? '...' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No saved articles</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('ArticleDetail', {
                articleId: item.id
              })
            }
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.url}>{item.url}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    padding: 16
  },
  header: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 18
  },
  row: {
    flexDirection: 'row',
    marginBottom: 18
  },
  input: {
    flex: 1,
    backgroundColor: '#1b1b1b',
    color: '#fff',
    padding: 14,
    borderRadius: 12,
    marginRight: 10
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 12
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12
  },
  title: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4
  },
  url: {
    color: '#888',
    fontSize: 12
  },
  empty: {
    color: '#777',
    textAlign: 'center',
    marginTop: 40
  }
});