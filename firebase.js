import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

// TODO: Replace with your actual Firebase project configuration
// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_AUTH_DOMAIN",
//   projectId: "messenger-a5efb",
//   storageBucket: "YOUR_STORAGE_BUCKET",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "1:798969223897:android:913b48e70c767e83dbfcc8"
// };

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
export const auth = getAuth(app);
export const database = getFirestore(app);
export const realtimeDb = getDatabase(app);
