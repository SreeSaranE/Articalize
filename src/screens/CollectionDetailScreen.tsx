import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation, useRoute } from '@react-navigation/native';

import {
  getArticles,
  getCollections,
  removeArticleFromCollection
} from '../services/storage';

export default function CollectionDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { collectionId } = route.params;

  const [collection, setCollection] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);

  const load = async () => {
    const cols = await getCollections();
    const arts = await getArticles();

    const found = cols.find(
      x => x.id === collectionId
    );

    setCollection(found);

    if (!found) return;

    setArticles(
      arts.filter(a =>
        found.articleIds.includes(a.id)
      )
    );
  };

  useEffect(() => {
    load();
  }, []);

  if (!collection) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>
        {collection.name}
      </Text>

      <FlatList
        data={articles}
        keyExtractor={x => x.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate(
                'ArticleDetail',
                { articleId:item.id }
              )
            }
          >
            <Text style={styles.title}>
              {item.title}
            </Text>

            <TouchableOpacity
              onPress={async()=>{
                await removeArticleFromCollection(
                  item.id,
                  collection.id
                );
                load();
              }}
            >
              <Text style={styles.remove}>
                Remove
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
container:{
flex:1,
backgroundColor:'#0f0f0f',
padding:16
},
header:{
color:'#fff',
fontSize:28,
fontWeight:'700',
marginBottom:16
},
card:{
backgroundColor:'#1a1a1a',
padding:14,
borderRadius:12,
marginBottom:10
},
title:{
color:'#fff',
marginBottom:8
},
remove:{
color:'#ff6666'
}
});