// firebase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
} from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyAS3d3T9sENBlWoop-edE_xv017wpvUqxE',
  authDomain: 'ecocollab-9b9c7.firebaseapp.com',
  projectId: 'ecocollab-9b9c7',
  storageBucket: 'ecocollab-9b9c7.appspot.com',
  messagingSenderId: '126163217001',
  appId: '126163217001',
};

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;

console.log('[FB] Platform:', Platform.OS);

if (Platform.OS === 'web') {
  console.log('[FB] Using browserLocalPersistence');

  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} else {
  try {
    const { getReactNativePersistence, initializeAuth } = require('firebase/auth');
    console.log('[FB] Using initializeAuth + AsyncStorage');
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      console.log('[FB] Auth initialized with AsyncStorage persistence');
    } catch (error) {
      console.error('[FB] Error initializing auth with AsyncStorage:', error);
    }
  } catch {
    auth = getAuth(app);
    console.log('[FB] Using fallback: no native persistence');
  }
}

const db: Firestore = getFirestore(app);

export { auth, db };

