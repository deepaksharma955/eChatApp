import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { api } from '../api';
import { startRecording, stopRecording, isRecordingSupported } from '../utils/audioRecorder';

export default function PronunciationScreen() {
  const [text, setText] = useState('');
  const [spokenText, setSpokenText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recRef = useRef(null);

  const handleStartRecording = async () => {
    const rec = await startRecording();
    if (!rec) return;
    recRef.current = rec;
    setIsRecording(true);

    if (Platform.OS === 'web') {
      rec.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            setSpokenText(prev => (prev ? prev + ' ' : '') + e.results[i][0].transcript);
          }
        }
      };
      rec.onerror = () => setIsRecording(false);
      rec.onend = () => setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    if (Platform.OS === 'web') {
      if (recRef.current) { try { recRef.current.stop(); } catch {} }
    } else {
      await stopRecording(recRef.current);
    }
    recRef.current = null;
    setIsRecording(false);
  };

  const handleScore = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const data = await api.post('/api/pronunciation', { text, spokenText: spokenText.trim() || undefined });
      setResult(data);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const speakText = () => {
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
    } else {
      Speech.speak(text, { language: 'en-US', rate: 0.8 });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Sentence to practice</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 8 }]}
          value={text}
          onChangeText={setText}
          placeholder="Type a sentence to practice..."
          placeholderTextColor="#888"
          multiline
        />
        <TouchableOpacity style={styles.speakBtn} onPress={speakText}>
          <Icon name="volume-high" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Your spoken version</Text>
      <TextInput
        style={styles.input}
        value={spokenText}
        onChangeText={setSpokenText}
        placeholder="Speak or type what you said..."
        placeholderTextColor="#888"
        multiline
        textAlignVertical="top"
      />

      <View style={styles.actionRow}>
        {isRecordingSupported() && (
          <TouchableOpacity style={styles.recordBtn} onPress={isRecording ? handleStopRecording : handleStartRecording}>
            <Icon name={isRecording ? 'stop-circle' : 'microphone'} size={20} color="#fff" />
            <Text style={styles.recordBtnText}>{isRecording ? 'Stop' : 'Record'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.analyzeBtn, loading && { opacity: 0.7 }]}
          onPress={handleScore}
          disabled={loading || !text.trim()}
        >
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <><Icon name="waveform" size={20} color="#fff" style={{ marginRight: 6 }} /><Text style={styles.analyzeBtnText}>Score</Text></>}
        </TouchableOpacity>
      </View>

      {result && !result.error && (
        <View style={styles.resultSection}>
          <View style={styles.bigScore}>
            <Text style={[styles.bigScoreValue, { color: (result.score || 0) > 80 ? '#4CAF50' : (result.score || 0) > 60 ? '#FF9800' : '#F44336' }]}>
              {result.score !== null && result.score !== undefined ? result.score : '--'}
            </Text>
            <Text style={styles.bigScoreLabel}>Pronunciation Score</Text>
          </View>

          <Text style={styles.sectionLabel}>Expected</Text>
          <View style={styles.textBlock}><Text style={styles.textContent}>{result.expected}</Text></View>

          {result.spoken && (
            <>
              <Text style={styles.sectionLabel}>You said</Text>
              <View style={styles.textBlock}><Text style={styles.textContent}>{result.spoken}</Text></View>
            </>
          )}

          {result.feedback && (
            <>
              <Text style={styles.sectionLabel}>Feedback</Text>
              <Text style={styles.feedbackText}>{result.feedback}</Text>
            </>
          )}

          {result.tips?.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Tips</Text>
              {result.tips.map((t, i) => (
                <View key={i} style={styles.tipRow}>
                  <Icon name="lightbulb-outline" size={16} color="#f57c00" style={{ marginRight: 8 }} />
                  <Text style={styles.tipText}>{t}</Text>
                </View>
              ))}
            </>
          )}

          {result.mispronouncedWords?.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Words to practice</Text>
              <View style={styles.wordRow}>
                {result.mispronouncedWords.map((w, i) => (
                  <View key={i} style={styles.wordChip}><Text style={styles.wordChipText}>{w}</Text></View>
                ))}
              </View>
            </>
          )}
        </View>
      )}

      {result?.error && <View style={styles.errorBox}><Text style={styles.errorText}>{result.error}</Text></View>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  content: { padding: 16, paddingBottom: 40 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start' },
  input: { backgroundColor: '#2C2C2C', borderRadius: 14, padding: 16, color: '#fff', fontSize: 15, minHeight: 80, borderWidth: 1, borderColor: '#3A3A3A', textAlignVertical: 'top' },
  speakBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#2196F3', justifyContent: 'center', alignItems: 'center' },
  actionRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  recordBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F44336', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, gap: 6 },
  recordBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  analyzeBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#f57c00', height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  analyzeBtnText: { fontWeight: '700', color: '#fff', fontSize: 15 },
  resultSection: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 18, marginTop: 20, borderWidth: 1, borderColor: '#3A3A3A' },
  bigScore: { alignItems: 'center', paddingVertical: 16, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#3A3A3A' },
  bigScoreValue: { fontSize: 52, fontWeight: '700' },
  bigScoreLabel: { color: '#aaa', fontSize: 13, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionLabel: { color: '#aaa', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 6 },
  textBlock: { backgroundColor: '#1E1E1E', borderRadius: 10, padding: 14, marginBottom: 8 },
  textContent: { color: '#fff', fontSize: 15, lineHeight: 22 },
  feedbackText: { color: '#ddd', fontSize: 14, lineHeight: 20 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  tipText: { color: '#ccc', fontSize: 13, flex: 1, lineHeight: 18 },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wordChip: { backgroundColor: 'rgba(245,124,0,0.15)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  wordChipText: { color: '#f57c00', fontSize: 13, fontWeight: '600' },
  errorBox: { backgroundColor: '#2C2C2C', borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#F44336' },
  errorText: { color: '#F44336', fontSize: 14 },
});
