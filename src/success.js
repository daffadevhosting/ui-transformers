// /src/success.js

// Use global firebase config or define defaults
const firebaseConfig = {
  apiKey: window.FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
  authDomain: window.FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: window.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
  appId: window.FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || ''
};

// Inisialisasi Firebase
let app, auth, db;

try {
  if (window.firebase) {
    app = window.initializeApp ? window.initializeApp(firebaseConfig) : null;
    auth = window.getAuth ? window.getAuth(app) : null;
    db = window.getFirestore ? window.getFirestore(app) : null;
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
}

// Fallback functions if Firebase is not available
function getAuthFallback() {
  if (window.firebase && window.firebase.auth) {
    return window.firebase.auth();
  }
  return null;
}

function getFirestoreFallback() {
  if (window.firebase && window.firebase.firestore) {
    return window.firebase.firestore();
  }
  return null;
}

function getDocFallback(ref) {
  return ref.get();
}

function onAuthStateChangedFallback(auth, callback) {
  if (auth && auth.onAuthStateChanged) {
    auth.onAuthStateChanged(callback);
  }
}

/**
 * Fungsi untuk menunda eksekusi selama beberapa milidetik.
 * @param {number} ms - Waktu tunda dalam milidetik.
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mengambil detail transaksi dari Firestore dengan mekanisme coba-lagi.
 * @param {string} uid - User ID dari pengguna yang terautentikasi.
 * @param {string} orderId - Order ID dari URL.
 */
async function fetchTransactionDetails(uid, orderId) {
  // Dapatkan elemen-elemen DOM untuk diisi nanti
  const statusMessageEl = document.getElementById('status-message');
  const detailsContainerEl = document.getElementById('transaction-details-container');
  const transactionIdEl = document.getElementById('transaction-id');
  const transactionAmountEl = document.getElementById('transaction-amount');
  const transactionDateEl = document.getElementById('transaction-date');

  if (!uid || !orderId) {
    if (statusMessageEl) {
      statusMessageEl.textContent = "Error: Informasi pengguna atau ID transaksi tidak ditemukan.";
      statusMessageEl.classList.add('text-red-500');
    }
    return;
  }

  // Try to get Firestore instance
  const firestore = db || getFirestoreFallback();
  
  if (!firestore) {
    if (statusMessageEl) {
      statusMessageEl.textContent = "Firestore tidak tersedia. Silakan coba lagi nanti.";
      statusMessageEl.classList.add('text-red-500');
    }
    return;
  }

  const transactionRef = firestore.doc(`users/${uid}/transactions/${orderId}`);
  let docSnap;
  const maxRetries = 5;
  const retryDelay = 2000;

  for (let i = 0; i < maxRetries; i++) {
    console.log(`Mencoba mengambil data transaksi... (Percobaan ${i + 1})`);
    docSnap = await (transactionRef.get ? transactionRef.get() : getDocFallback(transactionRef));

    if (docSnap.exists) {
      console.log("\u2705 Data transaksi ditemukan!", docSnap.data());
      const data = docSnap.data();

      // Format data untuk ditampilkan
      const amountFormatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(data.amount);

      const purchaseDate = data.purchaseDate.toDate ? data.purchaseDate.toDate() : new Date(data.purchaseDate);
      const dateFormatted = purchaseDate.toLocaleString('id-ID', {
        dateStyle: 'full',
        timeStyle: 'short'
      });

      // Isi data ke elemen HTML
      if (transactionIdEl) transactionIdEl.textContent = `#${data.orderId}`;
      if (transactionAmountEl) transactionAmountEl.textContent = amountFormatted;
      if (transactionDateEl) transactionDateEl.textContent = dateFormatted;

      // Tampilkan container detail dan perbarui pesan status
      if (statusMessageEl) {
        statusMessageEl.textContent = "Terima kasih! Pembelian Anda telah kami konfirmasi.";
      }
      if (detailsContainerEl) {
        detailsContainerEl.classList.remove('hidden');
      }
      return;
    }

    // Jika dokumen belum ada, tunggu sebelum mencoba lagi
    console.log(`Dokumen belum ditemukan. Menunggu ${retryDelay / 1000} detik...`);
    await sleep(retryDelay);
  }

  // Jika setelah semua percobaan data tidak ditemukan
  console.error("Gagal menemukan data transaksi setelah beberapa kali percobaan.");
  if (statusMessageEl) {
    statusMessageEl.textContent = "Kami masih memproses transaksi Anda. Silakan cek kembali beberapa saat lagi atau hubungi dukungan.";
    statusMessageEl.classList.add('text-yellow-600');
  }
}

// Jalankan kode setelah halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  const statusMessageEl = document.getElementById('status-message');
  
  // 1. Dapatkan Order ID dari URL
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order_id');

  if (!orderId) {
    if (statusMessageEl) {
      statusMessageEl.textContent = "ID Transaksi tidak ditemukan di URL.";
      statusMessageEl.classList.add('text-red-500');
    }
    return;
  }

  // 2. Cek status autentikasi pengguna
  const authInstance = auth || getAuthFallback();
  
  if (!authInstance) {
    if (statusMessageEl) {
      statusMessageEl.textContent = "Firebase Auth tidak tersedia. Silakan refresh halaman.";
      statusMessageEl.classList.add('text-red-500');
    }
    return;
  }

  const onAuthChanged = window.onAuthStateChanged || onAuthStateChangedFallback;
  
  onAuthChanged(authInstance, (user) => {
    if (user) {
      // Pengguna sudah login, dapatkan UID
      const uid = user.uid;
      console.log(`Pengguna terautentikasi dengan UID: ${uid}`);
      // 3. Panggil fungsi untuk mengambil data transaksi
      fetchTransactionDetails(uid, orderId);
    } else {
      // Pengguna belum login
      console.error("Pengguna tidak terautentikasi.");
      if (statusMessageEl) {
        statusMessageEl.textContent = "Anda harus login untuk melihat detail transaksi. Silakan login dan coba lagi.";
        statusMessageEl.classList.add('text-red-500');
      }
    }
  });
});
