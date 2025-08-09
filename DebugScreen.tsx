import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView } from 'react-native';
import { fetchAndSummarize } from './summarizeArticle';

export default function DebugScreen() {
  const [url, setUrl] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
    console.log(message);
  };

  const testProcess = async () => {
    setLogs([]);
    setResult(null);
    addLog(`Testing URL: ${url}`);
    
    try {
      const article = await fetchAndSummarize(url);
      setResult(article);
      addLog('Process completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Error: ${errorMessage}`);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TextInput
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        placeholder="Enter URL to test"
        value={url}
        onChangeText={setUrl}
      />
      <Button title="Test Process" onPress={testProcess} />
      
      <Text style={{ fontWeight: 'bold', marginTop: 20 }}>Result:</Text>
      <Text>{JSON.stringify(result, null, 2)}</Text>
      
      <Text style={{ fontWeight: 'bold', marginTop: 20 }}>Logs:</Text>
      <ScrollView style={{ flex: 1 }}>
        {logs.map((log, index) => (
          <Text key={index}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
}