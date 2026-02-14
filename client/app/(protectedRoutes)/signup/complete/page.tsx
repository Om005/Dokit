"use client";

import React from "react";
import { useState, useEffect, useMemo } from "react";
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
import { Loader2, User, AtSign, Lock, Eye, EyeOff, Check, X } from "lucide-react";

interface PasswordRequirement {
    label: string;
    test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
    { label: "At least 8 characters", test: (p) => p.length >= 8 },
    { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
    { label: "One number", test: (p) => /[0-9]/.test(p) },
    {
        label: "One special character",
        test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
    },
];

function getStrengthLevel(passedCount: number): {
    label: string;
    color: string;
    percentage: number;
} {
    if (passedCount === 0) return { label: "Very Weak", color: "bg-red-500", percentage: 0 };
    if (passedCount === 1) return { label: "Weak", color: "bg-red-500", percentage: 20 };
    if (passedCount === 2) return { label: "Fair", color: "bg-orange-500", percentage: 40 };
    if (passedCount === 3) return { label: "Good", color: "bg-yellow-500", percentage: 60 };
    if (passedCount === 4) return { label: "Strong", color: "bg-lime-500", percentage: 80 };
    return { label: "Very Strong", color: "bg-green-500", percentage: 100 };
}

export default function CompletePage() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, accountCreationEmail, verifiedForAccountCreation, usernameAvailability } =
        useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (!accountCreationEmail || !verifiedForAccountCreation) {
            router.push("/signup/verify");
        }
    }, [accountCreationEmail, verifiedForAccountCreation, router]);

    const passwordValidation = useMemo(() => {
        return passwordRequirements.map((req) => ({
            ...req,
            passed: req.test(password),
        }));
    }, [password]);

    const passedCount = useMemo(() => {
        return passwordValidation.filter((req) => req.passed).length;
    }, [passwordValidation]);

    const strengthInfo = useMemo(() => {
        return getStrengthLevel(passedCount);
    }, [passedCount]);

    const isPasswordValid = useMemo(() => {
        return passwordValidation.every((req) => req.passed);
    }, [passwordValidation]);

    const passwordsMatch = password === confirmPassword && confirmPassword !== "";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firstName.trim()) {
            toast.error("Please enter your first name");
            return;
        }

        if (!lastName.trim()) {
            toast.error("Please enter your last name");
            return;
        }

        if (!userName.trim()) {
            toast.error("Please enter a username");
            return;
        }

        if (userName.length < 3) {
            toast.error("Username must be at least 3 characters");
            return;
        }

        if (!isPasswordValid) {
            toast.error("Please meet all password requirements");
            return;
        }

        if (!passwordsMatch) {
            toast.error("Passwords do not match");
            return;
        }

        if (!accountCreationEmail || !verifiedForAccountCreation) {
            toast.error("Email not found. Please start again.");
            router.push("/signup/verify");
            return;
        }

        try {
            const result = await dispatch(
                authActions.createAccount({
                    email: accountCreationEmail,
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    username: userName.trim(),
                    password,
                })
            ).unwrap();

            if (result.success) {
                toast.success("Account created successfully!");
                router.push("/");
            } else {
                toast.error(result.message || "Failed to create account");
            }
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Something went wrong");
        }
    };

    useEffect(() => {
        if (!userName || userName.length < 3) {
            return;
        }

        const debounceTimer = setTimeout(() => {
            dispatch(authActions.isUsernameAvailable({ username: userName }));
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [userName, dispatch]);

    if (!accountCreationEmail || !verifiedForAccountCreation) {
        return null;
    }

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
                        <CardTitle className="text-2xl font-bold">Complete your profile</CardTitle>
                        <CardDescription>Fill in your details to finish signing up</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                        <Input
                                            id="firstName"
                                            type="text"
                                            placeholder="John"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        type="text"
                                        placeholder="Doe"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                {/* <Label htmlFor="userName">Username</Label> */}
                                <Label
                                    htmlFor="userName"
                                    className="flex items-center justify-between"
                                >
                                    <span>Username</span>
                                    {userName.length >= 3 && (
                                        <span className="text-xs font-medium">
                                            {usernameAvailability.loading && (
                                                <span className="text-amber-600 dark:text-amber-400">
                                                    Checking...
                                                </span>
                                            )}
                                            {!usernameAvailability.loading &&
                                                usernameAvailability.available === true && (
                                                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                                        <Check className="size-3" /> Available
                                                    </span>
                                                )}
                                            {!usernameAvailability.loading &&
                                                usernameAvailability.available === false && (
                                                    <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                                                        <X className="size-3" /> Taken
                                                    </span>
                                                )}
                                        </span>
                                    )}
                                </Label>
                                <div className="relative">
                                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        id="userName"
                                        type="text"
                                        placeholder="johndoe"
                                        value={userName}
                                        maxLength={20}
                                        onChange={(e) =>
                                            setUserName(e.target.value.replace(/\s/g, ""))
                                        }
                                        className={`pl-10 pr-10 transition-colors ${
                                            userName.length >= 3 && !usernameAvailability.loading
                                                ? usernameAvailability.available === true
                                                    ? "border-green-500 focus-visible:ring-green-500"
                                                    : usernameAvailability.available === false
                                                      ? "border-red-500 focus-visible:ring-red-500"
                                                      : ""
                                                : ""
                                        }`}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a strong password"
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

                            {/* Password Strength Bar */}
                            {password && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            Password strength
                                        </span>
                                        <span
                                            className={`font-medium ${strengthInfo.percentage >= 80 ? "text-green-600 dark:text-green-400" : strengthInfo.percentage >= 60 ? "text-yellow-600 dark:text-yellow-400" : strengthInfo.percentage >= 40 ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"}`}
                                        >
                                            {strengthInfo.label}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${strengthInfo.color}`}
                                            style={{ width: `${strengthInfo.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Password Requirements */}
                            <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                    Password requirements:
                                </p>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {passwordValidation.map((req, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center gap-2 text-xs transition-colors ${
                                                req.passed
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-muted-foreground"
                                            }`}
                                        >
                                            {req.passed ? (
                                                <Check className="size-3.5" />
                                            ) : (
                                                <X className="size-3.5" />
                                            )}
                                            <span>{req.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`pl-10 pr-10 ${
                                            confirmPassword && !passwordsMatch
                                                ? "border-red-500 focus-visible:ring-red-500"
                                                : confirmPassword && passwordsMatch
                                                  ? "border-green-500 focus-visible:ring-green-500"
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
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                                {confirmPassword && !passwordsMatch && (
                                    <p className="text-xs text-red-500">Passwords do not match</p>
                                )}
                                {passwordsMatch && (
                                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <Check className="size-3" /> Passwords match
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full cursor-pointer"
                                disabled={
                                    isLoading ||
                                    !isPasswordValid ||
                                    !passwordsMatch ||
                                    (!usernameAvailability.loading &&
                                        !usernameAvailability.available)
                                }
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
