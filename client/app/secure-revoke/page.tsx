"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { authActions } from "@/store/authentication";
import { Payload } from "@/types/types";
import { ShieldCheck, ShieldX, ShieldAlert, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type RevokeStatus = "idle" | "missing" | "success" | "error";

const Page = () => {
    const searchParams = useSearchParams();
    const dispatch = useDispatch<AppDispatch>();
    const { emergencyRevokeSessionLoading } = useSelector((state: RootState) => state.auth);
    const [status, setStatus] = useState<RevokeStatus>("idle");
    const [message, setMessage] = useState<string | null>(null);
    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) {
            setStatus("missing");
            setMessage("Missing token. Please check the link you used.");
            return;
        }

        const run = async () => {
            const result = await dispatch(authActions.emergencyRevokeSession({ token }));
            const payload = result.payload as Payload<void>;
            if (payload.success) {
                setStatus("success");
                setMessage(payload.message || "Session revoked successfully.");
            } else {
                setStatus("error");
                setMessage(payload.message || "Failed to revoke the session.");
            }
        };

        run();
    }, [dispatch, token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/30 p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="text-2xl font-bold text-foreground">
                        Dokit<span className="text-primary">.</span>
                    </Link>
                </div>

                <div className="rounded-2xl border border-border/50 bg-gradient-to-b from-card to-card/80 p-8 text-center shadow-xl backdrop-blur-sm">
                    {emergencyRevokeSessionLoading && status === "idle" && (
                        <div className="space-y-6">
                            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-xl font-semibold text-foreground">
                                    Revoking Session
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Please wait while we secure your account...
                                </p>
                            </div>
                            <div className="flex justify-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
                            </div>
                        </div>
                    )}

                    {status === "missing" && (
                        <div className="space-y-6">
                            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center">
                                <ShieldAlert className="h-8 w-8 text-amber-500" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-xl font-semibold text-foreground">
                                    Invalid Request
                                </h1>
                                <p className="text-sm text-muted-foreground">{message}</p>
                            </div>
                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    The revocation link appears to be incomplete or expired. Please
                                    use the link from your email or request a new one.
                                </p>
                            </div>
                            <Button asChild variant="outline" className="w-full h-11 rounded-xl">
                                <Link href="/">
                                    <Home className="size-4 mr-2" />
                                    Back to Home
                                </Link>
                            </Button>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="space-y-6">
                            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center">
                                <ShieldCheck className="h-8 w-8 text-emerald-500" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-xl font-semibold text-foreground">
                                    Session Revoked
                                </h1>
                                <p className="text-sm text-muted-foreground">{message}</p>
                            </div>
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                    Your account is now secure
                                </p>
                                <ul className="text-xs text-emerald-600/80 dark:text-emerald-400/80 space-y-1 text-left pl-4">
                                    <li className="list-disc">
                                        The suspicious session has been terminated
                                    </li>
                                    <li className="list-disc">
                                        We recommend changing your password
                                    </li>
                                    <li className="list-disc">
                                        Consider enabling Two-Factor Authentication
                                    </li>
                                </ul>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button asChild className="flex-1 h-11 rounded-xl">
                                    <Link href="/signin">Sign In</Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="flex-1 h-11 rounded-xl"
                                >
                                    <Link href="/">
                                        <Home className="size-4 mr-2" />
                                        Home
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="space-y-6">
                            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center">
                                <ShieldX className="h-8 w-8 text-red-500" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-xl font-semibold text-foreground">
                                    Unable to Revoke
                                </h1>
                                <p className="text-sm text-muted-foreground">{message}</p>
                            </div>
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    The session could not be revoked. {message}
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button
                                    onClick={() => window.location.reload()}
                                    className="flex-1 h-11 rounded-xl"
                                >
                                    Try Again
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="flex-1 h-11 rounded-xl"
                                >
                                    <Link href="/">
                                        <Home className="size-4 mr-2" />
                                        Home
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Page;
