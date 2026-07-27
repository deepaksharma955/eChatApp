import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { auth, realtimeDb } from '../firebase';
import { ref, onValue, off, update } from 'firebase/database';
import { api } from '../api';

const STAT_CARDS = [
  { key: 'grammarPoints', icon: 'check-underline', label: 'Grammar', color: '#4CAF50' },
  { key: 'vocabPoints', icon: 'book-open-variant', label: 'Vocabulary', color: '#E91E63' },
  { key: 'speakingPoints', icon: 'microphone', label: 'Speaking', color: '#FF9800' },
  { key: 'challengesDone', icon: 'trophy', label: 'Challenges', color: '#FF5722' },
  { key: 'pronunciationAvg', icon: 'waveform', label: 'Pronunciation', color: '#9C27B0' },
  { key: 'confidence', icon: 'trending-up', label: 'Confidence', color: '#2196F3' },
];

export default function ProgressScreen() {
  const [progress, setProgress] = useState({
    grammarPoints: 0, vocabPoints: 0, speakingPoints: 0, challengesDone: 0, pronunciationAvg: 0, confidence: 0,
    streak: 0, joinDate: '', lastActive: '', totalSessions: 0, wordsLearned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUid) return;
    const progRef = ref(realtimeDb, `Progress/${currentUid}`);
    const handleData = (snap) => {
      if (snap.exists()) setProgress(prev => ({ ...prev, ...snap.val() }));
      setLoading(false);
    };
    onValue(progRef, handleData);
    return () => off(progRef, 'value', handleData);
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid) return;
    const progRef = ref(realtimeDb, `Progress/${currentUid}`);
    update(progRef, {
      lastActive: new Date().toISOString(),
      totalSessions: (progress.totalSessions || 0) + 0,
    }).catch(() => {});
  }, []);

  const getInsights = async () => {
    try {
      const data = await api.get(`/api/progress/insights?data=${encodeURIComponent(JSON.stringify(progress))}`);
      setInsights(data);
    } catch {}
  };

  const getLevel = (score) => {
    if (score >= 90) return { label: 'Expert', color: '#FFD700' };
    if (score >= 75) return { label: 'Advanced', color: '#4CAF50' };
    if (score >= 60) return { label: 'Intermediate', color: '#2196F3' };
    if (score >= 40) return { label: 'Developing', color: '#FF9800' };
    return { label: 'Beginner', color: '#F44336' };
  };

  const overall = Math.round(
    (progress.grammarPoints + progress.vocabPoints + progress.speakingPoints +
     progress.pronunciationAvg + progress.confidence) / 5
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#f57c00" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.overallCard}>
        <Text style={styles.overallScore}>{overall}</Text>
        <Text style={styles.overallLabel}>Overall Progress</Text>
        <View style={[styles.levelBadge, { backgroundColor: getLevel(overall).color + '20' }]}>
          <Text style={[styles.levelText, { color: getLevel(overall).color }]}>{getLevel(overall).label}</Text>
        </View>
        <View style={styles.streakRow}>
          <Icon name="fire" size={18} color="#FF9800" />
          <Text style={styles.streakText}>{progress.streak || 0} day streak</Text>
          <Text style={styles.streakDivider}>|</Text>
          <Icon name="book-plus" size={18} color="#2196F3" />
          <Text style={styles.streakText}>{progress.wordsLearned || 0} words</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {STAT_CARDS.map(s => {
          const val = progress[s.key] || 0;
          const level = getLevel(val);
          return (
            <View key={s.key} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '20' }]}>
                <Icon name={s.icon} size={22} color={s.color} />
              </View>
              <Text style={styles.statValue}>{val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={[styles.statLevel, { color: level.color }]}>{level.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.detailSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Sessions Completed</Text>
          <Text style={styles.detailValue}>{progress.totalSessions || 0}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Challenges Done</Text>
          <Text style={styles.detailValue}>{progress.challengesDone || 0}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Words Learned</Text>
          <Text style={styles.detailValue}>{progress.wordsLearned || 0}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Current Streak</Text>
          <Text style={styles.detailValue}>{progress.streak || 0} days</Text>
        </View>
        {progress.lastActive && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Active</Text>
            <Text style={styles.detailValue}>{new Date(progress.lastActive).toLocaleDateString()}</Text>
          </View>
        )}
      </View>

      {!insights && (
        <TouchableOpacity style={styles.insightBtn} onPress={getInsights}>
          <Icon name="lightbulb-on" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.insightBtnText}>Get AI Insights</Text>
        </TouchableOpacity>
      )}

      {insights && (
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>AI Insights</Text>
          <Text style={styles.insightSummary}>{insights.summary}</Text>
          {insights.strengthAreas?.length > 0 && (
            <>
              <Text style={styles.insightLabel}>Strengths</Text>
              {insights.strengthAreas.map((s, i) => <Text key={i} style={[styles.insightBullet, { color: '#4CAF50' }]}>+ {s}</Text>)}
            </>
          )}
          {insights.weakAreas?.length > 0 && (
            <>
              <Text style={styles.insightLabel}>To Focus On</Text>
              {insights.weakAreas.map((s, i) => <Text key={i} style={[styles.insightBullet, { color: '#FF9800' }]}>- {s}</Text>)}
            </>
          )}
          {insights.recommendations?.length > 0 && (
            <>
              <Text style={styles.insightLabel}>Recommendations</Text>
              {insights.recommendations.map((r, i) => (
                <View key={i} style={styles.recRow}>
                  <Icon name="arrow-right" size={14} color="#f57c00" style={{ marginRight: 6 }} />
                  <Text style={styles.recText}>{r}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' },
  overallCard: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#3A3A3A' },
  overallScore: { fontSize: 56, fontWeight: '700', color: '#f57c00' },
  overallLabel: { color: '#888', fontSize: 14, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  levelBadge: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  levelText: { fontSize: 13, fontWeight: '700' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakText: { color: '#ccc', fontSize: 13 },
  streakDivider: { color: '#555', marginHorizontal: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '31%', backgroundColor: '#2C2C2C', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#3A3A3A' },
  statIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 2 },
  statLevel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  detailSection: { backgroundColor: '#2C2C2C', borderRadius: 14, padding: 16, marginTop: 8, borderWidth: 1, borderColor: '#3A3A3A' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#3A3A3A' },
  detailLabel: { color: '#aaa', fontSize: 14 },
  detailValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  insightBtn: { flexDirection: 'row', backgroundColor: '#f57c00', height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  insightBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  insightCard: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 18, marginTop: 16, borderWidth: 1, borderColor: '#3A3A3A' },
  insightTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  insightSummary: { color: '#ccc', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  insightLabel: { color: '#aaa', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 10, marginBottom: 6 },
  insightBullet: { fontSize: 14, marginBottom: 4, marginLeft: 4 },
  recRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  recText: { color: '#ccc', fontSize: 13, flex: 1 },
});
