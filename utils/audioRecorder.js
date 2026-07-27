import { Platform } from 'react-native';

let AudioModule = null;
try { AudioModule = require('expo-av'); } catch {}

export async function startRecording() {
  if (Platform.OS === 'web') {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    return rec;
  }

  if (!AudioModule) return null;

  try {
    await AudioModule.Audio.requestPermissionsAsync();
    await AudioModule.Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await AudioModule.Audio.Recording.createAsync(
      AudioModule.Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    return recording;
  } catch (e) {
    console.error('Recording error:', e);
    return null;
  }
}

export async function stopRecording(rec) {
  if (Platform.OS === 'web') {
    try { rec.stop(); } catch {}
    return null;
  }

  if (!rec) return null;
  try {
    await rec.stopAndUnloadAsync();
    const uri = rec.getURI();
    return uri;
  } catch {}
  return null;
}

export function isRecordingSupported() {
  if (Platform.OS === 'web') {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
  return !!AudioModule;
}
