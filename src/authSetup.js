// authSetup.js
export function getAuthInstance() {
    // Karena menggunakan compat SDK, kita bisa langsung mengaksesnya dari namespace global
    if (window.firebase && window.firebase.auth) {
        return window.firebase.auth();
    } else {
        console.error("Firebase Auth belum diinisialisasi atau SDK tidak dimuat.");
        throw new Error("Firebase Auth tidak tersedia.");
    }
}

// Dapatkan instance Google Auth Provider
export function getGoogleAuthProvider() {
    if (window.firebase && window.firebase.auth && window.firebase.auth.GoogleAuthProvider) {
        return new window.firebase.auth.GoogleAuthProvider();
    } else {
        console.error("GoogleAuthProvider tidak tersedia.");
        throw new Error("GoogleAuthProvider tidak tersedia.");
    }
}

export async function signInWithGoogle() {
    try {
        const auth = getAuthInstance();
        const provider = getGoogleAuthProvider();
        await auth.signInWithPopup(provider); // Menggunakan signInWithPopup dari instance auth compat
        console.log("✅ Login dengan Google berhasil!");
    } catch (error) {
        globalAlert("❌ Gagal login dengan Google: " + error.message, "error");
        console.error("Error saat login dengan Google:", error);
    }
}

export function logout() {
    try {
        const auth = getAuthInstance();
        auth.signOut(); // Menggunakan signOut dari instance auth compat
        console.log("✅ Pengguna berhasil logout.");
    } catch (error) {
        console.error("❌ Gagal logout:", error);
    }
}

export function onAuthChange(callback) {
    const auth = getAuthInstance();
    auth.onAuthStateChanged(callback); // Menggunakan onAuthStateChanged dari instance auth compat
}

export function getCurrentUser() {
    const auth = getAuthInstance();
    return auth.currentUser;
}

export async function getIdToken() {
    const user = getCurrentUser();
    if (!user) {
        console.warn("Tidak ada pengguna yang login untuk mendapatkan ID token.");
        return null;
    }
    try {
        return await user.getIdToken();
    } catch (error) {
        console.error("Gagal mendapatkan ID token:", error);
        return null;
    }
}