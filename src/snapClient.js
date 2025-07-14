// snapClient.js
import { getAuthInstance } from "./authSetup.js";

import { MODEL_PRICING, unlockModel } from './premiumAccess.js';


export function setupSnapCheckout() {
  const payButton = document.getElementById("pay-now");
  const modelSelect = document.getElementById("model-select");

  if (!payButton || !modelSelect) {
    console.warn("Elemen 'pay-now' atau 'model-select' tidak ditemukan. Fungsi setupSnapCheckout mungkin tidak berfungsi.");
    return;
  }

  payButton.addEventListener("click", async () => {
    const auth = getAuthInstance(); 
    const user = auth.currentUser; // currentUser adalah properti dari objek auth compat

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
        globalAlert("⚠️ Email pengguna tidak ditemukan. Harap login kembali.", "error");
        console.error("User email is missing for checkout process.");
        return;
    }
    if (!model || amount <= 0) {
        globalAlert("⚠️ Model atau jumlah pembayaran tidak valid.", "error");
        console.error("Invalid model or amount selected for checkout.");
        return;
    }

    try {
      const res = await fetch("https://midtranspay.androidbutut.workers.dev/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Pastikan semua variabel ini terdefinisi dengan baik
        body: JSON.stringify({ orderId, gross_amount: amount, model, uid, userEmail }) 
      });

      const data = await res.json();

      if (!res.ok) { // Cek status res.ok untuk error dari worker (misal status 400/500)
        console.error("Error from Midtrans Worker:", data.error || data);
        globalAlert(`❌ Gagal memproses permintaan: ${data.error || "Pesan error tidak diketahui."}`);
        return;
      }

      if (!data.token) {
        globalAlert("❌ Gagal mendapatkan Snap token dari Midtrans.", "error");
        return;
      }

      if (typeof window.snap === 'undefined') {
        globalAlert("⚠️ Midtrans Snap.js belum dimuat. Silakan cek koneksi internet atau konfigurasi.", "error");
        console.error("Midtrans Snap.js is not loaded.");
        return;
      }

      window.snap.pay(data.token, {
        onSuccess: function (result) {
          // Asumsi unlockModel tidak bergantung pada Firebase modular
          unlockModel(model); 
          globalAlert("✅ Pembayaran berhasil!", "success");
          // Redirect ke halaman sukses dengan order_id
          window.location.href = "/success?order_id=" + result.order_id;
        },
        onPending: function () {
          globalAlert("⏳ Pembayaran menunggu konfirmasi.", "warning");
        },
        onError: function (result) {
          console.error("❌ Pembayaran gagal (Midtrans):", result);
          globalAlert("❌ Pembayaran gagal. " + (result.status_message || "Silakan coba lagi."), "error");
        },
        onClose: function () {
          console.log("🛑 Pembayaran dibatalkan oleh user.");
        }
      });
    } catch (err) {
      console.error("❌ Error saat proses pembayaran:", err);
      globalAlert("⚠️ Terjadi kesalahan. Silakan coba lagi.", "error");
    }
  });
}