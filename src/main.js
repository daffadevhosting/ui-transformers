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
      <p class="text-gray-600 max-w-md">Tapi saat ini Lyra udah pindah ke kesini 👉 <a href="https://coda-code.vercel.app" class="text-blue-500 font-bold">CoDa Code</a> yuuu dicoba.. 😉️</p>
    </body>
</html>`;


  promptBox.textContent = ""; // kosongin dulu
  typeEffect(promptBox, initialText);

  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    token = await user.getIdToken();
      await updatePricingUI(user.uid);
  }

  onAuthChange((user) => {
  if (user) {
    console.log("✅ Logged in as:", user.email);
  } else {
    console.log("❌ User logged out");
  }
  });

document.getElementById("login-btn").addEventListener("click", signInWithGoogle);
document.getElementById("logout-btn").addEventListener("click", logout);

const btn = document.getElementById("transform-button");
if (btn) {
  btn.addEventListener("click", async () => {
    const user = getAuth().currentUser;
    const uid = user?.uid;

    if (!uid) {
      globalAlert("🚫 Silakan login terlebih dahulu.", "error");
      return;
    }

    const access = await hasModelAccess(uid);
    if (!access) {
      console.log("🔒 Akses ditolak, user belum beli paket.");
      showPricingModal(); // tetap bisa dipanggil, meski modal gak muncul kalau udah punya
      return;
    }

    // ✅ Akses disetujui, lanjut proses
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
  const output = document.getElementById("output");
  const iframe = document.getElementById("preview-frame");
  const loading = document.getElementById("loading");
  const model = document.getElementById("model-select").value;
  const input = document.getElementById("multi-input").value.trim();

  output.textContent = "";
  iframe.src = "";

  if (!input || input.length < 5) {
    output.textContent = "🚨 Masukkan URL atau instruksi yang cukup jelas.";
    return;
  }

  if (!token && getModelPrice(model) > 0) {
    showPricingModal();
    return;
  }

  loading.classList.remove("hidden");


  try {
const model = document.getElementById("model-select").value;
const userInput = document.getElementById("multi-input").value.trim();
const isURL = /^https?:\/\//i.test(userInput);
const activeType = isURL ? "url" : "generate";

const payload = {
  input: userInput,
  type: activeType,
  model
};

console.log("Data yang dikirim ke backend:", JSON.stringify(payload, null, 2));

const res = await fetch("http://localhost:8787", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` })
  },
  body: JSON.stringify(payload)
});

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

let displayedHTML = fullHTML;
if (fullHTML.length < 1000) {
  displayedHTML += "";
}
output.textContent = displayedHTML;
let cleanHTML = fullHTML.trim();

cleanHTML = cleanHTML
  .replace(/^<think>[\s\S]*?<\/think>/i, "")
  .replace(/^✅.*?\n/i, "")
  .replace(/^```html/i, "")
  .replace(/```$/i, "")
  .replace(/https:\/\/use\s+tailwindcss\.com\S*/gi, "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css")
  .trim();

const doctypeIndex = cleanHTML.indexOf("<!DOCTYPE html>");
if (doctypeIndex !== -1) {
  cleanHTML = cleanHTML.slice(doctypeIndex);
}

iframe.src = "";
const blob = new Blob([cleanHTML], { type: "text/html" });
iframe.src = URL.createObjectURL(blob);

iframe.onload = () => {
  const previewDoc = iframe.contentDocument || iframe.contentWindow.document;
};

  } catch (err) {
    output.textContent = err.message || "⚠️ Terjadi kesalahan tidak diketahui.";
  } finally {
    loading.classList.add("hidden");
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
