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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type CollectionDetailRouteProp = RouteProp<RootStackParamList, 'CollectionDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CollectionDetailScreen() {
  const route = useRoute<CollectionDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const isDarkMode = useColorScheme() === 'dark';

  const { collection } = route.params;
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    navigation.setOptions({ title: collection.name });

    const sortedArticles = [...collection.articles].sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    setArticles(sortedArticles);
  }, [collection]);

  const handleRemoveArticle = async (articleId: string) => {
    const updatedArticles = articles.filter(a => a.id !== articleId);
    setArticles(updatedArticles);

    const stored = await AsyncStorage.getItem('collections');
    if (stored) {
      const collections: Collection[] = JSON.parse(stored);
      const updatedCollections = collections.map(col => {
        if (col.id === collection.id) {
          const sortedUpdatedArticles = [...updatedArticles].sort((a, b) =>
            a.title.localeCompare(b.title)
          );
          return { ...col, articles: sortedUpdatedArticles };
        }
        return col;
      });

      await AsyncStorage.setItem('collections', JSON.stringify(updatedCollections));
    }
  };

  const renderArticle = ({ item }: { item: Article }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ArticleDetail', { article: item })}
      style={styles.articleRow}
    >
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
        <Text style={[styles.removeButton, { color: isDarkMode ? '#ff6b6b' : '#cc0000' }]}>
          Remove
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#fff' }}>
      <View
        style={[
          styles.container,
          { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
        ]}
      >
        {articles.length === 0 ? (
          <Text style={[styles.emptyText, { color: isDarkMode ? '#888' : '#555' }]}>
            No articles in this collection yet.
          </Text>
        ) : (
          <FlatList
            data={articles}
            keyExtractor={(item) => item.id}
            renderItem={renderArticle}
            contentContainerStyle={{ paddingVertical: 10 }}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: isDarkMode ? '#333' : '#ddd' }} />
            )}
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
  articleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  articleTitle: {
    fontSize: 17,
    flexShrink: 1,
    marginRight: 18,
    marginTop: 5,
  },
  removeButton: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 17,
  },
});
