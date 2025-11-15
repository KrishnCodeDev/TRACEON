import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator, ref, onValue } from 'firebase/database';

// Firebase configuration object
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate and format database URL
const dbUrl = firebaseConfig.databaseURL;
if (!dbUrl) {
  throw new Error('Firebase Database URL is not configured!');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const database = getDatabase(app);

// Configure database settings
const dbRef = database._repoInfo;
if (dbRef) {
  dbRef.timeoutSeconds = 30; // Increase timeout to 30 seconds
  dbRef.retryDelay = 1000; // Initial retry delay of 1 second
}

// Configure database for development/production
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
  // For development with emulator
  console.log('Using Firebase Emulator');
  const emulatorHost = import.meta.env.VITE_EMULATOR_HOST || 'localhost';
  const emulatorPort = parseInt(import.meta.env.VITE_EMULATOR_PORT) || 9000;
  connectDatabaseEmulator(database, emulatorHost, emulatorPort);
} else {
  // For production - enable offline persistence
  try {
    const connectedRef = ref(database, '.info/connected');
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        console.log('Connected to Firebase Database');
      } else {
        console.log('Not connected to Firebase Database');
      }
    });
  } catch (error) {
    console.error('Firebase connection monitoring error:', error);
  }
}

// Master admin email (configure this)
export const MASTER_ADMIN_EMAIL = import.meta.env.VITE_MASTER_ADMIN_EMAIL || 'admin@traceon.com';

export default app;