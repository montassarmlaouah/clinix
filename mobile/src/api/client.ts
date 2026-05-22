import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '@/src/store/auth.store';
import { subscriptionEvents } from '@/src/api/subscriptionEvents';

// ── BASE_URL automatique — plus besoin de changer l'IP manuellement ───────────
function getBaseUrl(): string {
  // Priorité 1 : variable .env explicite (EXPO_PUBLIC_API_URL=http://x.x.x.x:8080)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Priorité 2 : en DEV → extraire l'IP depuis Expo Metro automatiquement
  if (__DEV__) {
    const hostUri =
      Constants.expoConfig?.hostUri ??
      // @ts-ignore — fallback pour anciennes versions Expo
      Constants.manifest2?.extra?.expoGo?.debuggerHost ??
      // @ts-ignore
      Constants.manifest?.debuggerHost;

    if (hostUri) {
      const ip = hostUri.split(':')[0]; // ex: "192.168.1.247"
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        const url = `http://${ip}:8080`;
        console.log('[CLINIX-API] ✅ BASE_URL auto-détectée :', url);
        return url;
      }
    }

    // Fallback DEV web → localhost
    if (Platform.OS === 'web') {
      console.log('[CLINIX-API] Web DEV → http://localhost:8080');
      return 'http://localhost:8080';
    }
  }

  // Priorité 3 : production → mettre l'URL réelle du serveur de prod
  return 'https://api.clinix.tn';
}

const BASE_URL: string = getBaseUrl();

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string>;
}

// ── Lecture token depuis le Zustand store (source de vérité) ──────────────────
function readToken(): string | null {
  const token = useAuthStore.getState().token;
  if (__DEV__) console.log('[CLINIX-API] readToken from store =', token ? '****' + token.slice(-8) : 'null');
  return token;
}

// export pour compatibilité
export const getToken = readToken;

// ── Nettoyage session ─────────────────────────────────────────────────────────
function clearAuthSession(): void {
  try {
    const { useAuthStore } = require('@/src/store/auth.store');
    useAuthStore.getState().clearAuth();
  } catch {
    /* ignore */
  }
}

// ── Client fetch principal ────────────────────────────────────────────────────
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = readToken();

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    baseHeaders['Authorization'] = `Bearer ${token}`;
  }

  const mergedHeaders: Record<string, string> = {
    ...baseHeaders,
    ...(options.headers as Record<string, string> | undefined),
  };

  // ── Timeout 10 secondes via AbortController ────────────────────────────────
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: mergedHeaders,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === 'AbortError') {
      throw {
        message: `Délai dépassé (10s) — vérifiez que le backend est démarré sur ${BASE_URL}`,
        status: 0,
      } as ApiError;
    }

    if (err instanceof TypeError) {
      throw {
        message: `Impossible de joindre ${BASE_URL} — vérifiez le WiFi et que le backend tourne`,
        status: 0,
      } as ApiError;
    }

    throw err;
  }

  // ── 401 : session expirée — le backend n'a pas de endpoint /auth/refresh-token
  if (response.status === 401) {
    clearAuthSession();
    throw { message: 'Session expirée. Veuillez vous reconnecter.', status: 401 } as ApiError;
  }

  // ── 402 Payment Required : abonnement requis ou expiré ──────────────────────
  // On laisse remonter l'erreur avec le message du backend pour que l'écran
  // appelant puisse rediriger vers checkout ou afficher un message adapté.
  if (response.status === 402) {
    let errorBody: Partial<ApiError & { message?: string }> = {};
    try { errorBody = await response.clone().json(); } catch { /* pas de body JSON */ }
    subscriptionEvents.emit();
    throw {
      message: errorBody.message ?? 'Abonnement requis. Veuillez souscrire à un plan pour continuer.',
      status: 402,
      errors: errorBody.errors,
    } as ApiError;
  }

  // ── 204 No Content ────────────────────────────────────────────────────────
  if (response.status === 204) return null as T;

  // ── Erreurs HTTP ──────────────────────────────────────────────────────────
  if (!response.ok) {
    let errorBody: Partial<ApiError & { message?: string }> = {};
    try { errorBody = await response.json(); } catch { /* pas de body JSON */ }
    const bodyErr = errorBody as { error?: string };
    throw {
      message: errorBody.message ?? bodyErr.error ?? `Erreur HTTP ${response.status}`,
      status: response.status,
      errors: errorBody.errors,
    } as ApiError;
  }

  return response.json() as Promise<T>;
}

// ── Upload multipart ──────────────────────────────────────────────────────────
export async function apiUpload<T = unknown>(
  endpoint: string,
  formData: FormData,
): Promise<T> {
  const token = readToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s pour upload

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw { message: 'Upload timeout (30s)', status: 0 } as ApiError;
    }
    if (err instanceof TypeError) {
      throw { message: `Impossible de joindre ${BASE_URL}`, status: 0 } as ApiError;
    }
    throw err;
  }

  if (response.status === 401) {
    clearAuthSession();
    throw { message: 'Session expirée. Veuillez vous reconnecter.', status: 401 } as ApiError;
  }

  if (response.status === 402) {
    let errorBody: Partial<ApiError & { message?: string }> = {};
    try { errorBody = await response.clone().json(); } catch { /* pas de body JSON */ }
    subscriptionEvents.emit();
    throw {
      message: errorBody.message ?? 'Abonnement requis. Veuillez souscrire à un plan pour continuer.',
      status: 402,
    } as ApiError;
  }

  if (response.status === 204) return null as T;

  if (!response.ok) {
    let errorBody: Partial<ApiError> = {};
    try { errorBody = await response.json(); } catch { /* ignore */ }
    throw {
      message: errorBody.message ?? `Erreur HTTP ${response.status}`,
      status: response.status,
    } as ApiError;
  }

  return response.json() as Promise<T>;
}

// ── Raccourcis ────────────────────────────────────────────────────────────────
export const apiGet = <T>(endpoint: string, options?: RequestInit): Promise<T> =>
  apiFetch<T>(endpoint, { ...options, method: 'GET' });

export const apiPost = <T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> =>
  apiFetch<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body != null ? JSON.stringify(body) : undefined,
  });

export const apiPut = <T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> =>
  apiFetch<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body != null ? JSON.stringify(body) : undefined,
  });

export const apiPatch = <T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> =>
  apiFetch<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body != null ? JSON.stringify(body) : undefined,
  });

export const apiDelete = <T = void>(endpoint: string, options?: RequestInit): Promise<T> =>
  apiFetch<T>(endpoint, { ...options, method: 'DELETE' });

/** Téléchargement binaire (PDF facture, etc.) */
export async function apiDownloadFile(
  endpoint: string,
  destFileName: string,
): Promise<string> {
  const token = readToken();
  const FileSystem = await import('expo-file-system/legacy');
  const dest = `${FileSystem.cacheDirectory}${destFileName}`;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const result = await FileSystem.downloadAsync(`${BASE_URL}${endpoint}`, dest, { headers });
  if (result.status !== 200) {
    throw { message: `Erreur téléchargement (${result.status})`, status: result.status } as ApiError;
  }
  return result.uri;
}

// ── Helpers export pour login/logout ──────────────────────────────────────────
// Token géré par le Zustand store — plus besoin d'exporter writeToken/removeToken