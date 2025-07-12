// /src/success.js

// Impor fungsi yang diperlukan dari Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore.js";

// --- KONFIGURASI FIREBASE ---
// Ganti dengan konfigurasi project Firebase Anda
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "glitchlab-ai.firebaseapp.com",
  projectId: "glitchlab-ai",
  appId: "1:807047215761:web:416168acd2080ab80b1d30"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
        statusMessageEl.textContent = "Error: Informasi pengguna atau ID transaksi tidak ditemukan.";
        statusMessageEl.classList.add('text-red-500');
        return;
    }

    const transactionRef = doc(db, "users", uid, "transactions", orderId);
    let docSnap;
    const maxRetries = 5; // Coba sebanyak 5 kali
    const retryDelay = 2000; // Jeda 2 detik antar percobaan

    for (let i = 0; i < maxRetries; i++) {
        console.log(`Mencoba mengambil data transaksi... (Percobaan ${i + 1})`);
        docSnap = await getDoc(transactionRef);

        if (docSnap.exists()) {
            console.log("✅ Data transaksi ditemukan!", docSnap.data());
            const data = docSnap.data();

            // Format data untuk ditampilkan
            const amountFormatted = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(data.amount);

            const purchaseDate = data.purchaseDate.toDate(); // Konversi Firestore Timestamp ke JS Date
            const dateFormatted = purchaseDate.toLocaleString('id-ID', {
                dateStyle: 'full',
                timeStyle: 'short'
            });

            // Isi data ke elemen HTML
            transactionIdEl.textContent = `#${data.orderId}`;
            transactionAmountEl.textContent = amountFormatted;
            transactionDateEl.textContent = dateFormatted;

            // Tampilkan container detail dan perbarui pesan status
            statusMessageEl.textContent = "Terima kasih! Pembelian Anda telah kami konfirmasi.";
            detailsContainerEl.classList.remove('hidden');
            return; // Keluar dari fungsi jika berhasil
        }

        // Jika dokumen belum ada, tunggu sebelum mencoba lagi
        console.log(`Dokumen belum ditemukan. Menunggu ${retryDelay / 1000} detik...`);
        await sleep(retryDelay);
    }

    // Jika setelah semua percobaan data tidak ditemukan
    console.error("Gagal menemukan data transaksi setelah beberapa kali percobaan.");
    statusMessageEl.textContent = "Kami masih memproses transaksi Anda. Silakan cek kembali beberapa saat lagi atau hubungi dukungan.";
    statusMessageEl.classList.add('text-yellow-600');
}


// Jalankan kode setelah halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    const statusMessageEl = document.getElementById('status-message');
    
    // 1. Dapatkan Order ID dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');

    if (!orderId) {
        statusMessageEl.textContent = "ID Transaksi tidak ditemukan di URL.";
        statusMessageEl.classList.add('text-red-500');
        return;
    }

    // 2. Cek status autentikasi pengguna
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Pengguna sudah login, dapatkan UID
            const uid = user.uid;
            console.log(`Pengguna terautentikasi dengan UID: ${uid}`);
            // 3. Panggil fungsi untuk mengambil data transaksi
            fetchTransactionDetails(uid, orderId);
        } else {
            // Pengguna belum login
            console.error("Pengguna tidak terautentikasi.");
            statusMessageEl.textContent = "Anda harus login untuk melihat detail transaksi. Silakan login dan coba lagi.";
            statusMessageEl.classList.add('text-red-500');
        }
    });
});
