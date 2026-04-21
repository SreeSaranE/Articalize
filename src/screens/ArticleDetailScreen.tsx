import React, { useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import {
  useNavigation,
  useRoute
} from '@react-navigation/native';

import {
  addArticleToCollection,
  deleteArticle,
  getArticles,
  getCollections,
  saveArticles,
  saveCollections
} from '../services/storage';

import { summarizeFromUrl } from '../services/summaryService';

export default function ArticleDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { articleId } = route.params;

  const [article, setArticle] = useState<any>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [showCollections, setShowCollections] =
    useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const articles = await getArticles();
    const cols = await getCollections();

    const found = articles.find(
      a => a.id === articleId
    );

    setArticle(found || null);
    setCollections(cols);
  };

  useEffect(() => {
    load();
  }, []);

  const summarize = async () => {
    if (!article) return;

    try {
      setLoading(true);

      const summary =
        await summarizeFromUrl(
          article.url
        );

      const all = await getArticles();

      const updated = all.map(a =>
        a.id === article.id
          ? { ...a, summary }
          : a
      );

      await saveArticles(updated);

      await load();
    } finally {
      setLoading(false);
    }
  };

  const removeArticle = async () => {
    await deleteArticle(article.id);

    const cols = await getCollections();

    const cleaned = cols.map(c => ({
      ...c,
      articleIds: c.articleIds.filter(
        (id: string) =>
          id !== article.id
      )
    }));

    await saveCollections(cleaned);

    navigation.goBack();
  };

  if (!article) return null;

  const belongsTo = collections.filter(
    c =>
      c.articleIds.includes(
        article.id
      )
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          padding: 18
        }}
      >
        <Text style={styles.title}>
          {article.title}
        </Text>

        <TouchableOpacity
          onPress={() =>
            Linking.openURL(
              article.url
            )
          }
        >
          <Text style={styles.link}>
            Open Original Article
          </Text>
        </TouchableOpacity>

        <Text style={styles.meta}>
          Added:{' '}
          {new Date(
            article.dateAdded
          ).toLocaleString()}
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={summarize}
        >
          <Text style={styles.buttonText}>
            {loading
              ? 'Generating...'
              : 'Summarize'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={removeArticle}
        >
          <Text style={styles.deleteText}>
            Delete Article
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            setShowCollections(
              true
            )
          }
        >
          <Text style={styles.buttonText}>
            Add To Collection
          </Text>
        </TouchableOpacity>

        <Text style={styles.heading}>
          In Collections
        </Text>

        {belongsTo.length === 0 ? (
          <Text style={styles.small}>
            Not added anywhere
          </Text>
        ) : (
          belongsTo.map(item => (
            <Text
              key={item.id}
              style={styles.small}
            >
              • {item.name}
            </Text>
          ))
        )}

        <Text style={styles.heading}>
          Summary
        </Text>

        <Text style={styles.summary}>
          {article.summary ||
            'No summary yet'}
        </Text>
      </ScrollView>

      <Modal
        visible={showCollections}
        transparent
        animationType="fade"
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalBox}>
            <Text
              style={
                styles.modalTitle
              }
            >
              Select Collection
            </Text>

            {collections.length ===
            0 ? (
              <Text
                style={
                  styles.small
                }
              >
                No collections
              </Text>
            ) : (
              collections.map(
                item => (
                  <TouchableOpacity
                    key={item.id}
                    style={
                      styles.collection
                    }
                    onPress={async () => {
                      await addArticleToCollection(
                        article.id,
                        item.id
                      );

                      setShowCollections(
                        false
                      );

                      load();
                    }}
                  >
                    <Text
                      style={
                        styles.collectionText
                      }
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )
              )
            )}

            <TouchableOpacity
              style={
                styles.cancelBtn
              }
              onPress={() =>
                setShowCollections(
                  false
                )
              }
            >
              <Text
                style={
                  styles.cancelText
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#0f0f0f'
    },

    title: {
      color: '#fff',
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 14
    },

    link: {
      color: '#6ea8fe',
      marginBottom: 14
    },

    meta: {
      color: '#888',
      marginBottom: 18
    },

    button: {
      backgroundColor:
        '#4f46e5',
      padding: 14,
      borderRadius: 12,
      marginBottom: 14
    },

    buttonText: {
      color: '#fff',
      textAlign: 'center',
      fontWeight: '700'
    },

    deleteBtn: {
      backgroundColor:
        '#2a1111',
      padding: 14,
      borderRadius: 12,
      marginBottom: 14
    },

    deleteText: {
      color: '#ff6666',
      textAlign: 'center',
      fontWeight: '700'
    },

    heading: {
      color: '#fff',
      fontSize: 18,
      marginTop: 10,
      marginBottom: 8
    },

    small: {
      color: '#aaa',
      marginBottom: 6
    },

    summary: {
      color: '#ddd',
      lineHeight: 24,
      marginBottom: 40
    },

    modalWrap: {
      flex: 1,
      justifyContent:
        'center',
      alignItems: 'center',
      backgroundColor:
        'rgba(0,0,0,0.55)'
    },

    modalBox: {
      width: '86%',
      backgroundColor:
        '#1a1a1a',
      borderRadius: 16,
      padding: 18
    },

    modalTitle: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 14
    },

    collection: {
      backgroundColor:
        '#2a2a2a',
      padding: 14,
      borderRadius: 10,
      marginBottom: 10
    },

    collectionText: {
      color: '#fff'
    },

    cancelBtn: {
      marginTop: 8,
      padding: 12
    },

    cancelText: {
      color: '#ff6666',
      textAlign: 'center',
      fontWeight: '600'
    }
  });