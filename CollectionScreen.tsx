import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useColorScheme,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Collection } from './types';
import { useFocusEffect } from '@react-navigation/native';

export default function CollectionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDarkMode = useColorScheme() === 'dark';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    loadCollections();
  }, []);

  useFocusEffect(
      React.useCallback(() => {
        loadCollections();
      }, [])
    );

  const loadCollections = async () => {
    try {
      const stored = await AsyncStorage.getItem('collections');
      if (stored) {
        setCollections(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Failed to load collections:', error);
    }
  };

  const saveCollections = async (updatedCollections: Collection[]) => {
    try {
      await AsyncStorage.setItem('collections', JSON.stringify(updatedCollections));
    } catch (error) {
      console.log('Failed to save collections:', error);
    }
  };

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;

    const newCollection: Collection = {
      id: Date.now().toString(),
      name: newCollectionName.trim(),
      articles: [],
    };

    const updated = [...collections, newCollection];
    setCollections(updated);
    saveCollections(updated);

    setNewCollectionName('');
    setShowCreateModal(false);
  };

  const handleCollectionPress = (collection: Collection) => {
    navigation.navigate('CollectionDetail', { collection });
  };

  const renderItem = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      style={[styles.collectionItem, { backgroundColor: isDarkMode ? '#222' : '#fff' }]}
      onPress={() => handleCollectionPress(item)}
    >
      <Text style={[styles.collectionText, { color: isDarkMode ? '#f5f5f5' : '#000' }]}>
        {item.name}
      </Text>
      <Text style={{ color: isDarkMode ? '#ccc' : '#333' }}>
        {item.articles.length} Articles
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#111' : '#f5f5f5' }]}>
      <View style={styles.container}>
        <Text style={[styles.collectionTitle, { color: isDarkMode ? '#f5f5f5' : '#000' }]}>Collection</Text>

        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>Create New Collection</Text>
        </TouchableOpacity>

        <Modal visible={showCreateModal} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TextInput
                placeholder="Enter Collection Name"
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                style={styles.input}
              />
              <TouchableOpacity onPress={handleCreateCollection} style={styles.createButton}>
                <Text style={styles.createButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  collectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
  },
  listContent: {
    paddingBottom: 20,
  },
  collectionItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  collectionText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    marginVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#f5f5f5',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#007AFF',
  },
});
