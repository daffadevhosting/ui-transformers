// accessControl.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore.js";

// --- KONFIGURASI FIREBASE ---
// Ganti dengan konfigurasi project Firebase Anda
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "glitchlab-ai.firebaseapp.com",
  projectId: "glitchlab-ai",
  appId: "1:807047215761:web:416168acd2080ab80b1d30"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged((user) => {
  if (user) {
    console.log("✅ Logged in as:", user.email);
  } else {
    console.log("❌ User logged out");
  }
});

/**
 * Cek apakah user sudah membeli model tertentu
 * @param {string} uid - UID user
 * @param {string} modelId - ID model
 * @returns {Promise<boolean>}
 */
export async function hasModelAccess(uid, modelId) {
  if (!uid || !modelId) return false;
  try {
    const trxRef = collection(db, `users/${uid}/transactions`);
    const q = query(trxRef, where("model", "==", modelId));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (e) {
    console.warn("🔥 Gagal cek akses model:", e);
    return false;
  }
}

/**
 * Sembunyikan tombol bayar jika user sudah punya akses model
 * @param {string} uid - UID user
 */
export async function updatePricingUI(uid) {
  const payButtons = document.querySelectorAll("[data-model-id]");
  for (const btn of payButtons) {
    const modelId = btn.dataset.modelId;
    const granted = await hasModelAccess(uid, modelId);
    if (granted) {
      btn.classList.add("hidden");
    }
  }
}
