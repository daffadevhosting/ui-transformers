// premiumAccess.js

export const MODEL_PRICING = {
  "@cf/qwen/qwen2.5-coder-32b-instruct": 0,
  "@cf/meta/llama-4-scout-17b-16e-instruct": 0,
  "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b": 12500,
  "@cf/moonshotai/kimi-k2.5": 25000,
};

export function isUnlocked(model) {
  return localStorage.getItem(`modelAccess:${model}`) === "true";
}

export function unlockModel(model) {
  localStorage.setItem(`modelAccess:${model}`, "true");
}

export function getModelPrice(model) {
  return MODEL_PRICING[model] || 0;
}
