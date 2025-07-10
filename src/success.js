// success.js
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "glitchlab-ai.firebaseapp.com",
  projectId: "glitchlab-ai",
  storageBucket: "glitchlab-ai.appspot.com",
  messagingSenderId: "807047215761",
  appId: "1:807047215761:web:416168acd2080ab80b1d30"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const uid = user.uid;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await setDoc(doc(db, "users", uid), {
      role: "pro",
      model: "",
      dailyLimit: 100,
      usedToday: 0,
      expiresAt: expiresAt.toISOString(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    document.getElementById("msg").innerText = "✅ Langganan aktif. Akses premium tersedia.";
  } else {
    document.getElementById("msg").innerText = "⚠️ Login gagal. Silakan masuk ulang.";
  }
});
