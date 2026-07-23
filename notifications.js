import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { ref, set, get } from 'firebase/database';
import { auth, realtimeDb } from './firebase';

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
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: undefined });
    const token = tokenData.data;

    if (auth.currentUser) {
      await set(ref(realtimeDb, `Users/${auth.currentUser.uid}/pushToken`), token);
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#f57c00',
      });
    }

    return token;
  } catch {
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
