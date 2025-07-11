// utils/promptBuilder.js

export function safePrompt({ html = "", url = "", maxLength = 4000 }) {
  // Bersihin HTML dari spasi berlebihan
  let cleaned = html.replace(/\s+/g, " ").trim();

  // Potong kalau terlalu panjang
  if (cleaned.length > maxLength) {
    const slice = cleaned.slice(0, maxLength);
    const safeCut = slice.lastIndexOf(">") || maxLength;
    cleaned = slice.slice(0, safeCut + 1) + "\n<!-- Dipotong agar sesuai konteks model -->";
  }

  // Bangun prompt
  return `
Berikut adalah isi HTML dari website ${url}:

${cleaned}

Tolong buatkan ulang tampilan ini sebagai halaman statis HTML + TailwindCSS.
Jika menggunakan elemen <img>, gunakan placeholder dari https://placehold.co/ dengan teks yang relevan.
Jangan sertakan JavaScript atau dependensi dinamis. Gunakan struktur yang bersih dan responsif.
`.trim();
}
