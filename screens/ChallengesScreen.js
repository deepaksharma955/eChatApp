import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { api } from '../api';

const TYPE_ICONS = { writing: 'pencil', speaking: 'microphone', vocabulary: 'book-open-variant', grammar: 'check-underline', comprehension: 'brain' };
const TYPE_COLORS = { writing: '#4CAF50', speaking: '#FF9800', vocabulary: '#E91E63', grammar: '#2196F3', comprehension: '#9C27B0' };

export default function ChallengesScreen() {
  const [challenge, setChallenge] = useState(null);
  const [response, setResponse] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState([]);

  const fetchChallenge = async () => {
    setLoading(true);
    setResponse('');
    setFeedback(null);
    try {
      const data = await api.get('/api/challenges');
      setChallenge(data);
    } catch {
      setChallenge({ type: 'writing', title: 'Daily Challenge', description: 'Could not load challenge — check server connection.', difficulty: 'beginner' });
    }
    setLoading(false);
  };

  useEffect(() => { fetchChallenge(); }, []);

  const handleSubmit = async () => {
    if (!response.trim() || !challenge) return;
    setSubmitting(true);
    try {
      const data = await api.post('/api/challenges/submit', { challengeType: challenge.type, response });
      setFeedback(data);
      setCompleted(prev => [challenge.title, ...prev.slice(0, 19)]);
    } catch {
      setFeedback({ score: 0, feedback: 'Could not submit. Check connection.', strengths: [], improvements: [], tips: [] });
    }
    setSubmitting(false);
  };

  const getIcon = () => TYPE_ICONS[challenge?.type] || 'trophy';
  const getColor = () => TYPE_COLORS[challenge?.type] || '#f57c00';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.refreshBtn} onPress={fetchChallenge} disabled={loading}>
        <Icon name="refresh" size={18} color="#f57c00" />
        <Text style={styles.refreshBtnText}>New Challenge</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#f57c00" style={{ marginTop: 40 }} />}

      {challenge && !loading && (
        <View style={styles.challengeCard}>
          <View style={[styles.typeBadge, { backgroundColor: getColor() + '20' }]}>
            <Icon name={getIcon()} size={18} color={getColor()} />
            <Text style={[styles.typeText, { color: getColor() }]}>{challenge.type?.charAt(0).toUpperCase() + challenge.type?.slice(1)}</Text>
          </View>

          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeDesc}>{challenge.description}</Text>

          {challenge.difficulty && (
            <View style={styles.diffRow}>
              <Icon name="signal" size={14} color="#888" />
              <Text style={styles.diffText}>{challenge.difficulty}</Text>
            </View>
          )}

          {challenge.hints?.length > 0 && (
            <View style={styles.hintsSection}>
              <Text style={styles.hintsTitle}>Hints</Text>
              {challenge.hints.map((h, i) => (
                <Text key={i} style={styles.hintItem}>{i + 1}. {h}</Text>
              ))}
            </View>
          )}

          <Text style={styles.label}>Your Response</Text>
          <TextInput
            style={styles.input}
            value={response}
            onChangeText={setResponse}
            placeholder={challenge.type === 'speaking' ? 'Type what you would say...' : 'Write your response...'}
            placeholderTextColor="#888"
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting || !response.trim()}>
            {submitting ? <ActivityIndicator size="small" color="#fff" /> : <><Icon name="send" size={18} color="#fff" style={{ marginRight: 6 }} /><Text style={styles.submitBtnText}>Submit</Text></>}
          </TouchableOpacity>
        </View>
      )}

      {feedback && (
        <View style={styles.feedbackCard}>
          <View style={styles.feedbackHeader}>
            <Text style={styles.feedbackScore}>{feedback.score}/100</Text>
            <Text style={styles.feedbackLabel}>Score</Text>
          </View>

          <Text style={styles.sectionLabel}>Feedback</Text>
          <Text style={styles.feedbackText}>{feedback.feedback}</Text>

          {feedback.strengths?.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Strengths</Text>
              {feedback.strengths.map((s, i) => <Text key={i} style={[styles.bullet, { color: '#4CAF50' }]}>+ {s}</Text>)}
            </>
          )}

          {feedback.improvements?.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>To Improve</Text>
              {feedback.improvements.map((s, i) => <Text key={i} style={[styles.bullet, { color: '#FF9800' }]}>- {s}</Text>)}
            </>
          )}

          {feedback.tips?.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Tips</Text>
              {feedback.tips.map((t, i) => (
                <View key={i} style={styles.tipRow}><Icon name="lightbulb-outline" size={14} color="#f57c00" style={{ marginRight: 6 }} /><Text style={styles.tipText}>{t}</Text></View>
              ))}
            </>
          )}

          <TouchableOpacity style={styles.nextBtn} onPress={fetchChallenge}>
            <Text style={styles.nextBtnText}>Next Challenge</Text>
          </TouchableOpacity>
        </View>
      )}

      {completed.length > 0 && (
        <View style={styles.completedSection}>
          <Text style={styles.completedTitle}>Completed ({completed.length})</Text>
          {completed.map((c, i) => (
            <View key={i} style={styles.completedItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" style={{ marginRight: 8 }} />
              <Text style={styles.completedText}>{c}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  content: { padding: 16, paddingBottom: 40 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(245,124,0,0.15)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginBottom: 20, gap: 6 },
  refreshBtnText: { color: '#f57c00', fontWeight: '600', fontSize: 14 },
  challengeCard: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#3A3A3A' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 14, gap: 6 },
  typeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  challengeTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  challengeDesc: { color: '#ccc', fontSize: 15, lineHeight: 22, marginBottom: 12 },
  diffRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
  diffText: { color: '#888', fontSize: 13, textTransform: 'capitalize' },
  hintsSection: { backgroundColor: 'rgba(245,124,0,0.08)', borderRadius: 10, padding: 14, marginBottom: 16 },
  hintsTitle: { color: '#f57c00', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  hintItem: { color: '#ccc', fontSize: 13, marginBottom: 4, lineHeight: 18 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, minHeight: 110, borderWidth: 1, borderColor: '#3A3A3A', textAlignVertical: 'top' },
  submitBtn: { flexDirection: 'row', backgroundColor: '#f57c00', height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 14 },
  submitBtnText: { fontWeight: '700', color: '#fff', fontSize: 15 },
  feedbackCard: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 18, marginTop: 16, borderWidth: 1, borderColor: '#3A3A3A' },
  feedbackHeader: { alignItems: 'center', paddingVertical: 12, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#3A3A3A' },
  feedbackScore: { fontSize: 40, fontWeight: '700', color: '#4CAF50' },
  feedbackLabel: { color: '#aaa', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionLabel: { color: '#aaa', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 6 },
  feedbackText: { color: '#ddd', fontSize: 14, lineHeight: 20 },
  bullet: { fontSize: 14, marginBottom: 4, marginLeft: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  tipText: { color: '#ccc', fontSize: 13, flex: 1 },
  nextBtn: { backgroundColor: 'rgba(245,124,0,0.15)', borderRadius: 12, height: 44, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  nextBtnText: { color: '#f57c00', fontWeight: '600', fontSize: 14 },
  completedSection: { marginTop: 24 },
  completedTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  completedItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C', borderRadius: 10, padding: 12, marginBottom: 6 },
  completedText: { color: '#ccc', fontSize: 14 },
});
