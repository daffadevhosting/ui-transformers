## 🚀 UI Transformers by Lyra

Transformasi antarmuka berbasis AI, dari URL atau prompt, jadi halaman statis TailwindCSS yang ringan, responsif, dan siap pakai. Project ini dibangun dengan semangat minimalis dan kecepatan ⚡️.

[![License](https://img.shields.io/github/license/daffadevhosting/ui-transformers)](LICENSE)
[![Deploy](https://img.shields.io/badge/Cloudflare-Live-green)](https://glitchlab-master.daffadev.workers.dev/)

---

### ✨ Fitur Utama

- ✅ Masukkan URL website → Dapatkan versi ulang dengan TailwindCSS
- 🧠 Tulis prompt bebas → Dihasilkan full HTML siap deploy
- 🪄 Magic Button + Auto Scroll saat AI mengetik
- 🎨 Pratinjau langsung dalam modal fullscreen
- 💳 Sistem pembayaran Midtrans Snap + Model AI premium
- 🔐 Integrasi Firebase Auth (Google Login)
- 📈 Limit harian/mingguan untuk pengguna gratis & premium
- ☁️ Backend: Cloudflare Workers + KV Storage + AI Gateway

---

### 🧰 Stack Teknologi

- **Frontend**: Jekyll + Vanilla JS + TailwindCSS
- **Backend**: Cloudflare Workers (Serverless)
- **AI Provider**: Cloudflare AI Gateway (Qwen, LLaMA, Mistral, deepseek)
- **Auth**: Firebase Auth (Google OAuth)
- **Database**: Firestore (untuk user dan status premium)
- **Payment**: Midtrans Snap

---

### ⚙️ Cara Instalasi (Dev Mode)

1. **Clone repo ini**
```bash
git clone https://github.com/daffadevhosting/ui-transformers.git
cd ui-transformers
```

2. **Pasang dependensi frontend**
```bash
bundle install
bundle exec jekyll s
```

3. **Jalankan Cloudflare Worker lokal**
```bash
wrangler dev
```

4. **Setting `.env` frontend**
```md
FIREBASE_API_KEY=******************-xgFk
FIREBASE_AUTH_DOMAIN=************.firebaseapp.com
FIREBASE_PROJECT_ID=projectlo
FIREBASE_APP_ID=1:**********:web:************
MIDTRANS_URL=https://midtrans.workers.dev/snap
```

---

### 🛠️ Konfigurasi

#### 🔑 Midtrans
- Pastikan kamu punya akun sandbox Midtrans
- Atur `clientKey` & `serverKey` di script dan Worker

#### 🔥 Firebase
- Aktifkan Google Auth
- Siapkan project ID dan masukkan di `firebaseConfig`

#### ☁️ Cloudflare Worker
- Setting `wrangler.jsonc` dengan:
  - `KV namespace` untuk limit
  - `AI` binding
  - `vars` (API_KEY, MODEL default, dll)

---

### 🧪 Contoh Prompt
```text
Buatkan hero section untuk aplikasi produktivitas. Sertakan CTA dan gambar.
```

```text
Ambil desain dari https://github.com lalu ubah jadi responsive layout Tailwind.
```

---

### 💳 Paket Premium

| Paket        | Model                                          | Limit Generate | Estimasi Biaya Max | Harga Jual |
| ------------ | ---------------------------------------------- | -------------- | ------------------ | ---------- |
| **Gratis**   | `@cf/qwen/qwen1.5-1.8b-chat`                   | 2x             | Rp 0               | Rp 0       |
| **Medium**   | `@cf/meta/llama-3.2-3b-instruct`               | 25x            | \~Rp 8.000         | Rp 29.000  |
| **Advanced** | `@cf/mistral/mistral-7b-instruct-v0.2-lora`    | 35x            | \~Rp 18.000        | Rp 39.000  |
| **Expert**   | `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` | 50x            | \~Rp 23.000        | Rp 69.000  |

---

### 📄 Lisensi
MIT License © 2025 GlitchLab

---

### 💡 Credits

- Dibuat dengan ❤️ oleh tim GlitchLab & Lyra
- Powered by Cloudflare, Midtrans, dan Firebase