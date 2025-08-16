import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useColorScheme
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { STORAGE_KEY, DEFAULT_DOMAINS } from './nonArticleDomains';

export default function NonArticleDomainsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [domains, setDomains] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setDomains(JSON.parse(saved));
      } else {
        setDomains(DEFAULT_DOMAINS);
      }
    })();
  }, []);

  useEffect(() => {
    if (modalVisible) {
      // Open keyboard automatically when modal is shown
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [modalVisible]);

  const saveDomains = async (updated: string[]) => {
    setDomains(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addDomain = () => {
    if (!newDomain.trim()) return;
    const domain = newDomain.trim().toLowerCase();
    if (domains.includes(domain)) {
      setModalVisible(false);
      setNewDomain('');
      return;
    }
    saveDomains([...domains, domain]);
    setModalVisible(false);
    setNewDomain('');
  };

  const removeDomain = (domain: string) => {
    saveDomains(domains.filter(d => d !== domain));
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
      {/* Scrollable List */}
      <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
        Non-Article Domain
      </Text>
      <Text style={[styles.description, { color: isDarkMode ? '#fff' : '#000' }]}>
        A Non-Article Domain is a website whose content typically doesn’t need full-text summarization - such as video platforms, 
        social media sites, 
        or search engines - because their primary pages don’t contain long-form articles.
        Instead, the app can simply display the page title or domain name.
        {"\n"}don't remove unless you know about it.
        {"\n"}----------{"\n"}
      </Text>
      <FlatList
        data={domains}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.domainItem}>
            <Text style={[styles.domainText, { color: isDarkMode ? '#fff' : '#000' }]}>{item}</Text>
            <TouchableOpacity onPress={() => removeDomain(item)}>
              <Ionicons name="trash-outline" size={22} color={isDarkMode ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Floating Add Button (same as dashboard) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Domain Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#111' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Add Non-Article Domain
            </Text>
            <TextInput
              ref={inputRef}
              value={newDomain}
              onChangeText={setNewDomain}
              placeholder="e.g. example.com"
              placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
              style={[
                styles.input,
                { color: isDarkMode ? '#fff' : '#000', borderColor: isDarkMode ? '#555' : '#ccc' }
              ]}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={addDomain}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#4F46E5' }]}
                onPress={addDomain}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#aaa' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 ,marginTop: 50},
  domainItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  domainText: { fontSize: 16 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#4F46E5',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5
  },
  description: {
    fontSize: 15,

  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 16
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600'
  }
});
