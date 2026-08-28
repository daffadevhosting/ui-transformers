// modelHandler.js
import { hasModelAccess, getModelPrice } from "./accessControl.js";
import { MODEL_PRICING } from "./constants/modelPricing.js";

export function setupModelPricingUI() {
  const modelSelect = document.getElementById("model-select");
  const priceLabel = document.getElementById("model-price");
  const payButton = document.getElementById("pay-now");

  if (!modelSelect || !priceLabel) {
    console.warn("Required elements for model pricing UI not found");
    return;
  }

  modelSelect.addEventListener("change", async () => {
    const auth = window.getAuth ? window.getAuth() : null;
    const user = auth ? auth.currentUser : null;
    const uid = user?.uid;
    const selectedModel = modelSelect.value;
    const price = MODEL_PRICING[selectedModel] || 0;

    const isLoginRequired = selectedModel === "@cf/meta/llama-4-scout-17b-16e-instruct";

    if (price === 0) {
      if (isLoginRequired && !uid) {
        priceLabel.textContent = "Gratis \u2022 \ud83d\udd10 Login Diperlukan";
        if (payButton) payButton.classList.add("hidden");
        return;
      } else {
        priceLabel.textContent = "Harga: Gratis";
        if (payButton) payButton.classList.add("hidden");
        return;
      }
    }

    // Model berbayar: cek akses
    const allowed = uid ? await hasModelAccess(uid, selectedModel) : false;

    if (allowed) {
      priceLabel.textContent = "\u2705 Sudah Dibeli";
      if (payButton) payButton.classList.add("hidden");
    } else {
      priceLabel.textContent = `Harga: Rp ${price.toLocaleString()}`;
      if (payButton) payButton.classList.remove("hidden");
    }
  });

  // Trigger langsung untuk inisialisasi
  modelSelect.dispatchEvent(new Event("change"));
}
