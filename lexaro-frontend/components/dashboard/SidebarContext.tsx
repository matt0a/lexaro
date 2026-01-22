"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type SidebarCtx = {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
    toggle: () => void;
};

const Ctx = createContext<SidebarCtx | null>(null);

const KEY = "lexaro.sidebar.collapsed";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);

    // Load preference
    useEffect(() => {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw === "1") setCollapsed(true);
        } catch {}
    }, []);

    // Persist preference
    useEffect(() => {
        try {
            localStorage.setItem(KEY, collapsed ? "1" : "0");
        } catch {}
    }, [collapsed]);

    const value = useMemo(
        () => ({
            collapsed,
            setCollapsed,
            toggle: () => setCollapsed((v) => !v),
        }),
        [collapsed]
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSidebar() {
    const v = useContext(Ctx);
    if (!v) throw new Error("useSidebar must be used within SidebarProvider");
    return v;
}
