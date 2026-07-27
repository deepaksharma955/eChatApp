import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { api } from '../api';
import { startRecording, stopRecording, isRecordingSupported } from '../utils/audioRecorder';

const TOPICS = [
  'Introduce yourself and talk about your hobbies',
  'Describe your favorite place in the world',
  'Talk about your future goals and dreams',
  'Describe a memorable travel experience',
  'Explain your daily routine in detail',
  'Talk about a book or movie you enjoyed',
  'Describe your ideal weekend',
  'Discuss a skill you want to learn',
  'Talk about someone who inspires you',
  'Describe your favorite food and how to make it',
];

export default function SpeakingCoachScreen() {
  const [text, setText] = useState('');
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
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
            setText(prev => (prev ? prev + ' ' : '') + e.results[i][0].transcript);
          }
        }
      };
      rec.onerror = () => setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    if (Platform.OS === 'web') {
      if (recRef.current) {
        try { recRef.current.stop(); } catch {}
      }
    } else {
      await stopRecording(recRef.current);
    }
    recRef.current = null;
    setIsRecording(false);
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const data = await api.post('/api/speaking-coach', { text, topic });
      setResult(data);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.topicBtn} onPress={() => setShowTopics(!showTopics)}>
        <Icon name="lightbulb-outline" size={18} color="#f57c00" style={{ marginRight: 8 }} />
        <Text style={styles.topicBtnText}>{topic || 'Choose a speaking topic'}</Text>
        <Icon name={showTopics ? 'chevron-up' : 'chevron-down'} size={18} color="#888" />
      </TouchableOpacity>

      {showTopics && (
        <View style={styles.topicsList}>
          {TOPICS.map((t, i) => (
            <TouchableOpacity key={i} style={[styles.topicItem, t === topic && styles.topicItemActive]} onPress={() => { setTopic(t); setShowTopics(false); }}>
              <Text style={[styles.topicItemText, t === topic && { color: '#f57c00' }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Your Speech</Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Type or speak your response here..."
        placeholderTextColor="#888"
        multiline
        textAlignVertical="top"
      />

      <View style={styles.actionRow}>
        {isRecordingSupported() && (
        <TouchableOpacity style={styles.recordBtn} onPress={isRecording ? handleStopRecording : handleStartRecording}>
          <Icon name={isRecording ? 'stop' : 'microphone'} size={20} color="#fff" />
          <Text style={styles.recordBtnText}>{isRecording ? 'Stop' : 'Record'}</Text>
        </TouchableOpacity>)}
        <TouchableOpacity style={[styles.analyzeBtn, loading && { opacity: 0.7 }]} onPress={handleAnalyze} disabled={loading || !text.trim()}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <><Icon name="chart-bell-curve" size={20} color="#fff" style={{ marginRight: 6 }} /><Text style={styles.analyzeBtnText}>Analyze</Text></>}
        </TouchableOpacity>
      </View>

      {result && !result.error && (
        <View style={styles.resultSection}>
          <View style={styles.scoreRow}>
            {[
              { label: 'Grammar', score: result.grammarScore, color: '#4CAF50' },
              { label: 'Vocabulary', score: result.vocabularyScore, color: '#2196F3' },
              { label: 'Fluency', score: result.fluencyScore, color: '#FF9800' },
            ].map(s => (
              <View key={s.label} style={styles.scoreItem}>
                <Text style={[styles.scoreValue, { color: s.color }]}>{s.score || 0}</Text>
                <Text style={styles.scoreLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.overallRow}>
            <Text style={styles.overallLabel}>Overall</Text>
            <Text style={[styles.overallValue, { color: (result.overallScore || 0) > 80 ? '#4CAF50' : (result.overallScore || 0) > 60 ? '#FF9800' : '#F44336' }]}>
              {result.overallScore}/100
            </Text>
          </View>

          <Text style={styles.sectionLabel}>Feedback</Text>
          <Text style={styles.feedbackText}>{result.feedback}</Text>

          {result.strengths?.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Strengths</Text>
              {result.strengths.map((s, i) => <Text key={i} style={styles.bullet}>+ {s}</Text>)}
            </>
          )}

          {result.improvements?.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>To Improve</Text>
              {result.improvements.map((s, i) => <Text key={i} style={[styles.bullet, { color: '#FF9800' }]}>- {s}</Text>)}
            </>
          )}

          {result.suggestedPhrases?.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Suggested Phrases</Text>
              {result.suggestedPhrases.map((s, i) => (
                <View key={i} style={styles.phraseChip}><Text style={styles.phraseText}>{s}</Text></View>
              ))}
            </>
          )}

          {result.correctedVersion && result.correctedVersion !== text && (
            <>
              <Text style={styles.sectionLabel}>Corrected Version</Text>
              <View style={styles.correctedBox}>
                <Text style={styles.correctedText}>{result.correctedVersion}</Text>
              </View>
            </>
          )}
        </View>
      )}

      {result?.error && (
        <View style={styles.errorBox}><Text style={styles.errorText}>{result.error}</Text></View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  content: { padding: 16, paddingBottom: 40 },
  topicBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C', padding: 14, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: '#3A3A3A' },
  topicBtnText: { flex: 1, color: '#fff', fontSize: 14 },
  topicsList: { backgroundColor: '#2C2C2C', borderRadius: 14, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#3A3A3A' },
  topicItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#3A3A3A' },
  topicItemActive: { backgroundColor: 'rgba(245,124,0,0.08)' },
  topicItemText: { color: '#ccc', fontSize: 14 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#2C2C2C', borderRadius: 14, padding: 16, color: '#fff', fontSize: 15, minHeight: 140, borderWidth: 1, borderColor: '#3A3A3A', textAlignVertical: 'top' },
  actionRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  recordBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F44336', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, gap: 6 },
  recordBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  analyzeBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#f57c00', height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  analyzeBtnText: { fontWeight: '700', color: '#fff', fontSize: 15 },
  resultSection: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 18, marginTop: 20, borderWidth: 1, borderColor: '#3A3A3A' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#3A3A3A' },
  scoreItem: { alignItems: 'center' },
  scoreValue: { fontSize: 28, fontWeight: '700' },
  scoreLabel: { color: '#aaa', fontSize: 12, marginTop: 2 },
  overallRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#3A3A3A' },
  overallLabel: { color: '#ccc', fontSize: 14, fontWeight: '600' },
  overallValue: { fontSize: 22, fontWeight: '700' },
  sectionLabel: { color: '#aaa', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 6 },
  feedbackText: { color: '#ddd', fontSize: 14, lineHeight: 20 },
  bullet: { color: '#4CAF50', fontSize: 14, marginBottom: 4, marginLeft: 4 },
  phraseChip: { backgroundColor: 'rgba(245,124,0,0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 6, alignSelf: 'flex-start' },
  phraseText: { color: '#f57c00', fontSize: 13 },
  correctedBox: { backgroundColor: '#1E1E1E', borderRadius: 10, padding: 14, borderLeftWidth: 3, borderLeftColor: '#4CAF50' },
  correctedText: { color: '#4CAF50', fontSize: 14, lineHeight: 20 },
  errorBox: { backgroundColor: '#2C2C2C', borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#F44336' },
  errorText: { color: '#F44336', fontSize: 14 },
});
