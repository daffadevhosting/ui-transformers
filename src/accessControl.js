// accessControl.js
// Tidak perlu import apa pun karena sudah di-load via <script> di HTML
// Gunakan namespace global firebase.firestore

export async function updatePricingUI(uid) {
  if (!uid) return;

  try {
    const userDocRef = firebase.firestore().doc(`users/${uid}`);
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists) {
      const userData = userDocSnap.data();
      const ownedModel = userData.model;
      const expiresAt = userData.expiresAt;

      const isSubscriptionActive = ownedModel && expiresAt && expiresAt.toDate() > new Date();

      if (isSubscriptionActive) {
        document.querySelectorAll(".tombol-bayar").forEach(btn => {
          if (btn.dataset.model === ownedModel) {
            btn.classList.add("hidden");
          }
        });
      }
    }
  } catch (e) {
    console.error("Gagal memperbarui UI harga:", e);
  }
}

/**
 * [PERBAIKAN TOTAL] Fungsi ini sekarang memeriksa langsung dokumen profil user,
 * bukan lagi melakukan query ke subcollection transaksi. Ini lebih cepat dan
 * memungkinkan kita untuk memeriksa tanggal kedaluwarsa.
 *
 * @param {string} uid - UID pengguna.
 * @param {string} [modelToCheck] - (Opsional) ID model spesifik yang ingin dicek. Jika null, akan cek akses model apapun.
 * @returns {Promise<boolean>} - True jika user memiliki akses yang valid dan belum kedaluwarsa.
 */
export async function hasModelAccess(uid, modelToCheck = null) {
  if (!uid) return false;

  try {
    const db = window.getFirestore(); // pakai dari global
    const userDocRef = firebase.firestore().doc(`users/${uid}`);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      console.log("Akses ditolak: Dokumen user tidak ditemukan.");
      return false;
    }

    const userData = userDocSnap.data();
    const activeModel = userData.model;
    const expiresAt = userData.expiresAt;

    if (!activeModel || !expiresAt || !(expiresAt.toDate instanceof Function)) {
      console.log("Akses ditolak: Model atau tanggal kedaluwarsa tidak valid.");
      return false;
    }

    const expiryDate = expiresAt.toDate();
    if (expiryDate < new Date()) {
      console.log(`Akses ditolak: Langganan kedaluwarsa ${expiryDate.toLocaleString()}`);
      return false;
    }

    if (modelToCheck && activeModel !== modelToCheck) {
      console.log(`Akses ditolak: Butuh '${modelToCheck}', tapi user punya '${activeModel}'`);
      return false;
    }

    console.log(`✅ Akses OK: Model '${activeModel}', berlaku sampai ${expiryDate.toLocaleString()}`);
    return true;

  } catch (e) {
    console.error("🔥 Gagal saat memeriksa akses model:", e);
    return false;
  }
}
