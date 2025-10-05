'use client';

import api from './api';

export interface AuthResponse {
    id: number;
    email: string;
    token?: string | null; // register may return null if verification required
    plan: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    const token = res.data?.token ?? null;
    if (token) window.localStorage.setItem('token', token);
    return res.data;
}

export async function signup(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', { email, password });
    const token = res.data?.token ?? null;
    if (token) window.localStorage.setItem('token', token);
    return res.data;
}

export function logout() {
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem('token');
    }
}
