// premiumAccess.js

export const MODEL_PRICING = {
  "@cf/qwen/qwen1.5-0.5b-chat": 0,
  "@cf/meta/llama-3.2-1b-instruct": 0,
  "@cf/mistralai/mistral-small-3.1-24b-instruct": 7500,
  "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b": 12500
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
