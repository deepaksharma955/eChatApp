import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { ref, set, get } from 'firebase/database';
import { auth, realtimeDb } from './firebase';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Warning: Running on emulator - push tokens may not work');
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission not granted');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: '6f4e3a6d-cc76-436a-a455-e646e2bde22c' });
    const token = tokenData.data;

    if (auth.currentUser) {
      await set(ref(realtimeDb, `Users/${auth.currentUser.uid}/pushToken`), token);
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#f57c00',
      });
    }

    return token;
  } catch (e) {
    console.warn('Push token registration error:', e.message || e);
    return null;
  }
}

export function scheduleLocalNotification(senderName, text, chatId, isGroup = false) {
  Notifications.scheduleNotificationAsync({
    content: {
      title: senderName || 'New message',
      body: text || '',
      data: { chatId, isGroup },
      sound: true,
    },
    trigger: null,
  });
}

export function scheduleFriendStatusNotification(friendName, isOnline) {
  Notifications.scheduleNotificationAsync({
    content: {
      title: isOnline ? '🟢 Friend Online' : '🔴 Friend Offline',
      body: isOnline ? `${friendName} is now online` : `${friendName} went offline`,
      data: { screen: 'Home' },
      sound: false,
    },
    trigger: null,
  });
}

const DAILY_VOCAB_HOUR = 9;
const DAILY_VOCAB_MINUTE = 0;

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function scheduleDailyVocabularyNotification() {
  if (Platform.OS === 'web') return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const existing = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of existing) {
      if (notif.content?.data?.vocabDaily) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    const todayKey = getTodayKey();
    const dbRef = ref(realtimeDb, `DailyVocab/${todayKey}`);
    const snap = await get(dbRef);

    let wordData;
    if (snap.exists()) {
      wordData = snap.val();
    } else {
      try {
        wordData = await api.get('/api/vocabulary');
        await set(dbRef, wordData);
      } catch {
        wordData = { word: 'Eloquent' };
      }
    }

    const word = wordData?.word || 'Eloquent';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 Daily Vocabulary',
        body: `Today's word: "${word}" — tap to learn its meaning in Hindi & earn points!`,
        sound: true,
        data: { screen: 'Vocabulary', vocabDaily: true, word },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: DAILY_VOCAB_HOUR,
        minute: DAILY_VOCAB_MINUTE,
        channelId: 'default',
      },
    });
  } catch (e) {
    console.warn('Daily vocab scheduling error:', e);
  }
}
