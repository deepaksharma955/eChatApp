import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { api } from '../api';

export default function VocabularyScreen() {
  const [wordData, setWordData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [savedWords, setSavedWords] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);

  const fetchWord = async () => {
    setLoading(true);
    setQuiz(null);
    setQuizAnswer(null);
    setShowQuiz(false);
    try {
      const data = await api.get('/api/vocabulary');
      setWordData(data);
    } catch {
      setWordData({ word: 'Offline', definition: 'Server unreachable — check connection', pronunciation: '', example: '', partOfSpeech: '' });
    }
    setLoading(false);
  };

  useEffect(() => { fetchWord(); }, []);

  const fetchQuiz = async () => {
    if (!wordData?.word) return;
    setLoading(true);
    try {
      const data = await api.post('/api/vocabulary/quiz', { word: wordData.word });
      setQuiz(data);
      setQuizAnswer(null);
      setShowQuiz(true);
    } catch {}
    setLoading(false);
  };

  const saveWord = () => {
    if (!wordData || savedWords.find(w => w.word === wordData.word)) return;
    setSavedWords(prev => [wordData, ...prev]);
  };

  const speakWord = () => {
    if (Platform.OS === 'web' && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(wordData.word);
      u.lang = 'en-US';
      u.rate = 0.7;
      window.speechSynthesis.speak(u);
    } else {
      Speech.speak(wordData.word, { language: 'en-US', rate: 0.7 });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.refreshBtn} onPress={fetchWord} disabled={loading}>
        <Icon name="shuffle-variant" size={18} color="#f57c00" />
        <Text style={styles.refreshBtnText}>New Word</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#f57c00" style={{ marginTop: 40 }} />}

      {wordData && !loading && (
        <View style={styles.wordCard}>
          <View style={styles.wordHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.wordRow}>
                <Text style={styles.word}>{wordData.word}</Text>
                <TouchableOpacity onPress={speakWord} style={styles.speakBtn}>
                  <Icon name="volume-high" size={22} color="#f57c00" />
                </TouchableOpacity>
              </View>
              <Text style={styles.pronunciation}>{wordData.pronunciation || ''}</Text>
            </View>
            <TouchableOpacity onPress={saveWord} style={styles.saveBtn}>
              <Icon name={savedWords.find(w => w.word === wordData.word) ? 'bookmark' : 'bookmark-outline'} size={24} color={savedWords.find(w => w.word === wordData.word) ? '#f57c00' : '#888'} />
            </TouchableOpacity>
          </View>

          <View style={styles.partRow}>
            <View style={styles.partBadge}><Text style={styles.partText}>{wordData.partOfSpeech || 'word'}</Text></View>
          </View>

          <Text style={styles.definition}>{wordData.definition}</Text>

          <Text style={styles.exampleTitle}>Example</Text>
          <View style={styles.exampleBox}>
            <Text style={styles.exampleText}>"{wordData.example}"</Text>
          </View>

          {wordData.synonyms?.length > 0 && (
            <>
              <Text style={styles.synonymsTitle}>Synonyms</Text>
              <View style={styles.synonymRow}>
                {wordData.synonyms.map((s, i) => (
                  <View key={i} style={styles.synonymChip}><Text style={styles.synonymText}>{s}</Text></View>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity style={styles.quizBtn} onPress={fetchQuiz}>
            <Icon name="head-question-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.quizBtnText}>Take Quiz</Text>
          </TouchableOpacity>
        </View>
      )}

      {showQuiz && quiz && (
        <View style={styles.quizCard}>
          <Text style={styles.quizQuestion}>{quiz.question}</Text>
          {quiz.options?.map((opt, i) => {
            const isCorrect = quizAnswer !== null && i === quiz.correctIndex;
            const isWrong = quizAnswer === i && i !== quiz.correctIndex;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.quizOption, quizAnswer !== null && i === quiz.correctIndex && styles.quizOptionCorrect, isWrong && styles.quizOptionWrong]}
                onPress={() => setQuizAnswer(i)}
                disabled={quizAnswer !== null}
              >
                <Text style={[styles.quizOptionText, quizAnswer !== null && i === quiz.correctIndex && { color: '#4CAF50' }, isWrong && { color: '#F44336' }]}>{opt}</Text>
                {quizAnswer !== null && i === quiz.correctIndex && <Icon name="check-circle" size={18} color="#4CAF50" />}
                {isWrong && <Icon name="close-circle" size={18} color="#F44336" />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {savedWords.length > 0 && (
        <View style={styles.savedSection}>
          <Text style={styles.savedTitle}>Saved Words ({savedWords.length})</Text>
          {savedWords.map((w, i) => (
            <View key={i} style={styles.savedItem}>
              <Text style={styles.savedWord}>{w.word}</Text>
              <Text style={styles.savedDef}>{w.definition}</Text>
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
  wordCard: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#3A3A3A' },
  wordHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  word: { color: '#fff', fontSize: 28, fontWeight: '700' },
  speakBtn: { padding: 4 },
  pronunciation: { color: '#888', fontSize: 15, marginTop: 4 },
  saveBtn: { padding: 4 },
  partRow: { flexDirection: 'row', marginTop: 10, marginBottom: 14 },
  partBadge: { backgroundColor: 'rgba(245,124,0,0.15)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  partText: { color: '#f57c00', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  definition: { color: '#ddd', fontSize: 16, lineHeight: 24, marginBottom: 16 },
  exampleTitle: { color: '#aaa', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  exampleBox: { backgroundColor: '#1E1E1E', borderRadius: 10, padding: 14, marginBottom: 16 },
  exampleText: { color: '#bbb', fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  synonymsTitle: { color: '#aaa', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  synonymRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  synonymChip: { backgroundColor: '#1E1E1E', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  synonymText: { color: '#2196F3', fontSize: 13 },
  quizBtn: { flexDirection: 'row', backgroundColor: '#f57c00', height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  quizBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  quizCard: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 18, marginTop: 16, borderWidth: 1, borderColor: '#3A3A3A' },
  quizQuestion: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 14 },
  quizOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#3A3A3A' },
  quizOptionCorrect: { borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.1)' },
  quizOptionWrong: { borderColor: '#F44336', backgroundColor: 'rgba(244,67,54,0.1)' },
  quizOptionText: { flex: 1, color: '#ccc', fontSize: 14 },
  savedSection: { marginTop: 24 },
  savedTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  savedItem: { backgroundColor: '#2C2C2C', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#3A3A3A' },
  savedWord: { color: '#f57c00', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  savedDef: { color: '#aaa', fontSize: 13 },
});
