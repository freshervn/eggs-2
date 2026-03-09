import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import admin from "firebase-admin";

// Firebase configuration
// Replace these values with your Firebase project config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase (works on both client and server)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firestore (works on both client and server)
const db = getFirestore(app);

let auth: Auth;
let storage: FirebaseStorage | undefined;

// Initialize services (only on client side for auth/storage)
if (typeof window !== "undefined") {
  auth = getAuth(app);
  storage = getStorage(app);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.CLIENT_EMAIL,
    }),
    databaseURL: "https://eggs-4b43a-default-rtdb.firebaseio.com/",
  });
}

const realtimeDB = getDatabase(app);
const realtimeAdminDB = admin.database();
export default admin;
export { app, db, auth, storage, admin, realtimeDB, realtimeAdminDB };
