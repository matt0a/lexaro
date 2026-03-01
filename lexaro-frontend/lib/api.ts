'use client';

import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080',
    withCredentials: false,
});

// Attach JWT if present (works across Axios versions)
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = window.localStorage.getItem('token');
        if (token) {
            // headers may be undefined or AxiosHeaders – handle both
            if (!config.headers) config.headers = {};

            const h = config.headers as any;
            if (typeof h.set === 'function') {
                // AxiosHeaders API (Axios 1.x)
                h.set('Authorization', `Bearer ${token}`);
            } else {
                // Plain object
                (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
            }
        }
    }
    return config;
});

/**
 * Module-level callback invoked when the server returns 401 on a
 * non-auth endpoint. Registered by the root Providers component via
 * setUnauthorizedHandler() so that no window/router access happens at
 * module scope (which would be unsafe during SSR).
 *
 * Initialised to null — the interceptor below is a no-op until the
 * Providers component registers a handler at client mount time.
 */
let _onUnauthorized: (() => void) | null = null;

/**
 * Register the callback that will be invoked on a 401 response.
 * Call this once from a 'use client' component (the root Providers).
 * Pass an empty function to deregister.
 */
export function setUnauthorizedHandler(fn: () => void): void {
    _onUnauthorized = fn;
}

/**
 * Response interceptor: if the server returns 401 or 403 on a non-auth
 * endpoint, call the registered unauthorized handler so the app can
 * clear state and redirect to /login.
 *
 * Both status codes indicate the request was not authorized:
 * - 401: missing or expired token (standard unauthorized)
 * - 403: Spring Security rejects a malformed/invalid JWT token before
 *        the controller runs (JwtAuthFilter silently drops bad tokens,
 *        leaving the request unauthenticated, which yields 403 Forbidden)
 *
 * Auth endpoints (/auth/**) are excluded because they legitimately
 * return 401 for bad credentials and must not trigger a redirect loop.
 */
api.interceptors.response.use(
    (res) => res,
    (error) => {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
            const url: string = error.config?.url ?? '';
            // Skip auth endpoints — they legitimately return 401/403 (bad credentials)
            const isAuthEndpoint = url.includes('/auth/');
            if (!isAuthEndpoint && _onUnauthorized) {
                _onUnauthorized();
            }
        }
        return Promise.reject(error);
    }
);

export default api;
