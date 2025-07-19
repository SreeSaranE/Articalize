import React, { useEffect, useState, useRef } from 'react';
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
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Collection } from './types';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';

export default function CollectionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDarkMode = useColorScheme() === 'dark';

  const [collections, setCollections] = useState<Collection[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [collectionName, setCollectionName] = useState('');

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

    const newCollection: Collection = {
      id: Date.now().toString(),
      name: collectionName.trim(),
      articles: [],
    };

    const updatedCollections = [...collections, newCollection];
    setCollections(updatedCollections);
    await saveCollections(updatedCollections);
    setCollectionName('');
    setShowInput(false);
    Keyboard.dismiss();
  };

  const handleToggleInput = () => {
    if (showInput) {
      setShowInput(false);
      setCollectionName('');
      Keyboard.dismiss();
    } else {
      setShowInput(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handlePressCollection = (collection: Collection) => {
    navigation.navigate('CollectionDetail', { collection });
  };

  const renderCollection = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      style={styles.collectionRow}
      onPress={() => handlePressCollection(item)}
    >
      <Text style={[styles.collectionName, { color: isDarkMode ? '#fff' : '#000' }]}>
        {item.name}
      </Text>
      <Text style={{ color: isDarkMode ? '#888' : '#666' }}>{item.articles.length}</Text>
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
              data={collections}
              keyExtractor={(item) => item.id}
              renderItem={renderCollection}
              contentContainerStyle={{ paddingBottom: 100 }}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: isDarkMode ? '#333' : '#ddd' }} />
              )}
            />
          </View>

          {/* Input Field */}
          {showInput && (
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
              <TextInput
                ref={inputRef}
                value={collectionName}
                onChangeText={setCollectionName}
                placeholder="Enter collection name"
                placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
                style={[styles.input, { color: isDarkMode ? '#fff' : '#000' }]}
                onSubmitEditing={handleAddCollection}
                returnKeyType="done"
              />
            </View>
          )}

          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            <Text style={{ fontSize: 15, color: isDarkMode ? '#ccc' : '#333', fontWeight: '600' }}>
              Collections: {collections.length}
            </Text>

            <TouchableOpacity
              onPress={showInput ? handleAddCollection : handleToggleInput}
              style={styles.iconWrapper}
            >
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
  collectionRow: {
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  collectionName: {
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
