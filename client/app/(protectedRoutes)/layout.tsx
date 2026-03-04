"use client";

import ProtectedRoute from "@/components/protected-route";
import { Navbar } from "@/components/navbar";
import React from "react";
import { usePathname } from "next/navigation";

const Layout = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const noNavbarPaths = ["/projects/"];
    const showNavbar = !(noNavbarPaths.includes(pathname) || pathname.startsWith("/project/"));
    return (
        <div>
            <ProtectedRoute>
                {showNavbar && <Navbar />}
                {children}
            </ProtectedRoute>
        </div>
    );
};

export default Layout;
