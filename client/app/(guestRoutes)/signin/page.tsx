"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { authActions } from "@/store/authentication";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, Mail, Lock, Eye, EyeOff, Key, Smartphone } from "lucide-react";
import { Payload } from "@/types/types";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [preAuthToken, setPreAuthToken] = useState<string | null>(null);
    const [twoFactorToken, setTwoFactorToken] = useState("");
    const [backupCode, setBackupCode] = useState("");
    const [useBackupCode, setUseBackupCode] = useState(false);
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, verify2FAForSignInLoading } = useSelector((state: RootState) => state.auth);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

        if (!email.trim()) {
            setEmailError("Please enter your email");
            return;
        }

        if (!validateEmail(email)) {
            setEmailError("Please enter a valid email address");
            return;
        }

        if (!password) {
            toast.error("Please enter your password");
            return;
        }

        try {
            const result = await dispatch(
                authActions.signIn({
                    email: email.trim(),
                    password,
                })
            );
            const payload = result.payload as Payload<{
                requires2FA?: boolean;
                preAuthToken?: string;
            }>;

            if (payload.success) {
                toast.success("Signed in successfully!");
                router.push("/");
            } else {
                if (payload.data?.requires2FA && payload.data.preAuthToken) {
                    setPreAuthToken(payload.data.preAuthToken);
                    toast.info("Two-factor authentication required. Please enter your 2FA OTP");
                } else {
                    toast.error(payload.message || "Invalid email or password");
                }
            }
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Something went wrong");
        }
    };

    const handleVerify2FARequest = async () => {
        if (!preAuthToken) {
            return;
        }

        if (useBackupCode) {
            const trimmedCode = backupCode.trim();
            if (trimmedCode.length !== 8) {
                toast.error("Enter a valid 8-character backup code");
                return;
            }
            const result = await dispatch(
                authActions.verify2FAForSignIn({
                    preAuthToken,
                    code: trimmedCode,
                })
            );
            const payload = result.payload as Payload<void>;
            if (payload.success) {
                toast.success("Signed in successfully!");
                router.push("/");
            } else {
                toast.error(payload.message || "Invalid backup code");
            }
            return;
        }

        const trimmedToken = twoFactorToken.trim();
        if (trimmedToken.length !== 6) {
            toast.error("Enter the 6-digit code from your authenticator app");
            return;
        }

        const result = await dispatch(
            authActions.verify2FAForSignIn({
                preAuthToken,
                token: trimmedToken,
            })
        );
        const payload = result.payload as Payload<void>;
        if (payload.success) {
            toast.success("Signed in successfully!");
            router.push("/");
        } else {
            toast.error(payload.message || "Invalid authentication code");
        }
    };

    const handleVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleVerify2FARequest();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="text-2xl font-bold text-foreground">
                        Dokit.
                    </Link>
                </div>

                <Card className="border-border/50 shadow-lg">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                        <CardDescription>Sign in to your account to continue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {preAuthToken ? (
                            <form onSubmit={handleVerify2FA} className="space-y-6">
                                <div className="flex rounded-xl bg-muted/50 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setUseBackupCode(false)}
                                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                                            !useBackupCode
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <Smartphone className="size-4" />
                                        Authenticator
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUseBackupCode(true)}
                                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                                            useBackupCode
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <Key className="size-4" />
                                        Backup Code
                                    </button>
                                </div>

                                {!useBackupCode ? (
                                    <div className="space-y-4">
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-medium text-foreground">
                                                Enter verification code
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Open your authenticator app and enter the 6-digit
                                                code
                                            </p>
                                        </div>
                                        <div className="flex justify-center">
                                            <InputOTP
                                                maxLength={6}
                                                autoFocus
                                                value={twoFactorToken}
                                                onChange={(value) => setTwoFactorToken(value)}
                                                onComplete={handleVerify2FARequest}
                                                disabled={verify2FAForSignInLoading}
                                            >
                                                <InputOTPGroup>
                                                    <InputOTPSlot
                                                        index={0}
                                                        className="size-12 text-lg"
                                                    />
                                                    <InputOTPSlot
                                                        index={1}
                                                        className="size-12 text-lg"
                                                    />
                                                    <InputOTPSlot
                                                        index={2}
                                                        className="size-12 text-lg"
                                                    />
                                                    <InputOTPSlot
                                                        index={3}
                                                        className="size-12 text-lg"
                                                    />
                                                    <InputOTPSlot
                                                        index={4}
                                                        className="size-12 text-lg"
                                                    />
                                                    <InputOTPSlot
                                                        index={5}
                                                        className="size-12 text-lg"
                                                    />
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-medium text-foreground">
                                                Enter backup code
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Use one of your saved 8-character backup codes
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Input
                                                id="backup-code"
                                                autoFocus
                                                placeholder="XXXXXXXX"
                                                value={backupCode}
                                                maxLength={8}
                                                onChange={(e) =>
                                                    setBackupCode(
                                                        e.target.value.trim().toUpperCase()
                                                    )
                                                }
                                                disabled={verify2FAForSignInLoading}
                                                className="h-12 text-center font-mono text-lg tracking-widest bg-muted/30 border-border/50 rounded-xl"
                                            />
                                            <p className="text-xs text-center text-muted-foreground">
                                                Each backup code can only be used once
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-11 rounded-xl"
                                    disabled={
                                        verify2FAForSignInLoading ||
                                        (!useBackupCode && twoFactorToken.length !== 6) ||
                                        (useBackupCode && backupCode.trim().length !== 8)
                                    }
                                >
                                    {verify2FAForSignInLoading ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin mr-2" />
                                            Verifying...
                                        </>
                                    ) : (
                                        "Verify & sign in"
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={handleEmailChange}
                                            className={`pl-10 ${emailError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 pr-10"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="size-4" />
                                            ) : (
                                                <Eye className="size-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full cursor-pointer"
                                    disabled={isLoading || !email || !!emailError || !password}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        "Sign In"
                                    )}
                                </Button>
                            </form>
                        )}

                        {!preAuthToken && (
                            <div className="mt-6 text-center text-sm">
                                <span className="text-muted-foreground">
                                    {"Don't have an account? "}
                                </span>
                                <Link href="/signup" className="text-primary hover:underline">
                                    Sign up
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
