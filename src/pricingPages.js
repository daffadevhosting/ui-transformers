import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore"; // Import getDoc

// --- KONFIGURASI & INISIALISASI (Tidak berubah) ---
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

// --- FUNGSI GENERATE SNAP TOKEN (Diperbaiki) ---
/**
 * [PERBAIKAN] Signature fungsi diubah untuk menerima orderId dari pemanggil.
 * Ini memastikan konsistensi ID antara client dan server worker.
 */
async function generateSnapToken({ orderId, model, gross_amount, uid, userEmail }) {
  try {
    const response = await fetch(MIDTRANS_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, gross_amount, model, uid, userEmail }) // Data sudah lengkap
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.error || `Gagal mendapatkan Snap Token. Status: ${response.status}`;
      console.error("Error from Midtrans Worker:", result);
      throw new Error(errorMessage);
    }
    if (!result.token) {
      throw new Error("Snap Token tidak ditemukan dalam respons.");
    }
    return result.token;
  } catch (error) {
    console.error("Error generating Snap Token:", error);
    throw new Error(`Gagal memproses pembayaran: ${error.message}`);
  }
}

// --- FUNGSI SETUP TOMBOL BELI (Diperbaiki) ---
function setupPayButtons() {
  const buttons = document.querySelectorAll(".pay-button");

  buttons.forEach(button => {
    const originalButtonText = button.textContent;

    button.addEventListener("click", async () => {
      const user = auth.currentUser;

      if (!user) {
        alert("Anda harus login terlebih dahulu untuk melakukan pembelian.");
        return;
      }

      // [PERBAIKAN] UID dan Email diambil dengan benar dari objek 'user'
      const uid = user.uid;
      const userEmail = user.email;
      const model = button.dataset.model;
      const gross_amount = parseInt(button.dataset.amount, 10);
      
      // [PERBAIKAN] orderId dibuat di sini dan diteruskan ke fungsi generateSnapToken
      const orderId = `order-${uid}-${Date.now()}`;

      button.disabled = true;
      button.textContent = "Memproses...";

      try {
        // Panggil fungsi dengan parameter yang sudah benar
        const snapToken = await generateSnapToken({ orderId, gross_amount, model, uid, userEmail });

        if (typeof window.snap === 'undefined' || !window.snap.pay) {
          throw new Error("Midtrans Snap.js belum dimuat.");
        }

        window.snap.pay(snapToken, {
          onSuccess: (result) => {
            // Gunakan orderId dari result yang dikembalikan Midtrans untuk konsistensi
            location.href = `/success.html?order_id=${result.order_id}`;
          },
          onPending: (result) => {
            alert("Pembayaran Anda sedang dalam proses.");
            button.disabled = false;
            button.textContent = originalButtonText;
          },
          onError: (error) => {
            alert(`Pembayaran gagal: ${error?.message || 'Terjadi kesalahan.'}`);
            button.disabled = false;
            button.textContent = originalButtonText;
          },
          onClose: () => {
            alert("Pembayaran dibatalkan.");
            button.disabled = false;
            button.textContent = originalButtonText;
          }
        });

      } catch (err) {
        alert(`Terjadi kesalahan: ${err.message}`);
        button.disabled = false;
        button.textContent = originalButtonText;
      }
    });
  });
}

// --- FUNGSI SEMBUNYIKAN TOMBOL (Diperbaiki) ---
/**
 * [PERBAIKAN] Logika diubah total untuk menggunakan Firebase SDK (getDoc)
 * yang lebih aman dan efisien untuk membaca data dari Firestore.
 */
async function hidePurchasedButtons(uid) {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const ownedModel = userData.model; // Mengambil model yang dimiliki dari profil user

      if (ownedModel) {
        document.querySelectorAll(".pay-button").forEach(btn => {
          if (btn.dataset.model === ownedModel) {
            btn.classList.add("hidden"); // Sembunyikan tombol jika modelnya sama
            
            // Tambahkan label "Sudah Dibeli"
            let infoSpan = btn.parentElement.querySelector(".purchase-status");
            if (!infoSpan) {
              infoSpan = document.createElement("span");
              infoSpan.className = "text-green-400 font-semibold text-base mt-2 purchase-status";
              btn.parentElement.appendChild(infoSpan);
            }
            infoSpan.textContent = "✅ Sudah Dibeli";
          }
        });
      }
    }
  } catch (err) {
    console.error("Gagal memeriksa model yang sudah dibeli:", err);
  }
}

// --- INISIALISASI & AUTH STATE (Tidak banyak berubah) ---
document.addEventListener("DOMContentLoaded", () => {
  setupPayButtons();
  
  onAuthStateChanged(auth, (user) => {
    const logoutBtn = document.getElementById("logout-btn");
    const userInfo = document.getElementById("user-info");

    if (user) {
      userInfo.textContent = `Login sebagai: ${user.email}`;
      userInfo.classList.remove("hidden");
      logoutBtn.classList.remove("hidden");
      hidePurchasedButtons(user.uid); // Panggil fungsi yang sudah diperbaiki
    } else {
      userInfo.classList.add("hidden");
      logoutBtn.classList.add("hidden");

      // Reset tampilan tombol jika user logout
      document.querySelectorAll(".pay-button.hidden").forEach(btn => {
        btn.classList.remove("hidden");
        const infoSpan = btn.parentElement.querySelector(".purchase-status");
        if (infoSpan) infoSpan.remove();
      });
    }
  });

  // Event listener untuk logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await auth.signOut();
        location.reload();
      } catch (error) {
        console.error("Error during logout:", error);
      }
    });
  }
});