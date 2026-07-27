import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { api } from '../api';

const LANGUAGES = [
  { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' }, { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' }, { code: 'pt', name: 'Portuguese' }, { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' }, { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' }, { code: 'hi', name: 'Hindi' }, { code: 'bn', name: 'Bengali' },
  { code: 'ur', name: 'Urdu' }, { code: 'tr', name: 'Turkish' }, { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' }, { code: 'nl', name: 'Dutch' }, { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' }, { code: 'da', name: 'Danish' }, { code: 'fi', name: 'Finnish' },
  { code: 'el', name: 'Greek' }, { code: 'he', name: 'Hebrew' }, { code: 'id', name: 'Indonesian' },
];

export default function TranslationScreen() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fromLang, setFromLang] = useState('auto');
  const [toLang, setToLang] = useState('es');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const data = await api.post('/api/translate', { text, from: fromLang, to: toLang });
      setResult(data);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const swapLangs = () => {
    const f = fromLang;
    setFromLang(toLang);
    setToLang(f === 'auto' ? 'en' : f);
  };

  const getLangName = (code) => {
    if (code === 'auto') return 'Auto Detect';
    return LANGUAGES.find(l => l.code === code)?.name || code;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.langRow}>
        <TouchableOpacity style={styles.langBtn} onPress={() => setShowFromPicker(true)}>
          <Text style={styles.langBtnText}>{getLangName(fromLang)}</Text>
          <Icon name="chevron-down" size={16} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.swapBtn} onPress={swapLangs}>
          <Icon name="swap-horizontal" size={22} color="#f57c00" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.langBtn} onPress={() => setShowToPicker(true)}>
          <Text style={styles.langBtnText}>{getLangName(toLang)}</Text>
          <Icon name="chevron-down" size={16} color="#888" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Enter text to translate..."
        placeholderTextColor="#888"
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleTranslate}
        disabled={loading || !text.trim()}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Icon name="translate" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Translate</Text>
          </>
        )}
      </TouchableOpacity>

      {result && !result.error && (
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Translation ({getLangName(result.to || toLang)})</Text>
          <Text style={styles.resultText}>{result.translated}</Text>
        </View>
      )}

      {result?.error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{result.error}</Text>
        </View>
      )}

      {showFromPicker && (
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setShowFromPicker(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Source Language</Text>
              <TouchableOpacity onPress={() => setShowFromPicker(false)}><Icon name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.pickerItem, fromLang === 'auto' && styles.pickerItemActive]} onPress={() => { setFromLang('auto'); setShowFromPicker(false); }}>
              <Text style={[styles.pickerItemText, fromLang === 'auto' && { color: '#f57c00' }]}>Auto Detect</Text>
            </TouchableOpacity>
            {LANGUAGES.map(l => (
              <TouchableOpacity key={l.code} style={[styles.pickerItem, fromLang === l.code && styles.pickerItemActive]} onPress={() => { setFromLang(l.code); setShowFromPicker(false); }}>
                <Text style={[styles.pickerItemText, fromLang === l.code && { color: '#f57c00' }]}>{l.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}

      {showToPicker && (
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setShowToPicker(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Target Language</Text>
              <TouchableOpacity onPress={() => setShowToPicker(false)}><Icon name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            {LANGUAGES.map(l => (
              <TouchableOpacity key={l.code} style={[styles.pickerItem, toLang === l.code && styles.pickerItemActive]} onPress={() => { setToLang(l.code); setShowToPicker(false); }}>
                <Text style={[styles.pickerItemText, toLang === l.code && { color: '#f57c00' }]}>{l.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  content: { padding: 16, paddingBottom: 40 },
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  langBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#3A3A3A' },
  langBtnText: { color: '#fff', fontSize: 14, fontWeight: '600', marginRight: 6 },
  swapBtn: { marginHorizontal: 12, padding: 8 },
  input: {
    backgroundColor: '#2C2C2C', borderRadius: 14, padding: 16, color: '#fff', fontSize: 15,
    minHeight: 130, borderWidth: 1, borderColor: '#3A3A3A', textAlignVertical: 'top',
  },
  button: {
    flexDirection: 'row', backgroundColor: '#f57c00', height: 50, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginTop: 14,
    shadowColor: '#f57c00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  buttonText: { fontWeight: '700', color: '#fff', fontSize: 16 },
  resultBox: { backgroundColor: '#2C2C2C', borderRadius: 14, padding: 18, marginTop: 16, borderWidth: 1, borderColor: '#3A3A3A' },
  resultLabel: { color: '#aaa', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  resultText: { color: '#fff', fontSize: 16, lineHeight: 24 },
  errorBox: { backgroundColor: '#2C2C2C', borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#F44336' },
  errorText: { color: '#F44336', fontSize: 14 },
  pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 100 },
  pickerSheet: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 30 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2C2C2C' },
  pickerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#2C2C2C' },
  pickerItemActive: { backgroundColor: 'rgba(245,124,0,0.08)' },
  pickerItemText: { flex: 1, color: '#fff', fontSize: 16 },
});
