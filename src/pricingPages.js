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

const MIDTRANS_WORKER_URL = "https://midtranspay.androidbutut.workers.dev/snap";

/**
 * Mengambil Snap Token dari backend untuk inisiasi pembayaran Midtrans.
 * @param {object} params - Parameter untuk permintaan token.
 * @param {string} params.model - Model yang dibeli (e.g., '@cf/mistralai/mistral-small-3.1-24b-instruct').
 * @param {number} params.amount - Jumlah pembayaran.
 * @param {string} params.uid - User ID Firebase.
 * @returns {Promise<string>} Snap Token.
 * @throws {Error} Jika gagal mendapatkan Snap Token.
 */
async function generateSnapToken({ model, amount, uid, userEmail }) {
  const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  try {
    const response = await fetch(MIDTRANS_WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ orderId, gross_amount: amount, model, uid, userEmail })
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.error || `Gagal mendapatkan Snap Token. Status: ${response.status}`;
      console.error("Error from Midtrans Worker:", result);
      throw new Error(errorMessage);
    }

    if (!result.token) {
      // Tangani jika respons sukses tapi tidak ada token
      throw new Error("Snap Token tidak ditemukan dalam respons.");
    }

    return result.token;
  } catch (error) {
    console.error("Error generating Snap Token:", error);
    throw new Error(`Gagal memproses pembayaran: ${error.message}`);
  }
}

/**
 * Menyiapkan event listener untuk semua tombol "Beli Sekarang".
 */
function setupPayButtons() {
  const buttons = document.querySelectorAll(".pay-button");

  buttons.forEach(button => {
    const originalButtonText = button.textContent; // Simpan teks asli tombol

    button.addEventListener("click", async () => {
      const model = button.dataset.model;
      const amount = parseInt(button.dataset.amount);
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        alert("Anda harus login terlebih dahulu untuk melakukan pembelian. Silakan daftar atau masuk untuk melanjutkan.");
        return;
      }

      // Nonaktifkan tombol dan ubah teks segera setelah diklik
      button.disabled = true;
      button.textContent = "Memproses..."; // Atau "Memuat..."

      try {
        const snapToken = await generateSnapToken({ model, amount, uid: user.uid, userEmail });

        if (typeof window.snap === 'undefined' || !window.snap.pay) {
          throw new Error("Midtrans Snap.js belum dimuat atau tidak tersedia.");
        }

        window.snap.pay(snapToken, {
          onSuccess: (result) => {
            alert("Pembayaran berhasil! Terima kasih atas pembelian Anda.");
            // Arahkan ke halaman sukses dengan order_id
            location.href = `/success?order_id=${result.order_id || 'N/A'}`;
          },
          onPending: () => {
            alert("Pembayaran Anda sedang dalam proses. Silakan selesaikan pembayaran sesuai instruksi.");
            button.disabled = false;
            button.textContent = originalButtonText;
          },
          onError: (error) => {
            alert(`Pembayaran gagal. ${error?.message || 'Terjadi kesalahan tidak dikenal.'}`);
            console.error("Midtrans Snap Error:", error);
            button.disabled = false;
            button.textContent = originalButtonText;
          },
          onClose: () => {
            // Ketika pop-up pembayaran ditutup tanpa menyelesaikan transaksi
            alert("Pembayaran dibatalkan oleh pengguna.");
            button.disabled = false;
            button.textContent = originalButtonText;
          }
        });

      } catch (err) {
        alert(`Terjadi kesalahan: ${err.message}`);
        console.error("Error in payment flow:", err);
        button.disabled = false;
        button.textContent = originalButtonText;
      }
    });
  });
}

/**
 * Menyembunyikan tombol pembelian untuk model yang sudah dimiliki pengguna.
 * @param {string} uid - User ID Firebase.
 */
async function hidePurchasedButtons(uid) {
  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/glitchlab-ai/databases/(default)/documents/transactions`);

    if (!res.ok) {
      throw new Error(`Gagal mengambil data transaksi: ${res.statusText}`);
    }

    const { documents = [] } = await res.json();

    const ownedModels = new Set(
      documents
        .filter(doc => doc.fields?.uid?.stringValue === uid)
        .map(doc => doc.fields?.model?.stringValue)
        .filter(Boolean) // Filter out any undefined or null model values
    );

    document.querySelectorAll(".pay-button").forEach(btn => {
      const modelIdentifier = btn.dataset.model;
      if (ownedModels.has(modelIdentifier)) {
        btn.classList.add("hidden"); // Sembunyikan tombol
        // Buat dan tambahkan elemen status "Sudah Dibeli"
        let infoSpan = btn.parentElement.querySelector(".purchase-status");
        if (!infoSpan) {
          infoSpan = document.createElement("span");
          infoSpan.className = "text-green-400 font-semibold text-base mt-2 purchase-status";
          btn.parentElement.appendChild(infoSpan);
        }
        infoSpan.textContent = "✅ Sudah Dibeli";
      }
    });
  } catch (err) {
    console.error("Error hiding purchased buttons:", err);
  }
}

// Inisialisasi setelah DOM dimuat
document.addEventListener("DOMContentLoaded", () => {
  setupPayButtons();

  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    // Tampilkan/sembunyikan tombol logout berdasarkan status login
    const logoutBtn = document.getElementById("logout-btn");
    const userInfo = document.getElementById("user-info");

    if (user) {
      userInfo.textContent = `Login sebagai: ${user.email}`;
      userInfo.classList.remove("hidden");
      logoutBtn.classList.remove("hidden");
      hidePurchasedButtons(user.uid);
    } else {
      userInfo.classList.add("hidden");
      logoutBtn.classList.add("hidden");
      // Jika user logout, pastikan semua tombol pembelian kembali terlihat
      document.querySelectorAll(".pay-button.hidden").forEach(btn => {
        btn.classList.remove("hidden");
        const infoSpan = btn.parentElement.querySelector(".purchase-status");
        if (infoSpan) {
          infoSpan.remove();
        }
      });
    }
  });

  // Tambahkan event listener untuk tombol logout (jika ada di HTML Anda)
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const auth = getAuth();
      try {
        await auth.signOut();
        alert("Anda telah berhasil logout.");
        // Redirect atau reload halaman untuk memperbarui UI
        location.reload();
      } catch (error) {
        console.error("Error during logout:", error);
        alert("Gagal logout. Silakan coba lagi.");
      }
    });
  }
});