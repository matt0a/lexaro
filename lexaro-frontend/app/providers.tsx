'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SidebarProvider } from '@/components/dashboard/SidebarContext';
import { setUnauthorizedHandler } from '@/lib/api';
import { logout } from '@/lib/auth';

/**
 * Root Providers component.
 *
 * Responsibilities:
 * 1. Creates a single QueryClient per browser session via useState (never at module
 *    scope — that would cause cross-request state leakage in SSR environments).
 * 2. Registers the 401 unauthorized handler on the axios instance so that expired
 *    tokens trigger a clean logout + redirect without touching window/router at
 *    module scope.
 * 3. Wraps the app with QueryClientProvider and SidebarProvider.
 * 4. Renders ReactQueryDevtools in development only.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
    /**
     * QueryClient is created once per component lifetime via the useState
     * initialiser function — safe for concurrent rendering and SSR.
     */
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // One retry on failure before surfacing the error
                        retry: 1,
                        // Do not refetch on window focus — reduces noise for this app
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    /**
     * Guards against re-entrancy: if a batch of parallel requests all 401,
     * only the first one triggers the logout+redirect flow.
     */
    const isHandlingUnauth = useRef(false);

    /**
     * Handler invoked by the axios response interceptor when a 401 is received
     * on a non-auth endpoint. Clears the token, the query cache, and redirects
     * to /login — but only if not already on the login page.
     */
    const onUnauthorized = useCallback(() => {
        if (isHandlingUnauth.current) return;
        isHandlingUnauth.current = true;

        // Remove JWT from storage
        logout();

        // Wipe all cached query data so stale data is not shown after re-login
        queryClient.clear();

        // Redirect — only if we're not already on the login page
        const LOGIN_PATH = '/login';
        const onLoginPage =
            window.location.pathname === LOGIN_PATH ||
            window.location.pathname.startsWith(LOGIN_PATH + '/');
        if (!onLoginPage) {
            window.location.href = LOGIN_PATH;
        }
    }, [queryClient]);

    useEffect(() => {
        // Register on mount
        setUnauthorizedHandler(onUnauthorized);

        // Deregister on unmount (this component unmounts only when the whole app
        // unmounts, so this is mainly for correctness / HMR during development)
        return () => setUnauthorizedHandler(() => {});
    }, [onUnauthorized]);

    return (
        <QueryClientProvider client={queryClient}>
            <SidebarProvider>
                {children}
            </SidebarProvider>
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    );
}
