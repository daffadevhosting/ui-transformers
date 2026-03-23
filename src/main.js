// main.js

import { streamAndRenderAI } from './streamAndRender.js';
import { setupModelPricingUI } from './modelHandler.js';
import { setupLoginUI, setupLoginModal } from './loginUI.js';
import { setupSnapCheckout } from './snapClient.js';
import { signInWithGoogle, logout, onAuthChange } from './authSetup.js';
import { getModelPrice } from './premiumAccess.js';
import { updatePricingUI, hasModelAccess } from "./accessControl.js";

let token = "";

// Ambil token setelah DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  setupSnapCheckout();
  setupModelPricingUI();
  setupLoginUI();
  setupLoginModal();

  const promptBox = document.getElementById("output");
  const initialText = `<!doctype html>
<html lang="id-ID">
  <head>
    <meta charset="UTF-8">
    <title>UI Transformer by Lyra</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
      <style type="text/tailwindcss">
        @theme {
          --color-clifford: #da373d;
        }
      </style>
  </head>
    <body class="bg-gray-50 flex flex-col justify-center items-center min-h-screen text-center p-6">
      <h1 class="text-3xl font-bold text-clifford mb-2">👋 Selamat datang!</h1>
      <p class="text-gray-600 max-w-md">Tulis perintah desain atau masukkan URL website, dan aku akan bantu generate ulang tampilannya dengan Tailwind CSS ✨</p>
      <p class="text-gray-600 max-w-md">Tapi saat ini Lyra sedang dalam perbaikan dulu, jadi belum maksimal untuk bekerja dengan baik, harap maklum yaa.. 😉️</p>
    </body>
</html>`;


  promptBox.textContent = ""; // kosongin dulu
  typeEffect(promptBox, initialText);

  // Get token from current user
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    token = await user.getIdToken();
    console.log("✅ Token obtained:", token ? "Yes" : "No");
    await updatePricingUI(user.uid);
  } else {
    console.log("⚠️ No user logged in at startup");
  }

  onAuthChange(async (user) => {
  if (user) {
    console.log("✅ Logged in as:", user.email);
    token = await user.getIdToken();
    console.log("✅ New token obtained");
  } else {
    console.log("❌ User logged out");
    token = "";
  }
  });

document.getElementById("login-btn").addEventListener("click", signInWithGoogle);
document.getElementById("logout-btn").addEventListener("click", logout);

const btn = document.getElementById("transform-button");
if (btn) {
  btn.addEventListener("click", async () => {
    console.log("🔵 Tombol generate diklik!");
    
    const auth = getAuth();
    const user = auth.currentUser;
    const uid = user?.uid;

    console.log("🔵 User saat ini:", user);
    console.log("🔵 UID:", uid);

    if (!uid) {
      console.log("🔴 User belum login!");
      globalAlert("🚫 Silakan login terlebih dahulu.", "error");
      return;
    }

    console.log("🔵 Memeriksa akses model...");
    const access = await hasModelAccess(uid);
    console.log("🔵 Hasil akses:", access);
    
    if (!access) {
      console.log("🔒 Akses ditolak, user belum beli paket.");
      globalAlert("🔒 Anda perlu membeli paket untuk menggunakan fitur ini.", "warning");
      showPricingModal();
      return;
    }

    // ✅ Akses disetujui, lanjut proses
    console.log("🟢 Akses OK, memulai generate...");
    fetchUITransform();
  });
}

  const showBtn = document.getElementById("show-preview");
  const modal = document.getElementById("preview-modal");
  const closeBtn = document.getElementById("close-preview");
  const iframe = document.getElementById("preview-frame");
  const output = document.getElementById("output");
  const outputElement = document.getElementById("output-code");

  showBtn?.addEventListener("click", () => {
    const blob = new Blob([output.textContent], { type: "text/html" });
    iframe.src = URL.createObjectURL(blob);

    modal.classList.remove("hidden");
    requestAnimationFrame(() => {
      modal.classList.add("show");
    });
  });

  function closeModal() {
    modal.classList.remove("show");
    setTimeout(() => {
      modal.classList.add("hidden");
      iframe.src = "";
    }, 500);
  }

  closeBtn?.addEventListener("click", closeModal);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  function typeEffect(element, text, speed = 5) {
    let i = 0;
    const interval = setInterval(() => {
      element.textContent += text[i];
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
  }

});

document.getElementById("copy-button").addEventListener("click", () => {
  const output = document.getElementById("output");
  navigator.clipboard.writeText(output.textContent)
    .then(() => globalAlert("✅ Kode berhasil disalin!", "success"))
    .catch(() => globalAlert("❌ Gagal menyalin kode.", "error"));
});

