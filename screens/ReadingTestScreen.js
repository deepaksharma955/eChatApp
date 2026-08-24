import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform, Alert, FlatList } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Audio, Video } from 'expo-av';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { api, API_BASE } from '../api';
import AudioPlayer from '../components/AudioPlayer';
import TappableText from '../components/TappableText';

let CameraModule = null;
if (Platform.OS !== 'web') {
  try { CameraModule = require('expo-camera'); } catch {}
}

const LEVELS = ['beginner', 'intermediate', 'advanced'];

const FALLBACK_STORIES = {
  beginner: [
    { title: 'The Red Kite', text: 'Tom has a red kite. The wind blows hard. Tom runs in the park. The kite goes up high. It flies over the trees. A bird flies next to it. Tom laughs and pulls the string. The sun starts to set. Tom takes his kite home. He cannot wait to play again tomorrow.' },
    { title: 'A Cup of Tea', text: 'Grandma makes tea every morning. She boils the water first. Then she adds one spoon of leaves. The smell fills the kitchen. Mia sits at the table. Grandma pours two cups. They talk about the garden. The roses are blooming. Mia likes this time with her grandma. It is quiet and warm.' },
    { title: 'My Pet Cat', text: 'I have a small cat. Her name is Luna. She has soft white fur. Luna likes to sleep on my bed. She also likes to chase butterflies in the garden. Every morning she sits by the door. She wants to go outside. When I come home from school, she runs to me. She purrs loudly. I love my cat very much.' },
    { title: 'The Rainy Day', text: 'It was raining hard outside. Sam looked out the window. The street was full of water. Sam put on his boots. He jumped in every puddle. The water splashed everywhere. His mother watched from the door. She laughed and called him inside. Sam was wet but happy. He drank warm chocolate milk after that.' },
    { title: 'A Trip to the Zoo', text: 'Last Sunday my family went to the zoo. We saw many animals. The lions were sleeping under a tree. The monkeys were jumping from branch to branch. I liked the elephants the most. They were so big and gentle. A baby elephant played with a ball. We took many photos. It was the best day ever.' },
  ],
  intermediate: [
    { title: 'The Lost Wallet', text: 'On her way home, Sara noticed a wallet lying near the bus stop. She picked it up and looked inside. There was an ID card, some cash, and a photograph of a family. Instead of keeping it, she went to the police station two streets away. The officer thanked her and called the owner. Twenty minutes later, an old man arrived, worried and grateful. He offered Sara a reward, but she politely refused. Walking home, she felt lighter than before. Sometimes doing the right thing is its own reward.' },
    { title: 'The First Snow', text: 'The village had never seen snow, so when the first flakes fell, everyone rushed outside. Children caught snowflakes on their tongues while adults took photos with their phones. The mountains turned white overnight. School was cancelled, which made the children cheer even louder. By noon, someone had built a small snowman in the square, wearing a scarf and a carrot nose. Old Mr. Hassan watched from his window and remembered the winter he spent abroad fifty years ago. That evening, the whole village gathered for hot soup and stories.' },
    { title: 'The New Student', text: 'When Aisha walked into class on Monday, there was a new boy sitting by the window. His name was Carlos, and he had just moved from another city. During break, nobody talked to him, so Aisha decided to say hello. By lunch, they were sharing snacks and laughing about funny teachers. Carlos told her he was nervous about making friends. Aisha smiled and said he already had one. Sometimes a small hello can change someones whole day.' },
    { title: 'The Market Adventure', text: 'Ravi went to the market to buy vegetables for his mother. The market was loud and crowded. He bought tomatoes, onions, and fresh green chilies. On his way back, he saw an old woman struggling with heavy bags. Without thinking twice, he offered to carry them to her house. She thanked him with a big smile and gave him a fresh mango. Ravi walked home proud. Helping others always feels good.' },
    { title: 'The Mysterious Sound', text: 'Every night at exactly ten o clock, Priya heard a strange sound from the balcony. It was soft, like someone humming. One night she gathered her courage and crept outside. There, sitting on the railing, was a small owl with bright orange eyes. It tilted its head and hooted softly. Priya laughed with relief. From that night on, she left a small dish of water on the balcony for her nightly visitor.' },
  ],
  advanced: [
    { title: 'The Lighthouse Keeper\u2019s Diary', text: 'For forty years, Elias had kept the lighthouse on the northern cliff, and for forty years he had written a single page in his diary each night. The entries were rarely dramatic: the weather, the ships he had guided, the gulls he had fed. Yet within those mundane lines lived an entire life. When the automation crew finally arrived to replace him, they found shelves of diaries, each spine worn soft by handling. The youngest technician asked him whether he regretted spending his years alone. Elias looked out at the grey sea and smiled. "Alone?" he said. "I have spoken to every storm that ever passed." Some conversations, he believed, did not require an answer.' },
    { title: 'The Interview', text: 'Maya had rehearsed every possible question, yet the interviewer began with none of them. Instead, he asked her what she had failed at recently, and why it mattered to her. The room fell silent except for the hum of the air conditioner. She could have recited a polished answer about learning from mistakes, but something in his expression suggested patience rather than judgment. So she told the truth: a product launch that collapsed, a team that lost trust, and the uncomfortable months she spent rebuilding both. When she finished, he nodded slowly and said that honesty under pressure was rarer than any skill on her resume. Maya left the building unsure whether she had won the position, but certain she had won something else.' },
    { title: 'The Cartographer\u2019s Daughter', text: 'In the attic, behind boxes of forgotten Diwali decorations, Leena found a rolled-up map drawn in her grandfather\u2019s careful hand. Rivers were blue ink, mountains were tiny triangles, and every village had a small circle with a name she had never heard. She spent the entire afternoon tracing the route he had walked as a young surveyor, crossing valleys that no longer existed on any modern map. The paper smelled of dust and something faintly sweet, perhaps sandalwood. When her mother came upstairs, she sat beside Leena and said nothing for a long while. Then she pointed to a dot near the bottom and whispered, "That is where your grandmother and I first met." The map was not just geography; it was a love letter folded into the shape of a country.' },
    { title: 'The Last Bookshop', text: 'Amara was the last person to work in the old bookshop on River Street. Every morning she unlocked the wooden door, switched on the dim lamp, and breathed in the smell of aging paper and binding glue. Customers came less and less, but the ones who did were passionate. An elderly professor came every Thursday for detective novels. A teenager appeared each Saturday to read poetry without buying. One rainy evening, the landlord handed Amara a notice: the lease would not be renewed. She placed the notice between the pages of a Dickens novel and continued sweeping. Some things, she decided, are worth preserving even when the world says otherwise. She began cataloguing every book, photographing each cover, writing summaries. If the shop had to close, its memory would not.' },
  ],
};

