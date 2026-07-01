import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDod1-HvYPnoowzNErio51uX2VlEN5Uoqk",
  authDomain: "gamechanger-web-80f9f.firebaseapp.com",
  projectId: "gamechanger-web-80f9f",
  storageBucket: "gamechanger-web-80f9f.firebasestorage.app",
  messagingSenderId: "633762860140",
  appId: "1:633762860140:web:566075ced489756a7a5c49",
  measurementId: "G-5RSSK2088R"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
