import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const FEATURES = [
  { key: 'Grammar', icon: 'check-underline', color: '#4CAF50', label: 'Grammar Correction', desc: 'Fix grammar in real-time' },
  { key: 'AIChat', icon: 'robot-happy', color: '#2196F3', label: 'AI Conversation', desc: 'Chat with AI 24/7' },
  { key: 'Speaking', icon: 'microphone', color: '#FF9800', label: 'Speaking Coach', desc: 'Practice spoken English' },
  { key: 'Pronunciation', icon: 'waveform', color: '#9C27B0', label: 'Pronunciation', desc: 'Score your pronunciation' },
  { key: 'Vocabulary', icon: 'book-open-variant', color: '#E91E63', label: 'Daily Vocabulary', desc: 'Learn new words daily' },
  { key: 'Translation', icon: 'translate', color: '#00BCD4', label: 'Translation', desc: 'Translate any text' },
  { key: 'Challenges', icon: 'trophy', color: '#FF5722', label: 'Challenges', desc: 'Daily English tasks' },
  { key: 'Progress', icon: 'chart-line', color: '#3F51B5', label: 'Progress', desc: 'Track your growth' },
  { key: 'VoiceChat', icon: 'phone-voice', color: '#009688', label: 'Voice Chat', desc: 'Talk with partners' },
  { key: 'VideoCall', icon: 'video', color: '#F44336', label: 'Video Calling', desc: 'Face-to-face practice' },
];

export default function AIFeaturesScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Icon name="lightbulb-on" size={40} color="#f57c00" />
        <Text style={styles.title}>AI Learning Tools</Text>
        <Text style={styles.subtitle}>Powered by AI — practice English smarter</Text>
      </View>

      <View style={styles.grid}>
        {FEATURES.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => {
              const screenMap = {
                Grammar: 'Grammar',
                AIChat: 'AIChat',
                Speaking: 'SpeakingCoach',
                Pronunciation: 'Pronunciation',
                Vocabulary: 'Vocabulary',
                Translation: 'Translation',
                Challenges: 'Challenges',
                Progress: 'Progress',
                VoiceChat: 'VoiceChat',
                VideoCall: 'VideoCall',
              };
              navigation.navigate(screenMap[f.key]);
            }}
          >
            <View style={[styles.iconWrap, { backgroundColor: f.color + '20' }]}>
              <Icon name={f.icon} size={28} color={f.color} />
            </View>
            <Text style={styles.cardLabel}>{f.label}</Text>
            <Text style={styles.cardDesc}>{f.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: 24 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 12 },
  subtitle: { color: '#888', fontSize: 14, marginTop: 6, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%', backgroundColor: '#2C2C2C', borderRadius: 16, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: '#3A3A3A',
  },
  iconWrap: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardLabel: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardDesc: { color: '#888', fontSize: 12, lineHeight: 16 },
});
