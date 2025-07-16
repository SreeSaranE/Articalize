import React, { useEffect, useState } from 'react';
import { View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useColorScheme,
  SafeAreaView,
  Platform,
  StatusBar, } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Collection, Article } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddToCollection'>;

export default function AddToCollectionScreen({ route, navigation }: Props) {
  const { article } = route.params;
  const [collections, setCollections] = useState<Collection[]>([]);
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const stored = await AsyncStorage.getItem('collections');
      if (stored) {
        setCollections(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading collections:', error);
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    const updatedCollections = collections.map((col) => {
      if (col.id === collectionId) {
        const exists = col.articles.some((a) => a.id === article.id);
        if (!exists) {
          col.articles.push(article);
        }
      }
      return col;
    });

    setCollections(updatedCollections);
    await AsyncStorage.setItem('collections', JSON.stringify(updatedCollections));
    navigation.goBack();
  };

  const renderItem = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      style={styles.collectionItem}
      onPress={() => handleAddToCollection(item.id)}
    >
      <Text style={[styles.collectionText,  {color: isDarkMode ? '#fff' : '#000'}]}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
    <View style={styles.container}>
      <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>Select Collection</Text>
      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  collectionItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  collectionText: { fontSize: 16 },
});
