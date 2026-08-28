// src/auth/index.js
// Single source of truth for authentication functions

/**
 * Get Firebase Auth instance
 * @returns {Object} Firebase Auth instance
 * @throws {Error} If Firebase Auth is not available
 */
export function getAuthInstance() {
    if (window.firebase && window.firebase.auth) {
        return window.firebase.auth();
    } else {
        console.error("Firebase Auth belum diinisialisasi atau SDK tidak dimuat.");
        throw new Error("Firebase Auth tidak tersedia.");
    }
}

/**
 * Get Google Auth Provider instance
 * @returns {Object} Google Auth Provider instance
 * @throws {Error} If GoogleAuthProvider is not available
 */
export function getGoogleAuthProvider() {
    if (window.firebase && window.firebase.auth && window.firebase.auth.GoogleAuthProvider) {
        return new window.firebase.auth.GoogleAuthProvider();
    } else {
        console.error("GoogleAuthProvider tidak tersedia.");
        throw new Error("GoogleAuthProvider tidak tersedia.");
    }
}

/**
 * Sign in with Google
 * @returns {Promise<Object>} User object
 */
export async function signInWithGoogle() {
    try {
        const auth = getAuthInstance();
        const provider = getGoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        console.log("\u2705 Login dengan Google berhasil!");
        return result.user;
    } catch (error) {
        console.error("\u274c Gagal login dengan Google:", error);
        if (window.globalAlert) {
            window.globalAlert("\u274c Gagal login dengan Google: " + error.message, "error");
        }
        throw error;
    }
}

/**
 * Logout current user
 */
export function logout() {
    try {
        const auth = getAuthInstance();
        auth.signOut();
        console.log("\u2705 Pengguna berhasil logout.");
    } catch (error) {
        console.error("\u274c Gagal logout:", error);
    }
}

/**
 * Register callback for auth state changes
 * @param {Function} callback - Function to call when auth state changes
 */
export function onAuthChange(callback) {
    const auth = getAuthInstance();
    auth.onAuthStateChanged(callback);
}

/**
 * Get current user
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
    const auth = getAuthInstance();
    return auth.currentUser;
}

/**
 * Get ID token for current user
 * @returns {Promise<string|null>} ID token or null
 */
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

// Alias for compatibility with existing code
export const getAuth = getAuthInstance;
