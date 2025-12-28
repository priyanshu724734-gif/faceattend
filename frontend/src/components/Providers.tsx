"use client";

import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            {children}
            <Toaster position="top-center" richColors />
        </AuthProvider>
    );
}
