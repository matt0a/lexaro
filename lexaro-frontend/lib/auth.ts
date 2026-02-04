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

/**
 * Verifies a user's email using the verification token.
 * On success, stores the JWT token and returns auth response.
 */
export async function verifyEmail(token: string): Promise<AuthResponse> {
    const res = await api.get<AuthResponse>('/auth/verify', { params: { token } });
    if (res.data?.token) {
        window.localStorage.setItem('token', res.data.token);
    }
    return res.data;
}

/**
 * Requests a new verification email to be sent.
 * May return 429 if called too frequently.
 */
export async function resendVerification(email: string): Promise<void> {
    await api.post('/auth/verify/resend', { email });
}

/**
 * Initiates the password reset flow by sending a reset email.
 * Always succeeds (200 OK) to prevent email enumeration.
 */
export async function forgotPassword(email: string): Promise<void> {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    await api.post('/auth/forgot', { email, baseUrl });
}

/**
 * Resets a user's password using the reset token.
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset', { token, newPassword });
}
