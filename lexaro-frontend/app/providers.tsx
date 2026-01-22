"use client";

import { SidebarProvider } from "@/components/dashboard/SidebarContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    return <SidebarProvider>{children}</SidebarProvider>;
}
