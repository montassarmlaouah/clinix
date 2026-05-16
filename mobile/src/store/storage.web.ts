/**
 * Storage web pour Zustand persist (navigateur)
 * On évite totalement l'import d'AsyncStorage en mode web
 */
export const storage = localStorage;
