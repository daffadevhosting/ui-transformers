import { streamAndRenderAI } from './streamAndRender.js';

export async function fetchUITransform() {
  const url = document.getElementById("target-url").value;
  const output = document.getElementById("output");
  const iframe = document.getElementById("preview-frame");

  if (!url) {
    output.value = "🚨 Masukkan URL terlebih dahulu.";
    return;
  }

  const prompt = `Berdasarkan tampilan dari website ${url}, buatkan ulang versi statis HTML + TailwindCSS.`;

  try {
    const res = await fetch("https://ui-transformers.mvstream.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.body) {
      output.value = "❌ Gagal mendapatkan stream dari AI.";
      return;
    }

    let fullHTML = "";

    await streamAndRenderAI(res, (chunk) => {
      output.value += chunk;
      fullHTML += chunk;
    });

    // ✅ Gunakan Blob URL untuk inject HTML ke iframe
    const blob = new Blob([fullHTML], { type: "text/html" });
    const blobURL = URL.createObjectURL(blob);
    iframe.src = blobURL;

  } catch (err) {
    output.value = "⚠️ Terjadi kesalahan: " + err.message;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Tombol Transformasi
  const btn = document.getElementById("transform-button");
  if (btn) {
    btn.addEventListener("click", fetchUITransform);
  }

  const toggle = document.getElementById("dark-toggle");
  if (toggle) {
    toggle.addEventListener("change", function (e) {
      const iframe = document.getElementById("preview-frame");
      const previewDoc = iframe.contentDocument || iframe.contentWindow.document;

      // Perlu tunggu iframe siap (optional: check dulu)
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
});

// ✅ Optional untuk akses global dari console/debug
window.fetchUITransform = fetchUITransform;
