import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { sampleArticles } from './articles';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colorScheme === 'dark' ? '#121212' : '#FFFFFF'}
      />
      <View style={styles.container}>
        <Text style={styles.header}>Dashboard</Text>

        <FlatList
          data={sampleArticles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.articleCard}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.author}>By {item.author}</Text>
              <Text style={styles.summary}>{item.summary}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </SafeAreaView>
  );
}

function getStyles(colorScheme: 'light' | 'dark' | null | undefined) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? '#121212' : '#FFFFFF',
    },
    container: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Ensures no overlap on Android
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16,
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    },
    listContent: {
      paddingBottom: 20,
    },
    articleCard: {
      marginBottom: 16,
      padding: 16,
      backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#F5F5F5',
      borderRadius: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    },
    author: {
      fontSize: 14,
      color: colorScheme === 'dark' ? '#CCCCCC' : '#555555',
      marginTop: 4,
    },
    summary: {
      marginTop: 8,
      color: colorScheme === 'dark' ? '#AAAAAA' : '#333333',
    },
  });
}
