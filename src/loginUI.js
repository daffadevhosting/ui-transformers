// loginUI.js
import {
  signInWithGoogle,
  logout,
  onAuthChange
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
