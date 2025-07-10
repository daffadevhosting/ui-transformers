// authSetup.js

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "glitchlab-ai.firebaseapp.com",
  projectId: "glitchlab-ai",
  appId: "1:807047215761:web:416168acd2080ab80b1d30"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert("❌ Gagal login dengan Google.");
    console.error(error);
  }
}

export function logout() {
  signOut(auth);
}

export function onAuthChange(callback) {
  onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export async function getIdToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}
