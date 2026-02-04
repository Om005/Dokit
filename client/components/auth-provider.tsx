"use client";

import React from "react";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { authActions } from "@/store/authentication";
import { Loader } from "@/components/loader";

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { isAuthLoading } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(authActions.isAuthenticated());
    }, [dispatch]);

    if (isAuthLoading) {
        return <Loader />;
    }

    return <>{children}</>;
}
