import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  useColorScheme,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList, Collection, Article } from './types';

type CollectionDetailRouteProp = RouteProp<RootStackParamList, 'CollectionDetail'>;

export default function CollectionDetailScreen() {
  const route = useRoute<CollectionDetailRouteProp>();
  const navigation = useNavigation();
  const isDarkMode = useColorScheme() === 'dark';

  const { collection } = route.params;
  const [articles, setArticles] = useState<Article[]>(collection.articles);

  useEffect(() => {
    navigation.setOptions({ title: collection.name });
  }, [collection.name]);

  const handleRemoveArticle = async (articleId: string) => {
    const updatedArticles = articles.filter(a => a.id !== articleId);
    setArticles(updatedArticles);

    const stored = await AsyncStorage.getItem('collections');
    if (stored) {
      const collections: Collection[] = JSON.parse(stored);
      const updatedCollections = collections.map(col => {
        if (col.id === collection.id) {
          return { ...col, articles: updatedArticles };
        }
        return col;
      });

      await AsyncStorage.setItem('collections', JSON.stringify(updatedCollections));
    }
  };

  const renderArticle = ({ item }: { item: Article }) => (
    <View style={[styles.articleItem, { backgroundColor: isDarkMode ? '#222' : '#fff' }]}>
      <Text style={[styles.articleTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
        {item.title}
      </Text>
      <TouchableOpacity
        onPress={() =>
          Alert.alert('Remove Article', 'Are you sure you want to remove this article?', [
            { text: 'Cancel' },
            { text: 'Remove', onPress: () => handleRemoveArticle(item.id) },
          ])
        }
      >
        <Text style={styles.removeButton}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#111' : '#fff' }}>
      <View
        style={[
          styles.container,
          { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
        ]}
      >
        {articles.length === 0 ? (
          <Text style={[styles.emptyText, { color: isDarkMode ? '#ccc' : '#333' }]}>
            No articles in this collection yet.
          </Text>
        ) : (
          <FlatList
            data={articles}
            keyExtractor={(item) => item.id}
            renderItem={renderArticle}
            contentContainerStyle={{ padding: 10 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  articleItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    marginTop: 8,
    color: 'red',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});
