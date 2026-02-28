"use client";

import React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { authActions, setPasswordResetEmail } from "@/store/authentication";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import GuestRoute from "@/components/guest-route";
import { Navbar } from "@/components/navbar";
import { Payload } from "@/types/types";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading } = useSelector((state: RootState) => state.auth);

    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        if (value && !validateEmail(value)) {
            setEmailError("Please enter a valid email address");
        } else {
            setEmailError("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setEmailError("Email is required");
            return;
        }

        if (!validateEmail(email)) {
            setEmailError("Please enter a valid email address");
            return;
        }

        try {
            const result = await dispatch(authActions.sendOtpForPasswordReset({ email }));

            const payload = result.payload as Payload<void>;

            if (payload.success) {
                dispatch(setPasswordResetEmail(email));
                toast.success("OTP sent to your email");
                router.push("/forgot-password/verify");
            } else {
                toast.error(payload.message || "Failed to send OTP");
            }
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Something went wrong");
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <Link
                    href="/signin"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
                </Link>

                <Card className="border-border/50 shadow-lg">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                            Reset your password
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Enter your email address and we&apos;ll send you a verification code
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Email address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={handleEmailChange}
                                        className={`pl-10 h-11 ${emailError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                        disabled={isLoading}
                                    />
                                </div>
                                {/* {emailError && <p className="text-xs text-red-500">{emailError}</p>} */}
                            </div>

                            <Button
                                type="submit"
                                className="cursor-pointer w-full h-11 bg-[#2A76F1] hover:bg-[#2A76F1]/90 text-white font-medium"
                                disabled={isLoading || !email || !!emailError}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending code...
                                    </>
                                ) : (
                                    "Send verification code"
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Remember your password?{" "}
                                <Link
                                    href="/signin"
                                    className="text-[#2A76F1] hover:underline font-medium"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
