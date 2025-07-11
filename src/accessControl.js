// accessControl.js
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { onAuthChange } from './authSetup.js';

const db = getFirestore();
  onAuthChange((user) => {
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
    const q = query(
      collection(db, "transactions"),
      where("uid", "==", uid),
      where("model", "==", modelId)
    );
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
