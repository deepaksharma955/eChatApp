import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { api } from '../api';

export default function GrammarScreen() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const data = await api.post('/api/grammar', { text });
      setResult(data);
    } catch (e) {
      setResult({ error: e.message, corrections: [], score: 0 });
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.label}>Enter your text</Text>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type or paste your text here..."
          placeholderTextColor="#888"
          multiline
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleCheck}
          disabled={loading || !text.trim()}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="check-bold" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Check Grammar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {result && !result.error && (
        <View style={styles.resultSection}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Grammar Score</Text>
            <Text style={[styles.scoreValue, { color: (result.score || 0) > 80 ? '#4CAF50' : (result.score || 0) > 60 ? '#FF9800' : '#F44336' }]}>
              {result.score}/100
            </Text>
          </View>

          {result.original !== result.corrected && (
            <>
              <Text style={styles.resultLabel}>Original</Text>
              <View style={styles.textBlock}>
                <Text style={styles.textContent}>{result.original}</Text>
              </View>
              <Text style={styles.resultLabel}>Corrected</Text>
              <View style={[styles.textBlock, styles.correctedBlock]}>
                <Text style={[styles.textContent, { color: '#4CAF50' }]}>{result.corrected}</Text>
              </View>
            </>
          )}

          {result.corrections?.length > 0 && (
            <>
              <Text style={styles.resultLabel}>Corrections</Text>
              {result.corrections.map((c, i) => (
                <View key={i} style={styles.correctionItem}>
                  <View style={styles.correctionHeader}>
                    <Text style={styles.errorText}>{c.error}</Text>
                    <Icon name="arrow-right" size={16} color="#4CAF50" />
                    <Text style={styles.correctionText}>{c.correction}</Text>
                  </View>
                  <Text style={styles.explanation}>{c.explanation}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}

      {result?.error && (
        <View style={styles.errorBox}>
          <Icon name="alert" size={20} color="#F44336" />
          <Text style={styles.errorText}>{result.error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  content: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 20 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#2C2C2C', borderRadius: 14, padding: 16, color: '#fff', fontSize: 15,
    minHeight: 140, borderWidth: 1, borderColor: '#3A3A3A', textAlignVertical: 'top',
  },
  button: {
    flexDirection: 'row', backgroundColor: '#f57c00', height: 50, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginTop: 14,
    shadowColor: '#f57c00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  buttonText: { fontWeight: '700', color: '#fff', fontSize: 16 },
  resultSection: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#3A3A3A' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#3A3A3A' },
  scoreLabel: { color: '#ccc', fontSize: 14, fontWeight: '600' },
  scoreValue: { fontSize: 24, fontWeight: '700' },
  resultLabel: { color: '#aaa', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
  textBlock: { backgroundColor: '#1E1E1E', borderRadius: 10, padding: 14, marginBottom: 8 },
  correctedBlock: { borderLeftWidth: 3, borderLeftColor: '#4CAF50' },
  textContent: { color: '#fff', fontSize: 15, lineHeight: 22 },
  correctionItem: { backgroundColor: '#1E1E1E', borderRadius: 10, padding: 14, marginBottom: 8 },
  correctionHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 },
  errorText: { color: '#F44336', fontSize: 13, textDecorationLine: 'line-through', marginRight: 8 },
  correctionText: { color: '#4CAF50', fontSize: 13, fontWeight: '600' },
  explanation: { color: '#aaa', fontSize: 13, lineHeight: 18, marginTop: 4 },
  errorBox: { flexDirection: 'row', backgroundColor: '#2C2C2C', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F44336' },
});
