import { unlockModel } from './premiumAccess.js';
import { setupSnapCheckout } from './snapClient.js';

document.addEventListener("DOMContentLoaded", () => {
  setupSnapCheckout();

});

document.getElementById("pay-pro-7500")?.addEventListener("click", () => {
  document.getElementById("model-select").value = "@cf/meta/llama-3.2-1b-instruct";
  document.getElementById("pay-pro-7500").click();
});

document.getElementById("pay-pro-12500")?.addEventListener("click", () => {
  document.getElementById("model-select").value = "@cf/mistralai/mistral-small-3.1-24b-instruct";
  document.getElementById("pay-pro-12500").click();
});

const payButton = document.getElementById("pay-now");
payButton.disabled = true;
payButton.innerText = "Memproses...";

window.snap.pay(data.token, {
  onSuccess: function (result) {
    unlockModel(selectedModel);
    alert("✅ Pembayaran berhasil!");
    window.location.href = "/success.html?order_id=" + result.order_id;
  },
  onPending: function () {
    alert("⏳ Pembayaran menunggu konfirmasi.");
    payButton.disabled = false;
    payButton.innerText = "Bayar Sekarang";
  },
  onError: function () {
    alert("❌ Pembayaran gagal.");
    payButton.disabled = false;
    payButton.innerText = "Bayar Sekarang";
  },
  onClose: function () {
    console.log("Snap ditutup.");
    payButton.disabled = false;
    payButton.innerText = "Bayar Sekarang";
  }
});
