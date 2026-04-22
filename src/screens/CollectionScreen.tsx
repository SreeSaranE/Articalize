import React, { useCallback, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useFocusEffect,
  useNavigation
} from '@react-navigation/native';

import {
  addCollection,
  deleteCollection,
  getCollections
} from '../services/storage';

export default function CollectionScreen() {
  const navigation = useNavigation<any>();

  const [name,setName] = useState('');
  const [items,setItems] = useState<any[]>([]);

  const load = async () => {
    setItems(await getCollections());
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const add = async () => {
    if (!name.trim()) return;

    await addCollection(name.trim());
    setName('');
    load();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>
        Collections
      </Text>

      <View style={styles.row}>
        <TextInput
          placeholder="Collection name"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={add}
        >
          <Text style={styles.bt}>
            Add
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={x => x.id}
        renderItem={({item}) => (
          <View style={styles.card}>
            <TouchableOpacity
              style={{flex:1}}
              onPress={() =>
                navigation.navigate(
                  'CollectionDetail',
                  { collectionId:item.id }
                )
              }
            >
              <Text style={styles.name}>
                {item.name}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async()=>{
                await deleteCollection(
                  item.id
                );
                load();
              }}
            >
              <Text style={styles.delete}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
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
marginBottom:18
},
row:{
flexDirection:'row',
marginBottom:18
},
input:{
flex:1,
backgroundColor:'#1a1a1a',
color:'#fff',
padding:14,
borderRadius:12,
marginRight:10
},
button:{
backgroundColor:'#4f46e5',
paddingHorizontal:18,
justifyContent:'center',
borderRadius:12
},
bt:{color:'#fff'},
card:{
backgroundColor:'#1a1a1a',
padding:14,
borderRadius:12,
marginBottom:10,
flexDirection:'row',
alignItems:'center'
},
name:{
color:'#fff',
fontSize:16
},
delete:{
color:'#ff5c5c'
}
});