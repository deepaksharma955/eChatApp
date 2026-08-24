import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform, Alert, Animated as RNAnimated } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, withDelay, Easing } from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import { api } from '../api';

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const SENT_RE = /[.!?\u201D]\s+/;
const PARA_RE = /\n\s*\n/;

const FALLBACK = {
  beginner: [
    { title: 'The Red Kite', text: 'Tom has a red kite. The wind blows hard. Tom runs in the park. The kite goes up high. It flies over the trees. A bird flies next to it. Tom laughs and pulls the string. The sun starts to set. Tom takes his kite home. He cannot wait to play again tomorrow.' },
    { title: 'A Cup of Tea', text: 'Grandma makes tea every morning. She boils the water first. Then she adds one spoon of leaves. The smell fills the kitchen. Mia sits at the table. Grandma pours two cups. They talk about the garden. The roses are blooming. Mia likes this time with her grandma. It is quiet and warm.' },
  ],
  intermediate: [
    { title: 'The Lost Wallet', text: 'On her way home, Sara noticed a wallet lying near the bus stop. She picked it up and looked inside. There was an ID card, some cash, and a photograph of a family. Instead of keeping it, she went to the police station two streets away. The officer thanked her and called the owner. Twenty minutes later, an old man arrived, worried and grateful. He offered Sara a reward, but she politely refused. Walking home, she felt lighter than before. Sometimes doing the right thing is its own reward.' },
  ],
  advanced: [
    { title: 'The Interview', text: 'Maya had rehearsed every possible question, yet the interviewer began with none of them. Instead, he asked her what she had failed at recently, and why it mattered to her. The room fell silent except for the hum of the air conditioner. She could have recited a polished answer about learning from mistakes, but something in his expression suggested patience rather than judgment. So she told the truth: a product launch that collapsed, a team that lost trust, and the uncomfortable months she spent rebuilding both. When she finished, he nodded slowly and said that honesty under pressure was rarer than any skill on her resume. Maya left the building unsure whether she had won the position, but certain she had won something else.' },
  ],
};

const AGENTS = [
  { id: 'narrator', name: 'Narrator', color: '#4CAF50', icon: 'book-open-page-variant', pitch: 1.0, rate: 0.88 },
  { id: 'male', name: 'Male Voice', color: '#2196F3', icon: 'account', pitch: 0.85, rate: 1.0 },
  { id: 'female', name: 'Female Voice', color: '#E91E63', icon: 'account-heart', pitch: 1.15, rate: 1.0 },
  { id: 'child', name: 'Child Voice', color: '#FF9800', icon: 'account-star', pitch: 1.3, rate: 1.05 },
];

function SoundWave({ color, active }) {
  const bars = useRef(Array.from({ length: 5 }, () => new RNAnimated.Value(0.3))).current;
  useEffect(() => {
    if (active) {
      const anims = bars.map((v, i) => RNAnimated.loop(RNAnimated.sequence([
        RNAnimated.delay(i * 100),
        RNAnimated.timing(v, { toValue: 1, duration: 250 + Math.random() * 250, useNativeDriver: false }),
        RNAnimated.timing(v, { toValue: 0.3, duration: 250 + Math.random() * 250, useNativeDriver: false }),
      ])));
      anims.forEach(a => a.start());
      return () => anims.forEach(a => a.stop());
    }
    bars.forEach(v => v.setValue(0.3));
  }, [active]);
  return (
    <View style={st.waveWrap}>
      {bars.map((v, i) => (
        <RNAnimated.View key={i} style={[st.waveBar, { backgroundColor: color, transform: [{ scaleY: v }] }]} />
      ))}
    </View>
  );
}

function Particle({ color, idx }) {
  const op = useSharedValue(0), tx = useSharedValue(0), ty = useSharedValue(0), sc = useSharedValue(0);
  useEffect(() => {
    const d = idx * 150;
    op.value = withDelay(d, withRepeat(withSequence(withTiming(0.7, { duration: 300 }), withTiming(0, { duration: 700 })), -1, false));
    tx.value = withDelay(d, withRepeat(withTiming((Math.random() - 0.5) * 140, { duration: 1200 + Math.random() * 800 }), -1, true));
    ty.value = withDelay(d, withRepeat(withTiming(-50 - Math.random() * 70, { duration: 1200 + Math.random() * 800 }), -1, true));
    sc.value = withDelay(d, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.2, { duration: 800 })), -1, false));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: sc.value }],
  }));
  return <Animated.View style={[st.particle, { backgroundColor: color }, style]} />;
}

