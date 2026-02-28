"use client";

import ProtectedRoute from "@/components/protected-route";
import { Navbar } from "@/components/navbar";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div>
            <ProtectedRoute>
                {/* <Navbar /> */}
                {children}
            </ProtectedRoute>
        </div>
    );
};

export default layout;
