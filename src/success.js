import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

const MIDTRANS_WORKER_URL = "https://midtranspay.androidbutut.workers.dev/";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const statusMessageElement = document.getElementById("status-message");
const transactionDetailsContainer = document.getElementById("transaction-details-container");
const transactionIdElement = document.getElementById("transaction-id");
const transactionAmountElement = document.getElementById("transaction-amount");
const transactionDateElement = document.getElementById("transaction-date");

/**
 * 
 * @param {string} message - The message to display.
 */
function updateStatusMessage(message) {
    if (statusMessageElement) {
        statusMessageElement.innerText = message;
    }
}

/**
 * Extracts URL parameters.
 * @param {string} name - The name of the parameter to extract.
 * @returns {string|null} The parameter value or null if not found.
 */
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

/**
 * Transaction details dari Midtrans worker.
 * @param {string} orderId - Order ID to query.
 * @returns {Promise<object|null>} Transaction details not found/error.
 */
async function fetchTransactionDetails(orderId) {
    try {
        const response = await fetch(`${MIDTRANS_WORKER_URL}?orderId=${orderId}`);
        if (!response.ok) {
            console.error(`Gagal mengambil detail transaksi: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error saat mengambil detail transaksi:", error);
        return null;
    }
}

onAuthStateChanged(auth, async (user) => {
    updateStatusMessage("Memproses langganan Anda...");

    if (user) {
        const uid = user.uid;
        const orderId = getUrlParameter('order_id');

        if (!orderId) {
            updateStatusMessage("⚠️ ID Pesanan tidak ditemukan di URL. Tidak dapat memproses langganan.");
            console.error("ID Pesanan tidak ditemukan di URL.");
            return;
        }

        try {
            const transactionDetails = await fetchTransactionDetails(orderId);

            if (!transactionDetails || (transactionDetails.transaction_status !== 'capture' && transactionDetails.transaction_status !== 'settlement')) {
                updateStatusMessage(`⚠️ Status pembayaran untuk ID Pesanan ${orderId} belum berhasil atau tidak ditemukan. Status: ${transactionDetails?.transaction_status || 'Tidak diketahui'}`);
                console.warn(`Status transaksi ${orderId} tidak berhasil:`, transactionDetails);
                return;
            }

            const purchasedModel = transactionDetails.model; // e.g., "@cf/mistralai/mistral-small-3.1-24b-instruct"
            const purchasedAmount = parseInt(transactionDetails.gross_amount); // Pastikan ini adalah angka
            const transactionTime = transactionDetails.transaction_time ? new Date(transactionDetails.transaction_time) : new Date();

            // Format amount ke Rupiah Indonesia
            const formatter = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            });
            const formattedAmount = formatter.format(purchasedAmount);

            // Format tanggal
            const formattedDate = transactionTime.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
            });

            let activePlan = "Gratis";
            let dailyLimit = 0;
            let modelsAvailable = ["@cf/qwen/qwen1.5-0.5b-chat"]; // Default for free plan

            if (purchasedAmount === 7500) {
                activePlan = "Pro 25x";
                dailyLimit = 25;
                modelsAvailable = ["@cf/qwen/qwen1.5-0.5b-chat", "@cf/meta/llama-2-7b-chat-int8", "@cf/mistralai/mistral-small-3.1-24b-instruct"];
            } else if (purchasedAmount === 12500) {
                activePlan = "Pro 50x";
                dailyLimit = 50;
                modelsAvailable = ["@cf/qwen/qwen1.5-0.5b-chat", "@cf/meta/llama-2-7b-chat-int8", "@cf/mistralai/mistral-small-3.1-24b-instruct", "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b"];
            }

            // Hitung tanggal kedaluwarsa (30 hari dari sekarang)
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            const transactionRef = doc(db, "artifacts", appId, "transactions", orderId, uid);
            await setDoc(transactionRef, {
                orderId: orderId,
                modelPurchased: model,
                amount: amount,
                purchaseDate: serverTimestamp(),
                userId: uid,
                status: transactionDetails.transaction_status, // Status dari Midtrans: 'settlement' atau 'capture'
                planType: activePlan
            });

            const userRef = doc(db, "artifacts", appId, "users", uid);
            await setDoc(userRef, {
                activePlan: activePlan,
                planExpiresAt: expiresAt.toISOString(),
                dailyLimit: dailyLimit,
                usedToday: 0, // Reset penggunaan harian saat langganan baru
                lastResetDate: serverTimestamp(), // Rekam kapan batas harian terakhir direset
                modelsAvailable: modelsAvailable,
                updatedAt: serverTimestamp()
            }, { merge: true }); // Gunakan merge: true untuk memperbarui bidang yang ada tanpa menimpa yang lain

            // Perbarui UI dengan detail transaksi
            if (transactionIdElement) transactionIdElement.innerText = `#${orderId}`;
            if (transactionAmountElement) transactionAmountElement.innerText = formattedAmount;
            if (transactionDateElement) transactionDateElement.innerText = formattedDate;

            // Tampilkan container detail transaksi
            if (transactionDetailsContainer) {
                transactionDetailsContainer.classList.remove("hidden");
            }

            // Tampilkan pesan sukses akhir
            updateStatusMessage(`✅ Langganan **${activePlan}** Anda berhasil diaktifkan! Akses premium tersedia hingga **${expiresAt.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}**.`);

        } catch (error) {
            console.error("Error saat memproses langganan:", error);
            updateStatusMessage(`❌ Terjadi kesalahan saat mengaktifkan langganan Anda: ${error.message}. Silakan hubungi dukungan.`);
        }
    } else {
        // Pengguna tidak login atau logout
        updateStatusMessage("⚠️ Anda belum login. Silakan masuk untuk melihat status langganan Anda.");
        console.warn("Pengguna tidak login saat mengakses halaman sukses.");
        setTimeout(() => {
             window.location.href = "/";
        }, 5000);
    }
});