function AnimatedAgent({ agent, isPlaying }) {
  const c = agent.color;
  const scale = useSharedValue(1);
  const glowOp = useSharedValue(0);
  const ringSc = useSharedValue(1);
  const lipSc = useSharedValue(1);
  const breathSc = useSharedValue(1);

  useEffect(() => {
    if (isPlaying) {
      scale.value = withSequence(withTiming(0, { duration: 150 }), withTiming(1.15, { duration: 350, easing: Easing.out(Easing.back(2.5)) }), withTiming(1, { duration: 200 }));
      glowOp.value = withRepeat(withSequence(withTiming(0.8, { duration: 600 }), withTiming(0.15, { duration: 600 })), -1, false);
      ringSc.value = withRepeat(withSequence(withTiming(1.5, { duration: 800 }), withTiming(1, { duration: 800 })), -1, false);
      lipSc.value = withRepeat(withSequence(withTiming(1.2, { duration: 180 }), withTiming(0.85, { duration: 180 })), -1, false);
      breathSc.value = withRepeat(withSequence(withTiming(1.04, { duration: 1200 }), withTiming(0.97, { duration: 1200 })), -1, false);
    } else {
      scale.value = withTiming(1, { duration: 300 });
      glowOp.value = withTiming(0, { duration: 300 });
      ringSc.value = withTiming(1, { duration: 300 });
      lipSc.value = withTiming(1, { duration: 200 });
      breathSc.value = withTiming(1, { duration: 300 });
    }
  }, [isPlaying]);

  const avS = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { scaleY: breathSc.value }] }));
  const glS = useAnimatedStyle(() => ({ opacity: glowOp.value, transform: [{ scale: ringSc.value }] }));
  const lipS = useAnimatedStyle(() => ({ transform: [{ scaleY: lipSc.value }] }));

  return (
    <View style={st.stageOuter}>
      <View style={st.stageBg}>
        <Animated.View style={[st.glow, { backgroundColor: c + '25' }, glS]} />
        <Animated.View style={[st.ring, { borderColor: c + '50' }, glS]} />
        {isPlaying && Array.from({ length: 10 }, (_, i) => <Particle key={i} color={c} idx={i} />)}
        <Animated.View style={[st.agentCircle, { backgroundColor: c + '18', borderColor: c }, avS]}>
          <Animated.View style={lipS}>
            <Icon name={agent.icon} size={56} color={c} />
          </Animated.View>
          {isPlaying && <SoundWave color={c} active={isPlaying} />}
        </Animated.View>
      </View>
      <Text style={[st.stageName, { color: c }]}>{agent.name}</Text>
    </View>
  );
}
export default function StoryAgentScreen() {
  const [level, setLevel] = useState('beginner');
  const [story, setStory] = useState(FALLBACK.beginner[0]);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sentIdx, setSentIdx] = useState(-1);
  const [voiceList, setVoiceList] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const scrollRef = useRef(null);
  const speakingRef = useRef(false);

  const passage = customMode ? customText.trim() : story.text;
  const sentences = passage.split(SENT_RE).filter(Boolean);

  const paragraphs = React.useMemo(() => {
    if (passage.includes('\n')) {
      return passage.split(PARA_RE).filter(Boolean).map(p => p.trim());
    }
    const sents = passage.split(SENT_RE).filter(Boolean);
    const chunks = [];
    const chunkSize = Math.max(2, Math.ceil(sents.length / Math.max(1, Math.ceil(sents.length / 4))));
    for (let i = 0; i < sents.length; i += chunkSize) {
      chunks.push(sents.slice(i, i + chunkSize).join(' '));
    }
    return chunks.length > 0 ? chunks : [passage];
  }, [passage]);

  useEffect(() => {
    Speech.getAvailableVoicesAsync().then(v => {
      const en = v.filter(x => x.language?.startsWith('en'));
      setVoiceList(en.length > 0 ? en : v.slice(0, 20));
    }).catch(() => {});
    return () => { Speech.stop(); };
  }, []);

  const generateStory = async () => {
    setGenerating(true);
    try {
      const data = await api.post('/api/story', { level, topic: topic.trim() || undefined });
      setStory(data);
      setCustomMode(false);
      setSentIdx(-1);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  const speakFrom = useCallback((text, startIdx) => {
    const sents = text.split(SENT_RE).filter(Boolean);
    speakingRef.current = true;
    const run = (i) => {
      if (i < 0 || i >= sents.length || !speakingRef.current) {
        setIsPlaying(false);
        setIsPaused(false);
        setSentIdx(-1);
        speakingRef.current = false;
        return;
      }
      setSentIdx(i);
      setIsPlaying(true);
      setIsPaused(false);
      Speech.speak(sents[i], {
        language: 'en-US',
        pitch: selectedAgent.pitch,
        rate: selectedAgent.rate,
        voice: selectedVoice?.identifier,
        onDone: () => { if (speakingRef.current) run(i + 1); },
        onStopped: () => { speakingRef.current = false; },
      });
    };
    run(startIdx);
  }, [selectedAgent, selectedVoice]);

  const play = () => {
    if (!passage.trim()) { Alert.alert('No text', 'Generate or enter a story first.'); return; }
    Speech.stop();
    speakFrom(passage, 0);
  };
  const pause = () => { Speech.stop(); setIsPaused(true); speakingRef.current = false; };
  const resume = () => { speakFrom(passage, sentIdx >= 0 ? sentIdx : 0); };
  const stop = () => { Speech.stop(); setIsPlaying(false); setIsPaused(false); setSentIdx(-1); speakingRef.current = false; };

  return (
    <ScrollView ref={scrollRef} style={st.container} contentContainerStyle={st.content}>
      <View style={st.header}>
        <Icon name="account-voice" size={36} color="#f57c00" />
        <Text style={st.title}>Story Agents</Text>
        <Text style={st.sub}>Pick a voice and watch the story come alive</Text>
      </View>

      <Text style={st.label}>Reading Level</Text>
      <View style={st.row}>
        {LEVELS.map(l => (
          <TouchableOpacity key={l} style={[st.pill, level === l && st.pillAct]} onPress={() => { setLevel(l); setStory(FALLBACK[l][0]); setSentIdx(-1); stop(); }}>
            <Text style={[st.pillTxt, level === l && st.pillTxtAct]}>{l[0].toUpperCase() + l.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={st.row}>
        <TouchableOpacity style={[st.modeBtn, !customMode && st.modeAct]} onPress={() => setCustomMode(false)}>
          <Icon name="book-open-page-variant" size={16} color={!customMode ? '#fff' : '#888'} />
          <Text style={[st.modeTxt, !customMode && { color: '#fff' }]}>Library</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.modeBtn, customMode && st.modeAct]} onPress={() => setCustomMode(true)}>
          <Icon name="pencil" size={16} color={customMode ? '#fff' : '#888'} />
          <Text style={[st.modeTxt, customMode && { color: '#fff' }]}>Custom</Text>
        </TouchableOpacity>
      </View>

      {!customMode ? (
        <View>
          <View style={st.row}>
            <TextInput style={st.topicIn} placeholder="Optional topic..." placeholderTextColor="#666" value={topic} onChangeText={setTopic} />
            <TouchableOpacity style={st.genBtn} onPress={generateStory} disabled={generating}>
              {generating ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="magic-staff" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
          <View style={st.storyCard}>
            <Text style={st.storyTitle}>{story.title}</Text>
            <Text style={st.storyBody} numberOfLines={6}>{story.text}</Text>
          </View>
        </View>
      ) : (
        <TextInput style={st.customIn} placeholder="Paste your story..." placeholderTextColor="#666" value={customText} onChangeText={setCustomText} multiline numberOfLines={5} textAlignVertical="top" />
      )}

      <Text style={st.label}>Choose Voice</Text>
      <View style={st.agentsRow}>
        {AGENTS.map(a => {
          const sel = selectedAgent.id === a.id;
          return (
            <TouchableOpacity key={a.id} style={[st.agentCard, sel && { borderColor: a.color, backgroundColor: a.color + '15' }]} onPress={() => { setSelectedAgent(a); if (isPlaying) stop(); }}>
              <View style={[st.agentIco, { backgroundColor: a.color + '20', borderColor: a.color }]}>
                <Icon name={a.icon} size={28} color={a.color} />
              </View>
              <Text style={[st.agentLbl, { color: sel ? a.color : '#888' }]}>{a.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isPlaying || isPaused ? (
        <AnimatedAgent agent={selectedAgent} isPlaying={isPlaying} />
      ) : null}

      {isPlaying || isPaused ? (
        <View style={st.ctrlSection}>
          <View style={st.progBg}>
            <View style={[st.progFill, { width: sentences.length > 0 ? `${((sentIdx + 1) / sentences.length) * 100}%` : '0%' }]} />
          </View>
          <Text style={st.progTxt}>{sentIdx >= 0 ? `Sentence ${sentIdx + 1} of ${sentences.length}` : 'Ready'}</Text>
          <View style={st.ctrlRow}>
            {!isPlaying || isPaused ? (
              <TouchableOpacity style={st.ctrlBtn} onPress={isPaused ? resume : play}>
                <Icon name={isPaused ? 'play' : 'play-circle'} size={52} color="#4CAF50" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={st.ctrlBtn} onPress={pause}>
                <Icon name="pause-circle" size={52} color="#FF9800" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={st.ctrlBtn} onPress={stop}>
              <Icon name="stop-circle" size={52} color="#f44336" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={st.playBigBtn} onPress={play}>
          <Icon name="play-circle" size={28} color="#fff" />
          <Text style={st.playBigTxt}>Play Story</Text>
        </TouchableOpacity>
      )}

      {passage.trim() ? (
        <View style={st.textSection}>
          <Text style={st.label}>{story.title || 'Custom Story'}</Text>
          <View style={st.textBg}>
            {paragraphs.map((para, pi) => {
              const paraSentences = para.split(SENT_RE).filter(Boolean);
              const firstSentIdx = sentences.findIndex(s => para.includes(s));
              const lastSentIdx = firstSentIdx >= 0 ? firstSentIdx + paraSentences.length - 1 : -1;
              const isCurrentPara = sentIdx >= firstSentIdx && sentIdx <= lastSentIdx && firstSentIdx >= 0;
              const isPastPara = lastSentIdx >= 0 && sentIdx > lastSentIdx;
              return (
                <Text key={pi} style={[st.para, isCurrentPara && { color: selectedAgent.color }, isPastPara && { opacity: 0.35 }]}>
                  {paraSentences.map((s, si) => {
                    const globalIdx = firstSentIdx + si;
                    const isCurrent = globalIdx === sentIdx;
                    const isPast = sentIdx >= 0 && globalIdx < sentIdx;
                    return (
                      <Text key={si} style={[isCurrent && { color: selectedAgent.color, fontWeight: '700' }, isPast && { opacity: 0.35 }]}>
                        {s}{' '}
                      </Text>
                    );
                  })}
                </Text>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 8 },
  sub: { color: '#888', fontSize: 13, marginTop: 4, textAlign: 'center' },
  label: { color: '#ccc', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  row: { flexDirection: 'row', gap: 8 },
  pill: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#2C2C2C', alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3A' },
  pillAct: { backgroundColor: '#f57c00', borderColor: '#f57c00' },
  pillTxt: { color: '#888', fontSize: 13, fontWeight: '600' },
  pillTxtAct: { color: '#fff' },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#2C2C2C', borderWidth: 1, borderColor: '#3A3A3A' },
  modeAct: { backgroundColor: '#333', borderColor: '#f57c00' },
  modeTxt: { color: '#888', fontSize: 13, fontWeight: '600' },
  topicIn: { flex: 1, backgroundColor: '#2C2C2C', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#3A3A3A' },
  genBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#f57c00', justifyContent: 'center', alignItems: 'center' },
  storyCard: { backgroundColor: '#2C2C2C', borderRadius: 12, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#3A3A3A' },
  storyTitle: { color: '#f57c00', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  storyBody: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  customIn: { backgroundColor: '#2C2C2C', borderRadius: 12, padding: 14, color: '#fff', fontSize: 14, minHeight: 140, borderWidth: 1, borderColor: '#3A3A3A', marginTop: 12 },
  agentsRow: { flexDirection: 'row', gap: 8 },
  agentCard: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#2C2C2C', borderWidth: 1, borderColor: '#3A3A3A' },
  agentIco: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  agentLbl: { fontSize: 11, fontWeight: '700' },
  stageOuter: { marginTop: 20, alignItems: 'center', paddingVertical: 20, backgroundColor: '#252525', borderRadius: 20, borderWidth: 1, borderColor: '#3A3A3A', overflow: 'hidden' },
  stageBg: { width: 160, height: 160, justifyContent: 'center', alignItems: 'center' },
  glow: { position: 'absolute', width: 200, height: 200, borderRadius: 100 },
  ring: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 2 },
  agentCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  stageName: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  particle: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },
  waveWrap: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 8 },
  waveBar: { width: 3, height: 16, borderRadius: 1.5 },
  ctrlSection: { marginTop: 20, alignItems: 'center' },
  progBg: { width: '100%', height: 6, borderRadius: 3, backgroundColor: '#2C2C2C', overflow: 'hidden', marginBottom: 8 },
  progFill: { height: '100%', borderRadius: 3, backgroundColor: '#f57c00' },
  progTxt: { color: '#888', fontSize: 12, marginBottom: 14 },
  ctrlRow: { flexDirection: 'row', gap: 32 },
  ctrlBtn: { padding: 4 },
  playBigBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f57c00', borderRadius: 14, paddingVertical: 16, marginTop: 20 },
  playBigTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
  textSection: { marginTop: 20 },
  textBg: { backgroundColor: '#252525', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#3A3A3A' },
  para: { color: '#ccc', fontSize: 15, lineHeight: 24, marginBottom: 12 },
  sent: { color: '#ccc', fontSize: 15, lineHeight: 24 },
});
