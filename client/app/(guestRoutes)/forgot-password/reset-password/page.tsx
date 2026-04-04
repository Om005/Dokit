"use client";

import React from "react";

import { useState, useEffect, useMemo } from "react";
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
import { ArrowLeft, Lock, Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { Payload } from "@/types/types";

interface PasswordRequirement {
    label: string;
    test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
    { label: "At least 8 characters", test: (p) => p.length >= 8 },
    { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
    { label: "One number", test: (p) => /\d/.test(p) },
    { label: "One special character", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function ResetPasswordPage() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, passwordResetEmail, verifiedForPasswordReset } = useSelector(
        (state: RootState) => state.auth
    );

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!passwordResetEmail || !verifiedForPasswordReset) {
            router.push("/forgot-password/verify");
        }
    }, [passwordResetEmail, verifiedForPasswordReset, router]);

    const passwordChecks = useMemo(() => {
        return passwordRequirements.map((req) => ({
            ...req,
            passed: req.test(password),
        }));
    }, [password]);

    const passedCount = passwordChecks.filter((c) => c.passed).length;
    const totalRequirements = passwordRequirements.length;

    const getStrengthLabel = () => {
        if (password.length === 0) return { label: "", color: "bg-muted" };
        if (passedCount <= 1) return { label: "Very Weak", color: "bg-red-500" };
        if (passedCount === 2) return { label: "Weak", color: "bg-orange-500" };
        if (passedCount === 3) return { label: "Fair", color: "bg-yellow-500" };
        if (passedCount === 4) return { label: "Good", color: "bg-lime-500" };
        return { label: "Strong", color: "bg-green-500" };
    };

    const strength = getStrengthLabel();
    const strengthPercentage = (passedCount / totalRequirements) * 100;

    const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
    const passwordsDontMatch = confirmPassword.length > 0 && password !== confirmPassword;
    const allRequirementsMet = passedCount === totalRequirements;
    const isFormValid = allRequirementsMet && passwordsMatch;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isFormValid) {
            toast.error("Please meet all password requirements");
            return;
        }

        if (!passwordResetEmail || !verifiedForPasswordReset) {
            toast.error("Session expired. Please start over.");
            router.push("/forgot-password/verify");
            return;
        }

        try {
            const result = await dispatch(
                authActions.resetPassword({ email: passwordResetEmail, newPassword: password })
            );
            const payload = result.payload as Payload<void>;

            if (payload.success) {
                dispatch(setPasswordResetEmail(null));
                toast.success("Password reset successfully");
                router.push("/signin");
            } else {
                toast.error(payload.message || "Failed to reset password");
            }
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Something went wrong");
        }
    };

    if (!passwordResetEmail || !verifiedForPasswordReset) {
        return null;
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <Link
                    href="/forgot-password"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Start over
                </Link>

                <Card className="border-border/50 shadow-lg">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                            Create new password
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Enter a strong password for your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    New password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 h-11"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>

                                {password.length > 0 && (
                                    <div className="space-y-2 pt-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                Password strength
                                            </span>
                                            <span
                                                className={`font-medium ${
                                                    strength.color === "bg-red-500"
                                                        ? "text-red-500"
                                                        : strength.color === "bg-orange-500"
                                                          ? "text-orange-500"
                                                          : strength.color === "bg-yellow-500"
                                                            ? "text-yellow-500"
                                                            : strength.color === "bg-lime-500"
                                                              ? "text-lime-500"
                                                              : "text-green-500"
                                                }`}
                                            >
                                                {strength.label}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${strength.color}`}
                                                style={{ width: `${strengthPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5 pt-2">
                                    {passwordChecks.map((check, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center gap-2 text-xs transition-colors ${
                                                check.passed
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-muted-foreground"
                                            }`}
                                        >
                                            {check.passed ? (
                                                <Check className="h-3.5 w-3.5" />
                                            ) : (
                                                <X className="h-3.5 w-3.5" />
                                            )}
                                            <span>{check.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                    Confirm password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`pl-10 pr-10 h-11 ${
                                            passwordsMatch
                                                ? "border-green-500 focus-visible:ring-green-500"
                                                : passwordsDontMatch
                                                  ? "border-red-500 focus-visible:ring-red-500"
                                                  : ""
                                        }`}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {passwordsMatch && (
                                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <Check className="h-3.5 w-3.5" />
                                        Passwords match
                                    </p>
                                )}
                                {passwordsDontMatch && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <X className="h-3.5 w-3.5" />
                                        Passwords do not match
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="cursor-pointer w-full h-11 bg-[#2A76F1] hover:bg-[#2A76F1]/90 text-white font-medium"
                                disabled={isLoading || !isFormValid}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting password...
                                    </>
                                ) : (
                                    "Reset password"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
