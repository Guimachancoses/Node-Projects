// src/utils/clerk.js
export async function signOutClerk() {
    if (window.Clerk) {
      await window.Clerk.signOut();
    } else {
      console.warn("Clerk não está disponível no window.");
    }
  }
  