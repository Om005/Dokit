"use client";

import React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { authActions, setAccountCreationEmail } from "@/store/authentication";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import GuestRoute from "@/components/guest-route";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading } = useSelector((state: RootState) => state.auth);

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

        if (!email.trim()) {
            toast.error("Please enter your email address");
            return;
        }

        if (!validateEmail(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        try {
            const result = await dispatch(
                authActions.sendOtpForAccountCreation({ email })
            ).unwrap();

            if (result.success) {
                dispatch(setAccountCreationEmail(email));
                toast.success("OTP sent to your email");
                router.push("/signup/verify");
            } else {
                toast.error(result.message || "Failed to send OTP");
            }
        } catch (error) {
            const err = error as { message?: string };
            if (
                err.message &&
                err.message === "This email has already been verified for account creation."
            ) {
                toast.success(err.message);
                router.push("/signup/complete");
                return;
            }
            toast.error(err.message || "Something went wrong");
        }
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
                        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                        <CardDescription>Enter your email to get started</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                        onChange={(e) => handleEmailChange(e)}
                                        className={`pl-10 ${emailError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full cursor-pointer"
                                disabled={isLoading || !email || !!emailError}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link
                                href="/signin"
                                className="text-primary hover:underline font-medium"
                            >
                                Sign in
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
