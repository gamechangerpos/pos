import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDuRBFkDrcELR7iwAz4Uvzs-hIyKU301Us",
  authDomain: "game-changer-pos.firebaseapp.com",
  projectId: "game-changer-pos",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
