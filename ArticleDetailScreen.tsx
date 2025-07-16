import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ScrollView,
  useColorScheme,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Article } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

type ArticleDetailProps = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

export default function ArticleDetailScreen({ route, navigation }: ArticleDetailProps) {
  const { article } = route.params;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const handleDelete = async () => {
    try {
      const stored = await AsyncStorage.getItem('articles');
      const articles: Article[] = stored ? JSON.parse(stored) : [];
      const updatedArticles = articles.filter(a => a.id !== article.id);
      await AsyncStorage.setItem('articles', JSON.stringify(updatedArticles));
      navigation.goBack();
    } catch (error) {
      console.log('Error deleting article:', error);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDarkMode ? '#111' : '#f5f5f5' },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>{article.title}</Text>
        <Text style={[styles.metaText, { color: isDarkMode ? '#aaa' : '#555' }]}>ID: {article.id}</Text>
        <Text style={[styles.metaText, { color: isDarkMode ? '#aaa' : '#555' }]}>
          Added On: {article.dateAdded ? format(new Date(article.dateAdded), 'dd-MM-yyyy h:mm a') : 'N/A'}
        </Text>

        <TouchableOpacity
          onPress={() => Linking.openURL(article.url)}
          style={[styles.button, { backgroundColor: isDarkMode ? '#333' : '#4F46E5' }]}
        >
          <Text style={styles.buttonText}>Open in Browser</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: isDarkMode ? '#111' : '#f5f5f5' }]}>
        <TouchableOpacity
          style={[styles.footerButton, { backgroundColor: isDarkMode ? '#333' : '#4F46E5' }]}
          onPress={() => navigation.navigate('AddToCollection', { article })}
        >
          <Text style={styles.footerButtonText}>Add to Collection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerButton, { backgroundColor:'#E53935' }]}
          onPress={handleDelete}
        >
          <Text style={styles.footerButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    marginBottom: 10
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metaText: {
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    marginHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
