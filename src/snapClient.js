// snapClient.js
import { getAuthInstance } from "./auth/index.js";
import { MODEL_PRICING, unlockModel } from './constants/modelPricing.js';

export function setupSnapCheckout() {
  const payButton = document.getElementById("pay-now");
  const modelSelect = document.getElementById("model-select");

  if (!payButton || !modelSelect) {
    console.warn("Elemen 'pay-now' atau 'model-select' tidak ditemukan. Fungsi setupSnapCheckout mungkin tidak berfungsi.");
    return;
  }

  payButton.addEventListener("click", async () => {
    const auth = getAuthInstance(); 
    const user = auth.currentUser;

    if (!user) {
      document.getElementById("login-modal")?.classList.remove("hidden");
      return;
    }
    
    const uid = user.uid;
    const userEmail = user.email;
    const model = modelSelect.value;
    const amount = MODEL_PRICING[model] || 0;
    const orderId = `order-${Date.now()}`;

    // Validasi dasar di frontend sebelum mengirim ke worker
    if (!userEmail) {
        if (window.globalAlert) {
          window.globalAlert("\u26a0\ufe0f Email pengguna tidak ditemukan. Harap login kembali.", "error");
        }
        console.error("User email is missing for checkout process.");
        return;
    }
    if (!model || amount <= 0) {
        if (window.globalAlert) {
          window.globalAlert("\u26a0\ufe0f Model atau jumlah pembayaran tidak valid.", "error");
        }
        console.error("Invalid model or amount selected for checkout.");
        return;
    }

    try {
      const res = await fetch("https://midtranspay.androidbutut.workers.dev/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, gross_amount: amount, model, uid, userEmail }) 
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Error from Midtrans Worker:", data.error || data);
        if (window.globalAlert) {
          window.globalAlert(`\u274c Gagal memproses permintaan: ${data.error || "Pesan error tidak diketahui."}`);
        }
        return;
      }

      if (!data.token) {
        if (window.globalAlert) {
          window.globalAlert("\u274c Gagal mendapatkan Snap token dari Midtrans.", "error");
        }
        return;
      }

      if (typeof window.snap === 'undefined') {
        if (window.globalAlert) {
          window.globalAlert("\u26a0\ufe0f Midtrans Snap.js belum dimuat. Silakan cek koneksi internet atau konfigurasi.", "error");
        }
        console.error("Midtrans Snap.js is not loaded.");
        return;
      }

      window.snap.pay(data.token, {
        onSuccess: function (result) {
          unlockModel(model); 
          if (window.globalAlert) {
            window.globalAlert("\u2705 Pembayaran berhasil!", "success");
          }
          // Redirect ke halaman sukses dengan order_id
          window.location.href = "/success?order_id=" + result.order_id;
        },
        onPending: function () {
          if (window.globalAlert) {
            window.globalAlert("\u23f3 Pembayaran menunggu konfirmasi.", "warning");
          }
        },
        onError: function (result) {
          console.error("\u274c Pembayaran gagal (Midtrans):", result);
          if (window.globalAlert) {
            window.globalAlert("\u274c Pembayaran gagal. " + (result.status_message || "Silakan coba lagi."), "error");
          }
        },
        onClose: function () {
          console.log("\ud83d\uded1 Pembayaran dibatalkan oleh user.");
        }
      });
    } catch (err) {
      console.error("\u274c Error saat proses pembayaran:", err);
      if (window.globalAlert) {
        window.globalAlert("\u26a0\ufe0f Terjadi kesalahan. Silakan coba lagi.", "error");
      }
    }
  });
}
