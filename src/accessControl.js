// accessControl.js
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { onAuthChange } from './authSetup.js'; // Pastikan path ini benar

// [PENJELASAN] Inisialisasi Firestore
const db = getFirestore();

// [PENJELASAN] Listener ini bisa tetap ada untuk debugging saat login/logout
onAuthChange((user) => {
  if (user) {
    console.log("AccessControl: User terautentikasi.", user.uid);
    updatePricingUI(user.uid); // Panggil update UI saat status auth berubah
  } else {
    console.log("AccessControl: User logout.");
    // Reset UI ke keadaan default saat logout
    document.querySelectorAll(".tombol-bayar.hidden").forEach(btn => {
        btn.classList.remove("hidden");
    });
  }
});

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
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.log("Akses ditolak: Dokumen user tidak ditemukan.");
      return false;
    }

    const userData = userDocSnap.data();
    const activeModel = userData.model;
    const expiresAt = userData.expiresAt; // Ambil data tanggal kedaluwarsa

    // 1. Cek apakah user punya model aktif
    if (!activeModel) {
      console.log("Akses ditolak: Tidak ada model aktif.");
      return false;
    }

    // 2. Cek apakah tanggal langganan sudah lewat (kedaluwarsa)
    if (!expiresAt || !(expiresAt.toDate instanceof Function)) {
        console.log("Akses ditolak: Data tanggal kedaluwarsa tidak valid.");
        return false;
    }

    const expiryDate = expiresAt.toDate();
    const now = new Date();

    if (expiryDate < now) {
      console.log(`Akses ditolak: Langganan untuk model '${activeModel}' telah kedaluwarsa pada ${expiryDate.toLocaleString()}`);
      return false;
    }

    // 3. Jika parameter modelToCheck diberikan, pastikan modelnya cocok
    if (modelToCheck && activeModel !== modelToCheck) {
      console.log(`Akses ditolak: User punya model '${activeModel}', tapi yang dibutuhkan '${modelToCheck}'.`);
      return false;
    }

    // Jika semua pengecekan lolos
    console.log(`✅ Akses diberikan: User punya model '${activeModel}', berlaku hingga ${expiryDate.toLocaleString()}`);
    return true;

  } catch (e) {
    console.error("🔥 Gagal saat memeriksa akses model:", e);
    return false;
  }
}


/**
 * [PERBAIKAN] Fungsi ini dioptimalkan untuk membaca data user SEKALI saja,
 * lalu memperbarui semua tombol berdasarkan data tersebut.
 *
 * @param {string} uid - UID pengguna.
 */
export async function updatePricingUI(uid) {
  if (!uid) return;

  try {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const ownedModel = userData.model;
      const expiresAt = userData.expiresAt;

      // Cek apakah langganan valid dan belum kedaluwarsa
      const isSubscriptionActive = ownedModel && expiresAt && expiresAt.toDate() > new Date();

      if (isSubscriptionActive) {
        document.querySelectorAll(".tombol-bayar").forEach(btn => {
          // Tombol disembunyikan jika model yang dijual sama dengan yang sudah dimiliki user
          if (btn.dataset.model === ownedModel) {
            btn.classList.add("hidden");
            // Anda bisa tambahkan label "Sudah Aktif" di sini jika mau
          }
        });
      }
    }
  } catch (e) {
    console.error("Gagal memperbarui UI harga:", e);
  }
}