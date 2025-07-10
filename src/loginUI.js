// loginUI.js
import {
  signInWithGoogle,
  logout,
  onAuthChange,
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider
} from './authSetup.js';

export function setupLoginUI() {
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const userInfo = document.getElementById("user-info");

  loginBtn.addEventListener("click", signInWithGoogle);
  logoutBtn.addEventListener("click", logout);

  onAuthChange((user) => {
    if (user) {
      loginBtn.classList.add("hidden");
      logoutBtn.classList.remove("hidden");
      userInfo.classList.remove("hidden");
      userInfo.innerText = `👤 ${user.displayName || user.email}`;
    } else {
      loginBtn.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
      userInfo.classList.add("hidden");
      userInfo.innerText = "";
    }
  });
}

export function setupLoginModal() {
  const modal = document.getElementById("login-modal");
  const openLogin = () => modal.classList.remove("hidden");
  const closeLogin = () => modal.classList.add("hidden");

  // Tombol Google Login
  document.getElementById("google-login-btn").addEventListener("click", async () => {
    try {
      const provider = new GoogleAuthProvider();
      const auth = getAuth();
      await signInWithPopup(auth, provider);
      closeLogin(); // Tutup modal setelah login sukses
    } catch (err) {
      alert("❌ Gagal login: " + err.message);
    }
  });

  // Tombol batal
  document.getElementById("close-login-modal").addEventListener("click", closeLogin);

  // Ekspor pemicu manual
  window.requireLogin = () => {
    const user = getAuth().currentUser;
    if (!user) openLogin();
    return !!user;
  };
}
