// modelHandler.js

export const MODEL_PRICING = {
  "@cf/qwen/qwen1.5-0.5b-chat": 0,
  "@cf/meta/llama-3.2-1b-instruct": 0,
  "@cf/mistralai/mistral-small-3.1-24b-instruct": 7500,
  "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b": 12000
};

export function setupModelPricingUI() {
  const modelSelect = document.getElementById("model-select");
  const priceLabel = document.getElementById("model-price");
  const payButton = document.getElementById("pay-now");

  modelSelect.addEventListener("change", () => {
    const selected = modelSelect.value;
    const price = MODEL_PRICING[selected] || 0;
    const requiresLogin = selected === "@cf/meta/llama-3.2-1b-instruct";

    if (price === 0) {
      if (requiresLogin) {
      priceLabel.textContent = "Gratis • 🔐 Login Diperlukan";
      }
      priceLabel.textContent = "Harga: Gratis";
      payButton.classList.add("hidden");
    } else {
      priceLabel.textContent = `Harga: Rp ${price.toLocaleString()}`;
      payButton.classList.remove("hidden");
    }
  });

  // Trigger langsung di awal load biar sesuai default
  modelSelect.dispatchEvent(new Event("change"));
}