export default function ReadingTestScreen() {
  const [level, setLevel] = useState('beginner');
  const [stories, setStories] = useState([...FALLBACK_STORIES.beginner]);
  const [story, setStory] = useState(FALLBACK_STORIES.beginner[0]);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [lessonListVisible, setLessonListVisible] = useState(true);

  const [videoMode, setVideoMode] = useState(false);
  const [camPerm, setCamPerm] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recorded, setRecorded] = useState(null);

  const [transcript, setTranscript] = useState('');
  const [needManual, setNeedManual] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const [history, setHistory] = useState([]);
  const [playingUri, setPlayingUri] = useState(null);

  const avRecRef = useRef(null);
  const cameraRef = useRef(null);
  const videoPromiseRef = useRef(null);
  const speechRecRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const soundRef = useRef(null);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);

  const passage = customMode ? customText.trim() : story.text;
  const passageTitle = customMode ? 'Custom passage' : story.title;

  useEffect(() => {
    loadHistory();
    return () => {
      stopTimer();
      if (soundRef.current) { try { soundRef.current.unloadAsync(); } catch {} }
      if (speechRecRef.current) { try { speechRecRef.current.stop(); } catch {} }
      if (mediaStreamRef.current) {
        try { mediaStreamRef.current.getTracks().forEach((t) => t.stop()); } catch {}
      }
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const loadHistory = () => {
    if (Platform.OS === 'web') return;
    try {
      const dir = new Directory(Paths.document, 'recordings', 'reading-test');
      if (!dir.exists) return;
      const indexFile = new File(dir, 'index.json');
      if (!indexFile.exists) return;
      let list = [];
      try { list = JSON.parse(indexFile.textSync()).sessions || []; } catch {}
      list = list.filter((r) => { try { return new File(r.uri).exists; } catch { return false; } });
      setHistory(list);
    } catch {}
  };

  const saveToHistory = async (uri, type) => {
    try {
      const dir = new Directory(Paths.document, 'recordings', 'reading-test');
      dir.create({ intermediates: true, idempotent: true });
      const extMatch = uri.match(/\.[a-z0-9]+$/i);
      const ext = extMatch ? extMatch[0] : type === 'video' ? '.mp4' : '.m4a';
      const name = `reading_${Date.now()}${ext}`;
      const src = new File(uri);
      const dest = new File(dir, name);
      src.copy(dest);
      const indexFile = new File(dir, 'index.json');
      let list = [];
      if (indexFile.exists) {
        try { list = JSON.parse(indexFile.textSync()).sessions || []; } catch {}
      }
      const entry = { uri: dest.uri, name, type, title: passageTitle, text: passage, createdAt: Date.now(), size: dest.size };
      list.unshift(entry);
      indexFile.write(JSON.stringify({ sessions: list }));
      setHistory(list);
      return entry;
    } catch (e) {
      console.error('Failed to save session:', e);
      return null;
    }
  };

  const generateStory = async () => {
    setGenerating(true);
    setResult(null);
    setRecorded(null);
    setTranscript('');
    try {
      const data = await api.post('/api/story', { level, topic: topic || undefined });
      if (data.text) {
        const newStory = { title: data.title || 'A Story', text: data.text };
        setStory(newStory);
        setStories((prev) => [newStory, ...prev.filter(s => s.title !== newStory.title)]);
      }
    } catch (_) {
      const bank = FALLBACK_STORIES[level];
      const pick = bank[Math.floor(Math.random() * bank.length)];
      setStory(pick);
    }
    setGenerating(false);
  };

  const generateMultipleStories = async () => {
    setGenerating(true);
    setResult(null);
    setRecorded(null);
    setTranscript('');
    try {
      const promises = Array.from({ length: 3 }, () =>
        api.post('/api/story', { level, topic: topic || undefined })
      );
      const results = await Promise.allSettled(promises);
      const newStories = results
        .filter(r => r.status === 'fulfilled' && r.value?.text)
        .map(r => ({ title: r.value.title || 'AI Story', text: r.value.text }));
      if (newStories.length > 0) {
        setStories(prev => [...newStories, ...prev]);
        setStory(newStories[0]);
      }
    } catch (_) {}
    setGenerating(false);
  };

  const changeLevel = (lv) => {
    setLevel(lv);
    setStories([...FALLBACK_STORIES[lv]]);
    setStory(FALLBACK_STORIES[lv][0]);
    setResult(null);
    setRecorded(null);
    setTranscript('');
  };

  const selectStory = (s) => {
    setStory(s);
    setResult(null);
    setRecorded(null);
    setTranscript('');
  };

  const ensureCameraPermission = async () => {
    if (!CameraModule) return false;
    if (camPerm?.granted) return true;
    try {
      const { status } = await CameraModule.Camera.requestCameraPermissionsAsync();
      const granted = status === 'granted';
      setCamPerm({ granted });
      if (!granted) Alert.alert('Camera needed', 'Allow camera access to record video of your reading.');
      return granted;
    } catch {
      return false;
    }
  };

  const startTimer = () => {
    setSeconds(0);
    startedAtRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
  };

  const startRecording = async () => {
    if (!passage) {
      Alert.alert('Nothing to read', 'Pick a story or enter your own text first.');
      return;
    }
    setResult(null);
    setRecorded(null);
    setTranscript('');
    setNeedManual(false);

    if (Platform.OS === 'web') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        Alert.alert('Not supported', 'Live speech recognition is not available in this browser.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      } catch (_) {}
      const rec = new SR();
      rec.lang = 'en-US';
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        let chunk = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) chunk += e.results[i][0].transcript + ' ';
        }
        if (chunk) setTranscript((prev) => (prev ? prev + ' ' : '') + chunk.trim());
      };
      rec.onerror = () => {};
      rec.onend = () => {};
      try { rec.start(); } catch {}
      speechRecRef.current = rec;
      setIsRecording(true);
      startTimer();
      return;
    }

    if (videoMode) {
      const ok = await ensureCameraPermission();
      if (!ok || !cameraRef.current) return;
      setIsRecording(true);
      startTimer();
      try {
        videoPromiseRef.current = cameraRef.current.recordAsync({ maxDuration: 600 });
      } catch (e) {
        setIsRecording(false);
        stopTimer();
        Alert.alert('Error', 'Could not start video recording.');
      }
      return;
    }

    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      avRecRef.current = recording;
      setIsRecording(true);
      startTimer();
    } catch (e) {
      Alert.alert('Microphone needed', 'Allow microphone access to record your reading.');
    }
  };

  const stopRecording = async () => {
    stopTimer();
    const dur = Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000));

    if (Platform.OS === 'web') {
      try { speechRecRef.current?.stop(); } catch {}
      try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
      mediaStreamRef.current = null;
      speechRecRef.current = null;
      setIsRecording(false);
      if (!transcript.trim()) setNeedManual(true);
      return;
    }

    if (videoMode) {
      setIsRecording(false);
      try { cameraRef.current?.stopRecording(); } catch {}
      try {
        const data = await videoPromiseRef.current;
        videoPromiseRef.current = null;
        if (data?.uri) {
          const entry = await saveToHistory(data.uri, 'video');
          setRecorded({ uri: data.uri, type: 'video', dur, entry });
        }
      } catch (_) {
        Alert.alert('Error', 'Video recording failed.');
      }
      return;
    }

    setIsRecording(false);
    try {
      const rec = avRecRef.current;
      avRecRef.current = null;
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      try { await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }); } catch {}
      if (uri) {
        const entry = await saveToHistory(uri, 'audio');
        setRecorded({ uri, type: 'audio', dur, entry });
      }
    } catch (_) {}
  };

  const transcribeUpload = async (uri, type) => {
    const name = type === 'video' ? 'reading.mp4' : 'reading.m4a';
    const mime = type === 'video' ? 'video/mp4' : 'audio/mp4';
    const form = new FormData();
    form.append('audio', { uri, name, type: mime });
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 90000);
    try {
      const res = await fetch(`${API_BASE}/api/transcribe`, { method: 'POST', body: form, signal: controller.signal });
      clearTimeout(id);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      return data.transcript || '';
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  };

  const analyze = async () => {
    if (!passage) return;
    setAnalyzing(true);
    try {
      let tr = transcript;

      if (Platform.OS !== 'web' && !tr.trim()) {
        if (recorded?.uri) {
          try {
            tr = await transcribeUpload(recorded.uri, recorded.type);
            setTranscript(tr);
          } catch (_) {
            setNeedManual(true);
            setAnalyzing(false);
            Alert.alert('Auto-transcribe unavailable', 'Type or paste what you read below, then tap Analyze again.');
            return;
          }
        } else {
          setNeedManual(true);
          setAnalyzing(false);
          return;
        }
      }

      if (!tr.trim()) {
        setNeedManual(true);
        setAnalyzing(false);
        return;
      }

      const data = await api.post('/api/reading-test', {
        passage,
        transcript: tr,
        durationSec: recorded?.dur || seconds || undefined,
      });
      setResult(data);
      if (recorded?.entry && data.score != null) updateHistoryScore(recorded.entry.uri, data.score);
    } catch (e) {
      setResult({ error: e.message });
    }
    setAnalyzing(false);
  };

  const updateHistoryScore = (uri, score) => {
    setHistory((prev) => {
      const next = prev.map((h) => (h.uri === uri ? { ...h, score } : h));
      try {
        const dir = new Directory(Paths.document, 'recordings', 'reading-test');
        new File(dir, 'index.json').write(JSON.stringify({ sessions: next }));
      } catch {}
      return next;
    });
  };

  const stopPlayback = async () => {
    if (soundRef.current) { try { await soundRef.current.unloadAsync(); } catch {} soundRef.current = null; }
    setPlayingUri(null);
  };

  const playItem = async (item) => {
    if (playingUri === item.uri) { await stopPlayback(); return; }
    await stopPlayback();
    if (item.type === 'video') { setPlayingUri(item.uri); return; }
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: item.uri });
      soundRef.current = sound;
      setPlayingUri(item.uri);
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.didJustFinish) {
          setPlayingUri(null);
          try { sound.unloadAsync(); } catch {}
          soundRef.current = null;
        }
      });
      await sound.playAsync();
    } catch { await stopPlayback(); }
  };

  const shareItem = async (item) => {
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) return;
      await Sharing.shareAsync(item.uri, {
        mimeType: item.type === 'video' ? 'video/mp4' : 'audio/mp4',
        dialogTitle: item.name,
      });
    } catch {}
  };

  const deleteItem = async (item) => {
    if (playingUri === item.uri) await stopPlayback();
    try { new File(item.uri).delete(); } catch {}
    const next = history.filter((h) => h.uri !== item.uri);
    setHistory(next);
    try {
      const dir = new Directory(Paths.document, 'recordings', 'reading-test');
      new File(dir, 'index.json').write(JSON.stringify({ sessions: next }));
    } catch {}
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const formatBytes = (b) => {
    if (!b) return '';
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  };

  const scoreColor = (score) => (score > 80 ? '#4CAF50' : score > 60 ? '#FF9800' : '#F44336');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.levelRow}>
        {LEVELS.map((lv) => (
          <TouchableOpacity key={lv} style={[styles.levelChip, level === lv && styles.levelChipActive]} onPress={() => changeLevel(lv)}>
            <Text style={[styles.levelText, level === lv && styles.levelTextActive]}>{lv.charAt(0).toUpperCase() + lv.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.lessonHeaderRow}>
        <Text style={styles.lessonHeaderText}>Lessons ({stories.length})</Text>
        <View style={styles.lessonHeaderActions}>
          <TouchableOpacity style={styles.genStoryBtn} onPress={generateStory} disabled={generating}>
            {generating ? <ActivityIndicator size="small" color="#fff" /> : (
              <><Icon name="refresh" size={14} color="#fff" /><Text style={styles.genStoryBtnText}>1 New</Text></>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.genStoryBtn, { backgroundColor: '#4CAF50' }]} onPress={generateMultipleStories} disabled={generating}>
            {generating ? <ActivityIndicator size="small" color="#fff" /> : (
              <><Icon name="creation" size={14} color="#fff" /><Text style={styles.genStoryBtnText}>3 AI</Text></>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={styles.topicInputFull}
        value={topic}
        onChangeText={setTopic}
        placeholder="Enter a topic for AI stories (optional)"
        placeholderTextColor="#888"
      />

      <View style={styles.lessonList}>
        {stories.map((s, i) => {
          const isSelected = !customMode && story.title === s.title && story.text === s.text;
          return (
            <TouchableOpacity
              key={`${s.title}-${i}`}
              style={[styles.lessonCard, isSelected && styles.lessonCardActive]}
              onPress={() => { selectStory(s); setLessonListVisible(true); }}
            >
              <View style={styles.lessonCardLeft}>
                <View style={[styles.lessonNum, isSelected && styles.lessonNumActive]}>
                  <Text style={[styles.lessonNumText, isSelected && styles.lessonNumTextActive]}>{i + 1}</Text>
                </View>
                <View style={styles.lessonCardInfo}>
                  <Text style={[styles.lessonCardTitle, isSelected && styles.lessonCardTitleActive]} numberOfLines={1}>{s.title}</Text>
                  <Text style={styles.lessonCardPreview} numberOfLines={2}>{s.text}</Text>
                </View>
              </View>
              {isSelected && <Icon name="check-circle" size={20} color="#f57c00" />}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.modeToggle} onPress={() => { setCustomMode(!customMode); setResult(null); }}>
        <Icon name={customMode ? 'book-open-variant' : 'pencil'} size={16} color="#f57c00" />
        <Text style={styles.modeToggleText}>{customMode ? 'Use story library' : 'Write my own passage'}</Text>
      </TouchableOpacity>

      {customMode && (
        <View style={styles.storyCard}>
          <Text style={styles.storyTitle}>Your own passage</Text>
          <TextInput
            style={[styles.customInput]}
            value={customText}
            onChangeText={(t) => { setCustomText(t); setResult(null); }}
            placeholder="Paste or type a paragraph to read..."
            placeholderTextColor="#888"
            multiline
            textAlignVertical="top"
          />
        </View>
      )}

      {!customMode && (
        <View style={styles.storyCard}>
          <View style={styles.storyHeader}>
            <Icon name="book-open-page-variant" size={20} color="#f57c00" />
            <Text style={styles.storyTitle}>{story.title}</Text>
          </View>
          <TappableText text={story.text} style={styles.passage} />
        </View>
      )}

      {Platform.OS !== 'web' && (
        <TouchableOpacity
          style={[styles.modeToggle, videoMode && styles.modeToggleActive]}
          onPress={async () => {
            if (!videoMode) {
              const ok = await ensureCameraPermission();
              if (!ok) return;
            }
            setVideoMode(!videoMode);
          }}
        >
          <Icon name={videoMode ? 'video' : 'video-off'} size={16} color={videoMode ? '#fff' : '#f57c00'} />
          <Text style={[styles.modeToggleText, videoMode && { color: '#fff' }]}>
            {videoMode ? 'Video recording ON (camera + mic)' : 'Record video too?'}
          </Text>
        </TouchableOpacity>
      )}

      {videoMode && Platform.OS !== 'web' && camPerm?.granted && (
        <View style={styles.cameraWrap}>
          <CameraModule.CameraView ref={cameraRef} style={styles.camera} facing="front" mode="video" videoQuality="480p" mute={false} />
          {isRecording && (
            <View style={styles.recBadge}>
              <View style={styles.recDot} />
              <Text style={styles.recBadgeText}>REC {formatTime(seconds)}</Text>
            </View>
          )}
        </View>
      )}

      {!videoMode && isRecording && (
        <View style={styles.audioRecBar}>
          <View style={styles.recDot} />
          <Text style={styles.recBadgeText}>Recording... {formatTime(seconds)}</Text>
          <Icon name="microphone" size={18} color="#fff" />
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.recordBtn, isRecording && styles.stopBtn]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Icon name={isRecording ? 'stop-circle' : videoMode ? 'video' : 'microphone'} size={20} color="#fff" />
          <Text style={styles.recordBtnText}>{isRecording ? 'Stop' : videoMode ? 'Start Video Read' : 'Start Reading'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.analyzeBtn, analyzing && { opacity: 0.7 }]} onPress={analyze} disabled={analyzing || !passage}>
          {analyzing ? <ActivityIndicator size="small" color="#fff" /> : (
            <><Icon name="chart-bell-curve" size={20} color="#fff" style={{ marginRight: 6 }} /><Text style={styles.analyzeBtnText}>Analyze</Text></>
          )}
        </TouchableOpacity>
      </View>

      {(needManual || (Platform.OS === 'web' && transcript)) && (
        <View style={{ marginTop: 14 }}>
          <Text style={styles.label}>What you read (edit if needed)</Text>
          <TextInput
            style={styles.input}
            value={transcript}
            onChangeText={setTranscript}
            placeholder="Type what you read..."
            placeholderTextColor="#888"
            multiline
            textAlignVertical="top"
          />
        </View>
      )}

      {recorded && !isRecording && (
        <View style={{ marginTop: 12 }}>
          <View style={styles.savedBar}>
            <Icon name={recorded.type === 'video' ? 'video' : 'microphone'} size={18} color="#4CAF50" />
            <Text style={styles.savedText}>
              {recorded.type === 'video' ? 'Video' : 'Audio'} saved ({formatTime(recorded.dur)})
            </Text>
          </View>
          {recorded.type === 'audio' && (
            <AudioPlayer uri={recorded.uri} color="#4CAF50" />
          )}
          {recorded.type === 'video' && (
            <TouchableOpacity style={[styles.playSmall, { marginTop: 8 }]} onPress={() => playItem({ uri: recorded.uri, type: recorded.type })}>
              <Icon name={playingUri === recorded.uri ? 'stop' : 'play'} size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {playingUri && recorded?.type === 'video' && playingUri === recorded.uri && (
        <View style={styles.videoPlayerWrap}>
          <Video source={{ uri: playingUri }} style={styles.videoPlayer} useNativeControls resizeMode="contain" shouldPlay onPlaybackStatusUpdate={(s) => { if (s.didJustFinish) setPlayingUri(null); }} />
        </View>
      )}

      {result && !result.error && (
        <View style={styles.resultSection}>
          <View style={styles.bigScore}>
            <Text style={[styles.bigScoreValue, { color: scoreColor(result.score) }]}>{result.score ?? '--'}</Text>
            <Text style={styles.bigScoreLabel}>Reading Score</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{result.accuracy != null ? `${result.accuracy}%` : '--'}</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{result.wpm != null ? result.wpm : '--'}</Text>
              <Text style={styles.statLabel}>Words/min</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{result.expression != null ? result.expression : '--'}</Text>
              <Text style={styles.statLabel}>Expression</Text>
            </View>
          </View>

          {result.feedback && <Text style={styles.feedbackText}>{result.feedback}</Text>}

          {result.missedWords?.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Skipped / misread words</Text>
              <View style={styles.wordRow}>
                {result.missedWords.map((w, i) => (
                  <View key={`m${i}`} style={[styles.wordChip, { backgroundColor: 'rgba(244,67,54,0.15)' }]}>
                    <Text style={[styles.wordChipText, { color: '#F44336' }]}>{w}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {result.extraWords?.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Added by mistake</Text>
              <View style={styles.wordRow}>
                {result.extraWords.map((w, i) => (
                  <View key={`e${i}`} style={[styles.wordChip, { backgroundColor: 'rgba(255,152,0,0.15)' }]}>
                    <Text style={[styles.wordChipText, { color: '#FF9800' }]}>{w}</Text>
                  </View>
                ))}
              </View>
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
        </View>
      )}

      {result?.error && (
        <View style={styles.errorBox}><Text style={styles.errorText}>{result.error}</Text></View>
      )}

      {Platform.OS !== 'web' && history.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Icon name="history" size={18} color="#f57c00" style={{ marginRight: 8 }} />
            <Text style={styles.historyTitle}>My Reading Sessions</Text>
          </View>
          {history.map((item) => (
            <View key={item.uri} style={styles.histItem}>
              <Icon name={item.type === 'video' ? 'video' : 'microphone'} size={18} color="#f57c00" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.histName} numberOfLines={1}>{item.title || item.name}</Text>
                <Text style={styles.histMeta}>
                  {new Date(item.createdAt).toLocaleString()}
                  {item.size ? ` \u2022 ${formatBytes(item.size)}` : ''}
                  {item.score != null ? ` \u2022 Score ${item.score}` : ''}
                </Text>
              </View>
              {item.type === 'video' && playingUri === item.uri ? (
                <TouchableOpacity style={styles.recBtn} onPress={stopPlayback}>
                  <Icon name="stop" size={18} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.recBtn} onPress={() => playItem(item)}>
                  <Icon name={playingUri === item.uri ? 'stop' : 'play'} size={18} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.recBtn} onPress={() => shareItem(item)}>
                <Icon name="download" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.recBtn, { backgroundColor: '#F44336' }]} onPress={() => deleteItem(item)}>
                <Icon name="delete" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {playingUri && history.some((h) => h.uri === playingUri && h.type === 'video') && (
        <View style={styles.videoPlayerWrap}>
          <Video source={{ uri: playingUri }} style={styles.videoPlayer} useNativeControls resizeMode="contain" shouldPlay onPlaybackStatusUpdate={(s) => { if (s.didJustFinish) setPlayingUri(null); }} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  content: { padding: 16, paddingBottom: 40 },
  levelRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  levelChip: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#2C2C2C', borderWidth: 1, borderColor: '#3A3A3A', alignItems: 'center' },
  levelChipActive: { backgroundColor: '#f57c00', borderColor: '#f57c00' },
  levelText: { color: '#aaa', fontWeight: '600', fontSize: 13, textTransform: 'capitalize' },
  levelTextActive: { color: '#fff' },
  lessonHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  lessonHeaderText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  lessonHeaderActions: { flexDirection: 'row', gap: 8 },
  genStoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f57c00', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  genStoryBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  topicInputFull: { backgroundColor: '#2C2C2C', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#3A3A3A', marginBottom: 12 },
  lessonList: { gap: 8, marginBottom: 12 },
  lessonCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#3A3A3A' },
  lessonCardActive: { borderColor: '#f57c00', backgroundColor: 'rgba(245,124,0,0.08)' },
  lessonCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  lessonNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#3A3A3A', justifyContent: 'center', alignItems: 'center' },
  lessonNumActive: { backgroundColor: '#f57c00' },
  lessonNumText: { color: '#888', fontWeight: '700', fontSize: 13 },
  lessonNumTextActive: { color: '#fff' },
  lessonCardInfo: { flex: 1 },
  lessonCardTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  lessonCardTitleActive: { color: '#f57c00' },
  lessonCardPreview: { color: '#888', fontSize: 12, lineHeight: 16 },
  storyCard: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#3A3A3A', marginTop: 8 },
  storyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  storyTitle: { color: '#f57c00', fontSize: 17, fontWeight: '700' },
  passage: { color: '#fff', fontSize: 16, lineHeight: 26 },
  customInput: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, minHeight: 120, borderWidth: 1, borderColor: '#3A3A3A', textAlignVertical: 'top', marginTop: 10, lineHeight: 24 },
  modeToggle: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(245,124,0,0.12)', borderWidth: 1, borderColor: 'rgba(245,124,0,0.35)' },
  modeToggleActive: { backgroundColor: '#f57c00' },
  modeToggleText: { color: '#f57c00', fontSize: 13, fontWeight: '600' },
  cameraWrap: { marginTop: 14, borderRadius: 16, overflow: 'hidden', height: 220, backgroundColor: '#000' },
  camera: { flex: 1 },
  recBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, gap: 6 },
  recDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#F44336' },
  recBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  audioRecBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, backgroundColor: '#F44336', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16 },
  actionRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  recordBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F44336', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, gap: 6 },
  stopBtn: { backgroundColor: '#B71C1C' },
  recordBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  analyzeBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#f57c00', height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  analyzeBtnText: { fontWeight: '700', color: '#fff', fontSize: 15 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#2C2C2C', borderRadius: 14, padding: 16, color: '#fff', fontSize: 15, minHeight: 90, borderWidth: 1, borderColor: '#3A3A3A', textAlignVertical: 'top' },
  savedBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: 'rgba(76,175,80,0.12)', borderWidth: 1, borderColor: 'rgba(76,175,80,0.4)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  savedText: { color: '#4CAF50', fontWeight: '600', fontSize: 13, flex: 1 },
  playSmall: { backgroundColor: '#4CAF50', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  videoPlayerWrap: { marginTop: 12, borderRadius: 16, overflow: 'hidden', height: 230, backgroundColor: '#000' },
  videoPlayer: { flex: 1 },
  resultSection: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 18, marginTop: 20, borderWidth: 1, borderColor: '#3A3A3A' },
  bigScore: { alignItems: 'center', paddingVertical: 14, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#3A3A3A' },
  bigScoreValue: { fontSize: 52, fontWeight: '700' },
  bigScoreLabel: { color: '#aaa', fontSize: 13, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: { flex: 1, backgroundColor: '#1E1E1E', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  feedbackText: { color: '#ddd', fontSize: 14, lineHeight: 21 },
  sectionLabel: { color: '#aaa', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 6 },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wordChip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  wordChipText: { fontSize: 13, fontWeight: '600' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  tipText: { color: '#ccc', fontSize: 13, flex: 1, lineHeight: 18 },
  errorBox: { backgroundColor: '#2C2C2C', borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#F44336' },
  errorText: { color: '#F44336', fontSize: 14 },
  historySection: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 18, marginTop: 20, borderWidth: 1, borderColor: '#3A3A3A' },
  historyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  historyTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  histItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#3A3A3A' },
  histName: { color: '#fff', fontSize: 14 },
  histMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  recBtn: { backgroundColor: '#f57c00', width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});
