// src/authSetup.js
// Authentication setup - imports from central auth module

// Re-export all auth functions from the central auth module
export {
  getAuthInstance as getAuth,
  getGoogleAuthProvider,
  signInWithGoogle,
  logout,
  onAuthChange,
  getCurrentUser,
  getIdToken
} from './auth/index.js';
