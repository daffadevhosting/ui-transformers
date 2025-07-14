// authSetup.js

export function getAuthInstance() {
  if (window.firebase && window.firebase.auth) {
    return window.firebase.auth();
  } else {
    console.error("Firebase Auth belum diinisialisasi atau SDK tidak dimuat.");
    throw new Error("Firebase Auth tidak tersedia.");
  }
}

export function getGoogleAuthProvider() {
  if (window.firebase && window.firebase.auth && window.firebase.auth.GoogleAuthProvider) {
    return new window.firebase.auth.GoogleAuthProvider();
  } else {
    console.error("GoogleAuthProvider tidak tersedia.");
    throw new Error("GoogleAuthProvider tidak tersedia.");
  }
}

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

export async function signInWithGoogle() {
  try {
    const auth = getAuthInstance();
    const provider = getGoogleAuthProvider(); // Gunakan fungsi pembantu
    const result = await auth.signInWithPopup(provider);
    console.log("✅ Login berhasil:", result.user.displayName || result.user.email);
    return result.user;
  } catch (error) {
    console.error("❌ Gagal login dengan Google:", error);
    throw error; // Lempar error agar bisa ditangani di UI
  }
}

export async function logout() {
  try {
    const auth = getAuthInstance();
    await auth.signOut();
    console.log("✅ Pengguna berhasil logout.");
  } catch (error) {
    console.error("❌ Gagal logout:", error);
    throw error;
  }
}

export function onAuthChange(callback) {
  const auth = getAuthInstance();
  auth.onAuthStateChanged(callback);
}

export function setupLoginModal() { // <-- Tambahkan 'export' di sini
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
        // Asumsi signInWithGoogle diimpor dengan benar dari authSetup.js
        await signInWithGoogle();
        closeLogin();
      } catch (err) {
        globalAlert("❌ Gagal login: " + err.message, "error");
      }
    });
  }

  if (closeLoginModalBtn) {
    closeLoginModalBtn.addEventListener("click", closeLogin);
  }

  // Ekspor pemicu manual
  window.requireLogin = () => {
    try {
      // Asumsi getAuthInstance diimpor dengan benar dari authSetup.js
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
