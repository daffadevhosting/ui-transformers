// modelHandler.js
import { hasModelAccess } from "./accessControl.js";

export const MODEL_PRICING = {
  "@cf/qwen/qwen1.5-0.5b-chat": 0,
  "@cf/meta/llama-3.2-1b-instruct": 0,
  "@cf/mistralai/mistral-small-3.1-24b-instruct": 7500,
  "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b": 12500
};

export function setupModelPricingUI() {
  const modelSelect = document.getElementById("model-select");
  const priceLabel = document.getElementById("model-price");
  const payButton = document.getElementById("pay-now");

  modelSelect.addEventListener("change", async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    const uid = user?.uid;
    const selectedModel = modelSelect.value;
    const price = MODEL_PRICING[selectedModel] || 0;

    const isLoginRequired = selectedModel === "@cf/meta/llama-3.2-1b-instruct";

    if (price === 0) {
      if (isLoginRequired && !uid) {
        priceLabel.textContent = "Gratis • 🔐 Login Diperlukan";
        payButton.classList.add("hidden");
        return;
      } else {
        priceLabel.textContent = "Harga: Gratis";
        payButton.classList.add("hidden");
        return;
      }
    }

    // Model berbayar: cek akses
    const allowed = uid ? await hasModelAccess(uid, selectedModel) : false;

    if (allowed) {
      priceLabel.textContent = "✅ Sudah Dibeli";
      payButton.classList.add("hidden");
    } else {
      priceLabel.textContent = `Harga: Rp ${price.toLocaleString()}`;
      payButton.classList.remove("hidden");
    }
  });

  // Trigger langsung untuk inisialisasi
  modelSelect.dispatchEvent(new Event("change"));
}