import { unlockModel } from './premiumAccess.js';
import { setupSnapCheckout } from './snapClient.js';
import { getAuth } from "./authSetup.js";

  const payButtons =  document.querySelectorAll(".pay-button");
payButtons.forEach(button => {
  button.addEventListener("click", async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
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
});

document.addEventListener("DOMContentLoaded", () => {
  setupSnapCheckout();
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        document.getElementById("login-modal")?.classList.remove("hidden");
        return;
      }

  const btn7500 = document.getElementById("pay-pro-7500");
  const btn12500 = document.getElementById("pay-pro-12500");
  const modelSelect = document.getElementById("model-select");
  const payButtons = document.querySelectorAll(".pay-button");

  if (btn7500 && modelSelect && payButton) {
    btn7500.addEventListener("click", () => {
      unlockModel.value = "@cf/meta/llama-3.2-1b-instruct";
      payButtons.click();
    });
  }

  if (btn12500 && modelSelect && payButton) {
    btn12500.addEventListener("click", () => {
      unlockModel.value = "@cf/mistralai/mistral-small-3.1-24b-instruct";
      payButtons.click();
    });
  }
});
