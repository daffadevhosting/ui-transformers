// src/loginUI.js
// Login UI setup - imports auth functions from central auth module

import { getAuthInstance, signInWithGoogle, logout, onAuthChange, getCurrentUser } from './auth/index.js';

export function setupLoginUI() {
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const userInfo = document.getElementById("user-info");

  if (loginBtn) loginBtn.addEventListener("click", signInWithGoogle);
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  onAuthChange((user) => {
    if (user) {
      if (loginBtn) loginBtn.classList.add("hidden");
      if (logoutBtn) logoutBtn.classList.remove("hidden");
      if (userInfo) {
        userInfo.classList.remove("hidden");
        userInfo.innerText = `\ud83d\udc64 ${user.displayName || user.email}`;
      }
    } else {
      if (loginBtn) loginBtn.classList.remove("hidden");
      if (logoutBtn) logoutBtn.classList.add("hidden");
      if (userInfo) {
        userInfo.classList.add("hidden");
        userInfo.innerText = "";
      }
    }
  });
}

export function setupLoginModal() {
  const modal = document.getElementById("login-modal");
  const googleLoginBtn = document.getElementById("google-login-btn");
  const closeLoginModalBtn = document.getElementById("close-login-modal");

  if (!modal) {
    console.warn("Elemen 'login-modal' tidak ditemukan. Fungsi setupLoginModal mungkin tidak berfungsi.");
    return;
  }

  const openLogin = () => modal.classList.remove("hidden");
  const closeLogin = () => modal.classList.add("hidden");

  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", async () => {
      try {
        await signInWithGoogle();
        closeLogin();
      } catch (err) {
        if (window.globalAlert) {
          window.globalAlert("\u274c Gagal login: " + err.message, "error");
        }
      }
    });
  }

  if (closeLoginModalBtn) {
    closeLoginModalBtn.addEventListener("click", closeLogin);
  }

  // Export manual trigger
  window.requireLogin = () => {
    try {
      const auth = getAuthInstance();
      if (!auth.currentUser) {
        openLogin();
        return false;
      }
      return true;
    } catch (error) {
      console.error("Kesalahan saat memeriksa status login:", error);
      return false;
    }
  };
}

// Re-export auth functions for backward compatibility
export { getAuthInstance as getAuth, signInWithGoogle, logout, onAuthChange, getCurrentUser };
