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
      //alert("🚫 Anda harus login terlebih dahulu sebelum melakukan pembayaran.");
      document.getElementById("login-modal")?.classList.remove("hidden"); // kalau punya modal login
      return;
    }

    const model = modelSelect.value;
    const amount = MODEL_PRICING[model] || 0;
    const orderId = `order-${Date.now()}`;

    try {
      const res = await fetch("https://midtranspay.androidbutut.workers.dev/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, gross_amount: amount, model })
      });

      const data = await res.json();

      if (!data.token) {
        alert("❌ Gagal mendapatkan Snap token.");
        return;
      }

      window.snap.pay(data.token, {
        onSuccess: function (result) {
          unlockModel(model);
          alert("✅ Pembayaran berhasil!");
          window.location.href = "/success.html?order_id=" + result.order_id;
        },
        onPending: function () {
          alert("⏳ Pembayaran menunggu konfirmasi.");
        },
        onError: function () {
          alert("❌ Pembayaran gagal.");
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
