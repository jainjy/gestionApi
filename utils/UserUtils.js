// src/utils/userUtils.js

// Cette fonction récupère l'email de l'utilisateur connecté stocké dans localStorage
export function getEmailClient() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.email || null;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'email :", error);
    return null;
  }
}
