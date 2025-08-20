import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  browserLocalPersistence,
  getAuth,
  initializeAuth,
  setPersistence,
} from 'firebase/auth';
import { Platform } from 'react-native';


const firebaseConfig = {
  apiKey: 'AIzaSyAS3d3T9sENBlWoop-edE_xv017wpvUqxE',
  authDomain: 'ecocollab-9b9c7.firebaseapp.com',
  projectId: 'ecocollab-9b9c7',
  storageBucket: 'ecocollab-9b9c7.appspot.com',
  messagingSenderId: '126163217001',
  appId: '126163217001',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;

if (Platform.OS === 'web') {
  // Web: persistência no browser
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} else {
  // RN (Android/iOS): initializeAuth + AsyncStorage (IMPORT CONDICIONAL!)
  try {
    const { getReactNativePersistence } = require('firebase/auth/react-native');
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
}

export { app, auth };
