// main.js

import { streamAndRenderAI } from './streamAndRender.js';
import { safePrompt } from './utils/promptBuilder.js';
import { setupModelPricingUI } from './modelHandler.js';
import { setupLoginUI } from './loginUI.js';
import { setupSnapCheckout } from './snapClient.js';
import { getAuth } from "firebase/auth";
import { signInWithGoogle, logout, onAuthChange } from './authSetup.js';

let token = "";
let activeMode = 'url';

// Ambil token setelah DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  setupSnapCheckout();
  setupModelPricingUI();
  setupLoginUI();

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
    </body>
</html>`;

  promptBox.value = ""; // kosongin dulu
  typeEffect(promptBox, initialText);

  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    token = await user.getIdToken();
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
    btn.addEventListener("click", fetchUITransform);
  }

  const toggle = document.getElementById("dark-toggle");
  if (toggle) {
    toggle.addEventListener("change", function (e) {
      const iframe = document.getElementById("preview-frame");
      const previewDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!previewDoc) return;

      if (e.target.checked) {
        previewDoc.documentElement.classList.add("dark");
        previewDoc.body.classList.add("bg-gray-900", "text-white");
      } else {
        previewDoc.documentElement.classList.remove("dark");
        previewDoc.body.classList.remove("bg-gray-900", "text-white");
      }
    });
  }

  const showBtn = document.getElementById("show-preview");
  const modal = document.getElementById("preview-modal");
  const closeBtn = document.getElementById("close-preview");
  const iframe = document.getElementById("preview-frame");
  const output = document.getElementById("output");

  showBtn.addEventListener("click", () => {
    const blob = new Blob([output.value], { type: "text/html" });
    iframe.src = URL.createObjectURL(blob);
    modal.classList.remove("hidden");
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    iframe.src = "";
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") modal.classList.add("hidden");
  });

  function typeEffect(element, text, speed = 40) {
    let i = 0;
    const interval = setInterval(() => {
      element.value += text[i];
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
  }

function scrollToBottom(el) {
  requestAnimationFrame(() => {
    el.scrollTop = el.scrollHeight;
  });
}

  const btnURL = document.getElementById('mode-url');
  const btnPrompt = document.getElementById('mode-prompt');
  const inputURL = document.getElementById('input-url');
  const inputPrompt = document.getElementById('input-prompt');

  btnURL.addEventListener('click', () => {
    activeMode = 'url';
    btnURL.classList.add('bg-blue-700');
    btnPrompt.classList.remove('bg-blue-700');
    inputURL.classList.remove('hidden');
    inputPrompt.classList.add('hidden');
  });

  btnPrompt.addEventListener('click', () => {
    activeMode = 'prompt';
    btnPrompt.classList.add('bg-blue-700');
    btnURL.classList.remove('bg-blue-700');
    inputPrompt.classList.remove('hidden');
    inputURL.classList.add('hidden');
  });
});

document.getElementById("copy-button").addEventListener("click", () => {
  const output = document.getElementById("output");
  navigator.clipboard.writeText(output.value)
    .then(() => alert("✅ Kode berhasil disalin!"))
    .catch(() => alert("❌ Gagal menyalin kode."));
});

export async function fetchUITransform() {
  const output = document.getElementById("output");
  const iframe = document.getElementById("preview-frame");
  const loading = document.getElementById("loading");
  let prompt = "";

  if (activeMode === 'url') {
    const url = document.getElementById("target-url").value;
    if (!url) {
      output.value = "🚨 Masukkan URL terlebih dahulu.";
      return;
    }

    output.value = "🔄 Mengambil konten dari URL...";
    loading.classList.remove("hidden");

    try {
      const rawHTML = await fetch(url).then(r => r.text());
      prompt = `Berikut adalah isi HTML dari website ${url}:

${rawHTML}

Tolong buatkan ulang tampilan ini sebagai halaman statis HTML + TailwindCSS. Jika menggunakan elemen <img>, gunakan placeholder dari https://placehold.co/ dengan teks yang relevan. Jangan sertakan JavaScript atau dependensi dinamis. Gunakan struktur yang bersih dan responsif.`.trim();
    } catch (err) {
      output.value = "⚠️ Gagal mengambil konten dari URL: " + err.message;
      loading.classList.add("hidden");
      return;
    }
  } else {
    prompt = document.getElementById("manual-prompt").value;
    if (!prompt || prompt.trim().length < 5) {
      output.value = "🚨 Masukkan instruksi yang cukup jelas.";
      return;
    }
    loading.classList.remove("hidden");
  }

  try {
    const model = document.getElementById("model-select").value;

    const res = await fetch("http://localhost:8787", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({ prompt, model })
    });

    if (!res.body) {
      output.value = "❌ Gagal mendapatkan stream dari AI.";
      loading.classList.add("hidden");
      return;
    }

    let fullHTML = "";
    output.value = "";
    iframe.src = "";

    await streamAndRenderAI(res, (chunk) => {
      output.value += chunk;
      fullHTML += chunk;

    scrollToBottom(output);
    });

    if (fullHTML.startsWith("```html")) fullHTML = fullHTML.slice(7);
    if (fullHTML.endsWith("```")) fullHTML = fullHTML.slice(0, -3);

    fullHTML = fullHTML.replace(/<img\s+[^>]*src="[^"]+"\s*alt="([^"]*)"/g, (match, alt) => {
      const text = encodeURIComponent(alt || "Image");
      return `<img src="https://placehold.co/300x200?text=${text}" alt="${alt}"`;
    });

    if (fullHTML.length < 1000) {
      output.value += "\n\n✅ Output pendek, tapi HTML valid. Cek dulu hasilnya, yaa.";
    }

    const blob = new Blob([fullHTML], { type: "text/html" });
    iframe.src = URL.createObjectURL(blob);

    iframe.onload = () => {
      const toggle = document.getElementById("dark-toggle");
      if (toggle.checked) {
        const previewDoc = iframe.contentDocument || iframe.contentWindow.document;
        previewDoc.documentElement.classList.add("dark");
        previewDoc.body.classList.add("bg-gray-900", "text-white");
      }
    };

  } catch (err) {
    output.value = "⚠️ Terjadi kesalahan: " + err.message;
  } finally {
    loading.classList.add("hidden");
  }
}

window.fetchUITransform = fetchUITransform;
