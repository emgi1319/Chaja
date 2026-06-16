import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const useEmulator = import.meta.env.VITE_USE_EMULATOR === "true";

let app: FirebaseApp | undefined;

export function firebaseApp(): FirebaseApp {
  if (app) return app;
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return app;
}

let firestore: Firestore | undefined;

export function db(): Firestore {
  if (firestore) return firestore;
  try {
    // Persistencia offline: el cache local de Firestore deja operar sin
    // conexión y sincroniza solo al volver la red. Es el offline-first que
    // necesita el vendedor en el campo, sin motor de sync propio.
    firestore = initializeFirestore(firebaseApp(), {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    firestore = getFirestore(firebaseApp());
  }
  if (useEmulator) connectFirestoreEmulator(firestore, "localhost", 8080);
  return firestore;
}

let firebaseAuth: Auth | undefined;

export function auth(): Auth {
  if (firebaseAuth) return firebaseAuth;
  firebaseAuth = getAuth(firebaseApp());
  if (useEmulator) connectAuthEmulator(firebaseAuth, "http://localhost:9099", { disableWarnings: true });
  return firebaseAuth;
}
