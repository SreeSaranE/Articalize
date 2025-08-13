import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Keyboard,
  Platform,
  StatusBar,
  useColorScheme,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Collection } from './types';
import Icon from 'react-native-vector-icons/Ionicons';

export default function CollectionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDarkMode = useColorScheme() === 'dark';

  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionName, setCollectionName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const inputRef = useRef<TextInput>(null);

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
      console.log('Failed to load collections', error);
    }
  };

  const saveCollections = async (newCollections: Collection[]) => {
    try {
      await AsyncStorage.setItem('collections', JSON.stringify(newCollections));
    } catch (error) {
      console.log('Failed to save collections', error);
    }
  };

  const handleAddCollection = async () => {
    if (!collectionName.trim()) return;
    setIsProcessing(true);

    try {
      const newCollection: Collection = {
        id: Date.now().toString(),
        name: collectionName.trim(),
        articles: [],
      };

      const updatedCollections = [newCollection, ...collections];
      setCollections(updatedCollections);
      await saveCollections(updatedCollections);

      setCollectionName('');
      setShowInput(false);
      Keyboard.dismiss();
    } catch (error) {
      console.log('Error adding collection:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCollection = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      style={styles.collectionRow}
      onPress={() => navigation.navigate('CollectionDetail', { collection: item })}
    >
      <Text style={[styles.collectionName, { color: isDarkMode ? '#fff' : '#000' }]}>{item.name}</Text>
      <Text style={{ color: isDarkMode ? '#888' : '#666' }}>{item.articles.length}</Text>
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
        {/* Collection List */}
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={renderCollection}
          contentContainerStyle={{ paddingBottom: 80 }}
          ItemSeparatorComponent={() => (
            <View style={{ height: 0.5, backgroundColor: isDarkMode ? '#333' : '#ddd' }} />
          )}
        />

        {/* Floating Input */}
        {showInput && (
          <View style={[styles.floatingInputBar, { backgroundColor: isDarkMode ? '#111' : '#f9f9f9' }]}>
            <TextInput
              ref={inputRef}
              value={collectionName}
              onChangeText={setCollectionName}
              placeholder="Enter collection name"
              placeholderTextColor={isDarkMode ? '#777' : '#888'}
              style={[styles.floatingInput, { color: isDarkMode ? '#fff' : '#000' }]}
              onSubmitEditing={handleAddCollection}
              returnKeyType="done"
              autoFocus
            />
            <TouchableOpacity onPress={handleAddCollection} style={styles.sendButton}>
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Icon name="checkmark" size={22} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <Text style={{ fontSize: 15, color: isDarkMode ? '#ccc' : '#333', fontWeight: '600' }}>
            Collections: {collections.length}
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
  collectionRow: { paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between' },
  collectionName: { fontSize: 17, fontWeight: '500' },

  floatingInputBar: {
    position: 'absolute',
    bottom: 60,
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
