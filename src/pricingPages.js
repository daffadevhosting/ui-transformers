import { getAuth, onAuthStateChanged } from "firebase/auth";

// 🔥 Panggil Midtrans dan kirim order
async function generateSnapToken({ model, amount, uid }) {
  const orderId = `order-${Date.now()}`;
  const response = await fetch("https://midtranspay.androidbutut.workers.dev/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ orderId, gross_amount: amount, model, uid })
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Gagal mendapatkan Snap Token");
  return result.token;
}

function setupPayButtons() {
  const buttons = document.querySelectorAll(".pay-button");

  buttons.forEach(button => {
    button.addEventListener("click", async () => {
      const model = button.dataset.model;
      const amount = parseInt(button.dataset.amount);
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        alert("🚫 Silakan login terlebih dahulu sebelum melakukan pembelian.");
        return;
      }

      try {
        button.disabled = true;
        button.textContent = "🔄 Membuka pembayaran...";
        const snapToken = await generateSnapToken({ model, amount, uid: user.uid });

        window.snap.pay(snapToken, {
          onSuccess: (result) => {
            alert("✅ Pembayaran berhasil!");
            location.href = `/success.html?order_id=${result.order_id}`;
          },
          onPending: () => {
            alert("⏳ Pembayaran sedang diproses.");
          },
          onError: () => {
            alert("❌ Pembayaran gagal.");
          },
          onClose: () => {
            button.disabled = false;
            button.textContent = "Beli Sekarang";
          }
        });

      } catch (err) {
        alert("❌ Error: " + err.message);
        button.disabled = false;
        button.textContent = "Beli Sekarang";
      }
    });
  });
}

// 🔥 Auto-hide tombol jika model sudah dibeli
async function hidePurchasedButtons(uid) {
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/glitchlab-ai/databases/(default)/documents/transactions?mask.fieldPaths=model&mask.fieldPaths=uid`);
  const { documents = [] } = await res.json();

  const ownedModels = documents
    .filter(doc => doc.fields?.uid?.stringValue === uid)
    .map(doc => doc.fields.model.stringValue);

  document.querySelectorAll(".pay-button").forEach(btn => {
    if (ownedModels.includes(btn.dataset.model)) {
      btn.classList.add("hidden");
      const info = document.createElement("span");
      info.className = "text-green-500 text-sm mt-2";
      info.textContent = "✅ Sudah Dibeli";
      btn.parentElement.appendChild(info);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupPayButtons();

  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      hidePurchasedButtons(user.uid);
    }
  });
});