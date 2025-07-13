import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { sampleArticles, Article } from './articles';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [articles, setArticles] = useState<Article[]>(sampleArticles);
  const [gridView, setGridView] = useState(false);

  const handlePress = (item: Article) => {
    navigation.navigate('ArticleDetail', { article: item });
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
      <Text style={[styles.articleSummary, { color: isDarkMode ? '#aaa' : '#666' }]}>
        {item.summary}
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
            onPress={() => console.log('Add button pressed')}
          >
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Add</Text>
          </TouchableOpacity>
        </View>
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
