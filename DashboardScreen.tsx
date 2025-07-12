import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  useColorScheme,
} from 'react-native';
import { sampleArticles, Article } from './articles';
 // Make sure this path is correct

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [articles, setArticles] = useState<Article[]>(sampleArticles);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [gridView, setGridView] = useState(false);

  const handleLongPress = (item: Article) => {
    setSelectedArticle(item);
    setPopupVisible(true);
  };

  const handleDelete = () => {
    if (selectedArticle) {
      setArticles((prev) => prev.filter((a) => a.id !== selectedArticle.id));
      setSelectedArticle(null);
      setPopupVisible(false);
    }
  };

  const handleAddToCollection = () => {
    console.log(`Add ${selectedArticle?.title} to collection`);
    setPopupVisible(false);
  };

  const renderItem = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={[styles.articleItem, gridView && styles.articleGridItem]}
      onLongPress={() => handleLongPress(item)}
    >
      <Text style={[styles.articleTitle, { color: isDarkMode ? '#fff' : '#000' }]}>{item.title}</Text>
      <Text style={styles.articleSummary}>{item.summary}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#111' : '#f0f0f0' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Dashboard</Text>
        <Text style={{ color: isDarkMode ? '#ccc' : '#333' }}>{articles.length} Articles Saved</Text>
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

      <Modal
        visible={popupVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPopupVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#222' : '#fff' }]}>
            <Text style={{ fontSize: 18, marginBottom: 16, color: isDarkMode ? '#fff' : '#000' }}>
              {selectedArticle?.title}
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleAddToCollection}>
              <Text style={styles.modalButtonText}>Add to Collection</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={handleDelete}>
              <Text style={styles.modalButtonText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPopupVisible(false)}>
              <Text style={{ marginTop: 12, color: '#888', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    backgroundColor: '#fff',
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
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  modalButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
