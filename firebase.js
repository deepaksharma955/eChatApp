import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAZ0jNd_TYYsSEWSK8MWSG553j268FiLrg",
  authDomain: "messenger-a5efb.firebaseapp.com",
  databaseURL: "https://messenger-a5efb-default-rtdb.firebaseio.com",
  projectId: "messenger-a5efb",
  storageBucket: "messenger-a5efb.appspot.com",
  messagingSenderId: "798969223897",
  appId: "1:798969223897:web:99e098c1ea7a15a5dbfcc8",
  measurementId: "G-Q0SKL16DSQ"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const database = getFirestore(app);
export const realtimeDb = getDatabase(app);