export async function fetchUITransform() {
  console.log("🔵 fetchUITransform dipanggil!");
  
  const output = document.getElementById("output");
  const outputCode = document.getElementById("output-code");
  const iframe = document.getElementById("preview-frame");
  const loading = document.getElementById("loading");
  const model = document.getElementById("model-select").value;
  const input = document.getElementById("multi-input").value.trim();
  const reasoningPanel = document.getElementById("reasoning-panel");
  const reasoningContent = document.getElementById("reasoning-content");

  console.log("🔵 Input:", input);
  console.log("🔵 Model:", model);
  console.log("🔵 Token:", token ? "Ada" : "Tidak ada");

  // Clear previous output and reasoning
  output.textContent = "";
  if (outputCode) outputCode.textContent = "";
  iframe.src = "";
  if (reasoningContent) reasoningContent.textContent = "";
  if (reasoningPanel) reasoningPanel.classList.add("hidden");

  if (!input || input.length < 5) {
    globalAlert("🚨 Masukkan URL atau instruksi yang cukup jelas.", "warning");
    return;
  }

  // Show loading state
  loading.classList.remove("hidden");
  console.log("🔵 Loading indicator shown");
  
  // Update button to show loading
  const btn = document.getElementById("transform-button");
  if (btn) {
    btn.disabled = true;
    btn.classList.add("opacity-50", "cursor-not-allowed");
  }

  try {
const payload = {
  input: input,
  type: /^https?:\/\//i.test(input) ? "url" : "generate",
  model
};

console.log("🔵 Mengirim ke backend:", JSON.stringify(payload, null, 2));

const res = await fetch("http://localhost:8787/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` })
  },
  body: JSON.stringify(payload)
});

console.log("🔵 Response status:", res.status);

if (!res.ok) {
  let errMsg = `❌ Gagal: ${res.status}`;
  try {
    const errData = await res.json();
    if (errData?.error) {
      errMsg = errData.error;

      if (
        res.status === 429 ||
        errMsg.includes("Batas pemakaian") ||
        errMsg.includes("Kuota harian gratis")
      ) {
        showLimitModal(errMsg);
      }
    }
  } catch (_) {}

  throw new Error(errMsg);
}

    if (!res.body) throw new Error("❌ Gagal mendapatkan stream dari AI.");

    let fullHTML = "";
    await streamAndRenderAI(res, (chunk) => {
      output.textContent += chunk;
      fullHTML += chunk;
      requestAnimationFrame(() => {
        output.scrollTop = output.scrollHeight;
      });
    });

fullHTML = fullHTML.trim();

// Buang wrapper Markdown
if (fullHTML.startsWith("```html")) fullHTML = fullHTML.slice(7);
if (fullHTML.endsWith("```")) fullHTML = fullHTML.slice(0, -3);

let cleanHTML = fullHTML.trim();

// Extract reasoning content (<think>...
// or similar tags)
const reasoningMatch = cleanHTML.match(/\<think\>([\s\S]*?)\<\/think\>/i);
let reasoningText = "";

if (reasoningMatch && reasoningMatch[1]) {
  reasoningText = reasoningMatch[1].trim();
  console.log("🧠 Reasoning found:", reasoningText.substring(0, 100) + "...");
  
  // Remove reasoning from HTML output
  cleanHTML = cleanHTML.replace(/\<think\>[\s\S]*?\<\/think\>/gi, "");
  
  // Display reasoning in separate panel
  if (reasoningContent && reasoningPanel) {
    reasoningContent.textContent = reasoningText;
    reasoningPanel.classList.remove("hidden");
  }
}

// Also remove other common AI prefixes
cleanHTML = cleanHTML
  .replace(/^✅.*?\n/i, "")
  .replace(/^```html/i, "")
  .replace(/```$/i, "")
  .replace(/https:\/\/use\s+tailwindcss\.com\S*/gi, "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css")
  .trim();

const doctypeIndex = cleanHTML.indexOf("<!DOCTYPE html>");
if (doctypeIndex !== -1) {
  cleanHTML = cleanHTML.slice(doctypeIndex);
}

// Display clean HTML in output
output.textContent = cleanHTML;
if (outputCode) {
  outputCode.textContent = cleanHTML;
  if (window.hljs) {
    hljs.highlightElement(outputCode);
  }
}

iframe.src = "";
const blob = new Blob([cleanHTML], { type: "text/html" });
iframe.src = URL.createObjectURL(blob);

iframe.onload = () => {
  console.log("✅ Preview loaded successfully");
  globalAlert("✅ Generate berhasil!", "success");
};

  } catch (err) {
    console.error("❌ Error:", err);
    globalAlert(err.message || "⚠️ Terjadi kesalahan tidak diketahui.", "error");
    output.textContent = err.message || "⚠️ Terjadi kesalahan tidak diketahui.";
  } finally {
    // Hide loading state
    loading.classList.add("hidden");
    
    // Re-enable button
    if (btn) {
      btn.disabled = false;
      btn.classList.remove("opacity-50", "cursor-not-allowed");
    }
    console.log("🔵 Loading complete");
  }
}

async function showPricingModal() {
  const user = getAuth().currentUser;
  if (!user) {
    // Kalau belum login, tampilkan modal
    document.getElementById('pricing-modal')?.classList.remove('hidden');
    return;
  }

  const hasAccess = await hasModelAccess(user.uid);
  if (hasAccess) {
    console.log("✅ User sudah punya akses, modal tidak ditampilkan.");
    return;
  }

  document.getElementById('pricing-modal')?.classList.remove('hidden');
}

function showLimitModal(message = "🚫 Kuota habis. Silakan upgrade.") {
  const modal = document.getElementById("limit-modal");
  const modalMessage = document.getElementById("limit-message");

  if (modal) {
    if (modalMessage) modalMessage.textContent = message;
    modal.classList.remove("hidden");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("close-limit-modal");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const modal = document.getElementById("limit-modal");
      if (modal) modal.classList.add("hidden");
    });
  }
});

window.fetchUITransform = fetchUITransform;
