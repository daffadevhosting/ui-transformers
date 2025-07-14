
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
        globalAlert("Anda harus login terlebih dahulu untuk melakukan pembelian.", "warning");
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
            globalAlert("Pembayaran Anda sedang dalam proses.", "warning");
            button.disabled = false;
            button.textContent = originalButtonText;
          },
          onError: (error) => {
            globalAlert(`Pembayaran gagal: ${error?.message || 'Terjadi kesalahan.'}`);
            button.disabled = false;
            button.textContent = originalButtonText;
          },
          onClose: () => {
            globalAlert("Pembayaran dibatalkan.", "error");
            button.disabled = false;
            button.textContent = originalButtonText;
          }
        });

      } catch (err) {
        globalAlert(`Terjadi kesalahan: ${err.message}`);
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
    const db = window.getFirestore(); // pakai global dari firebase init
    const userDocRef = db.collection("users").doc(uid); // ✅ pakai compat-style
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists) {
      const userData = userDocSnap.data();
      const ownedModel = userData.model;

      if (ownedModel) {
        document.querySelectorAll(".pay-button").forEach(btn => {
          if (btn.dataset.model === ownedModel) {
            btn.classList.add("hidden");

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
  const auth = window.getAuth(); // Pastikan ambil dari global
  setupPayButtons();
  
  auth.onAuthStateChanged((user) => {
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

      document.querySelectorAll(".pay-button.hidden").forEach(btn => {
        btn.classList.remove("hidden");
        const infoSpan = btn.parentElement.querySelector(".purchase-status");
        if (infoSpan) infoSpan.remove();
      });
    }
  });

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
