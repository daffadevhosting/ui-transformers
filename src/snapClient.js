// snapClient.js
import { getAuth } from "firebase/auth";
import { MODEL_PRICING, unlockModel } from './premiumAccess.js';

export function setupSnapCheckout() {
  const payButton = document.getElementById("pay-now");
  const modelSelect = document.getElementById("model-select");

  payButton.addEventListener("click", async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      document.getElementById("login-modal")?.classList.remove("hidden");
      return;
    }
    
    const uid = user.uid; // user.uid dijamin ada jika user tidak null
    const userEmail = user.email; // <-- AMBIL EMAIL DARI OBJEK USER
    const model = modelSelect.value;
    const amount = MODEL_PRICING[model] || 0;
    const orderId = `order-${Date.now()}`;

    // Validasi dasar di frontend sebelum mengirim ke worker
    if (!userEmail) {
        alert("⚠️ Email pengguna tidak ditemukan. Harap login kembali.");
        console.error("User email is missing for checkout process.");
        return;
    }
    if (!model || amount <= 0) {
        alert("⚠️ Model atau jumlah pembayaran tidak valid.");
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
        alert(`❌ Gagal memproses permintaan: ${data.error || "Pesan error tidak diketahui."}`);
        return;
      }

      if (!data.token) {
        alert("❌ Gagal mendapatkan Snap token dari Midtrans.");
        return;
      }

      window.snap.pay(data.token, {
        onSuccess: function (result) {
          unlockModel(model);
          alert("✅ Pembayaran berhasil!");
          window.location.href = "/success?order_id=" + result.order_id;
        },
        onPending: function () {
          alert("⏳ Pembayaran menunggu konfirmasi.");
        },
        onError: function (result) { // Midtrans onError juga memberikan objek result
          console.error("❌ Pembayaran gagal (Midtrans):", result);
          alert("❌ Pembayaran gagal. " + (result.status_message || "Silakan coba lagi."));
        },
        onClose: function () {
          console.log("🛑 Pembayaran dibatalkan oleh user.");
        }
      });
    } catch (err) {
      console.error("❌ Error saat proses pembayaran:", err);
      alert("⚠️ Terjadi kesalahan. Silakan coba lagi.");
    }
  });
}