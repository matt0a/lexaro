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

export default api;
