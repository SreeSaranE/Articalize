import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Collection } from './types';
import { useFocusEffect } from '@react-navigation/native';

export default function CollectionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDarkMode = useColorScheme() === 'dark';

  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showInput, setShowInput] = useState(false);

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
      } else {
        setCollections([]);
      }
    } catch (error) {
      console.log('Failed to load collections', error);
    }
  };

  const saveCollections = async (updatedCollections: Collection[]) => {
    try {
      await AsyncStorage.setItem('collections', JSON.stringify(updatedCollections));
    } catch (error) {
      console.log('Failed to save collections', error);
    }
  };

  const handleAddCollection = async () => {
    if (!newCollectionName.trim()) return;

    const newCollection: Collection = {
      id: Date.now().toString(),
      name: newCollectionName.trim(),
      articles: [],
    };

    const updatedCollections = [...collections, newCollection];
    setCollections(updatedCollections);
    await saveCollections(updatedCollections);

    setNewCollectionName('');
    setShowInput(false);
  };

  const handleCollectionPress = (collection: Collection) => {
    navigation.navigate('CollectionDetail', { collection });
  };

  const renderCollection = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      onPress={() => handleCollectionPress(item)}
      style={[styles.collectionItem]}
    >
      <Text style={[styles.collectionName, { color: isDarkMode ? '#fff' : '#000' }]}>
        {item.name}
      </Text>
      <Text style={{ color: isDarkMode ? '#aaa' : '#555' }}>
        {item.articles.length} Articles
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>Collections</Text>
        <Text style={{ color: isDarkMode ? '#aaa' : '#555' }}>
          {collections.length} Collections Saved
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: isDarkMode ? '#333' : '#ddd' }]}
            onPress={() => setShowInput(!showInput)}
          >
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Add Collection</Text>
          </TouchableOpacity>
        </View>

        {showInput && (
          <View style={styles.inputContainer}>
            <TextInput
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              placeholder="Collection name"
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
              style={[
                styles.input,
                { color: isDarkMode ? '#fff' : '#000', borderColor: isDarkMode ? '#555' : '#ccc' },
              ]}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: isDarkMode ? '#333' : '#ddd' }]}
              onPress={handleAddCollection}
            >
              <Text style={{ color: '#fff' }}>Save Collection</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={renderCollection}
          contentContainerStyle={{ paddingVertical: 10 }}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: isDarkMode ? '#333' : '#ddd' }} />
          )}
        />
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttons: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  collectionItem: {
    padding: 16,
    borderRadius: 8,
  },
  collectionName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
