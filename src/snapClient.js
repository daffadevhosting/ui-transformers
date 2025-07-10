// snapClient.js

import {
  MODEL_PRICING,
  unlockModel
} from './premiumAccess.js';

export function setupSnapCheckout() {
  const payButton = document.getElementById("pay-now");
  const modelSelect = document.getElementById("model-select");

  payButton.addEventListener("click", async () => {
    const selectedModel = modelSelect.value;
    const price = MODEL_PRICING[selectedModel] || 0;

    if (price <= 0) {
      alert("Model ini gratis. Tidak perlu pembayaran.");
      return;
    }

    // Load Snap.js jika belum ada
    if (!window.snap) {
      const snapScript = document.createElement("script");
      snapScript.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      snapScript.setAttribute("data-client-key", "SB-Mid-client-i2KW02MfN9duiyJ9");
      document.body.appendChild(snapScript);
      await new Promise((resolve) => (snapScript.onload = resolve));
    }

    // Minta token ke server Worker
    const res = await fetch("https://midtranspay.androidbutut.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: "ORDER-" + Date.now(),
        gross_amount: price,
        model: selectedModel
      })
    });

    const data = await res.json();

    if (!data.token) {
      alert("❌ Gagal mendapatkan token pembayaran.");
      return;
    }

    // Jalankan Snap
    payButton.disabled = true; // ⛔ cegah klik spam
    payButton.innerText = "Loading...";
    payButton.innerText = "🔒 Bayar untuk Akses";

    window.snap.pay(data.token, {
    onSuccess: function (result) {
        unlockModel(selectedModel);
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
        // ✅ Snap ditutup → tombol boleh diklik lagi
        console.log("Snap ditutup.");
        payButton.disabled = false;
        payButton.innerText = "Bayar Sekarang";
    }
    });
  });
}
