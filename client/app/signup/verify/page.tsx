"use client";

import React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { authActions } from "@/store/authentication";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";

export default function VerifyPage() {
    const [otp, setOtp] = useState("");
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, tempEmail } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (!tempEmail) {
            router.push("/signup");
        }
    }, [tempEmail, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (otp.length !== 6) {
            toast.error("Please enter the complete 6-digit OTP");
            return;
        }

        if (!tempEmail) {
            toast.error("Email not found. Please start again.");
            router.push("/signup");
            return;
        }

        try {
            const result = await dispatch(
                authActions.verifyAccountCreationOtp({ email: tempEmail, otp })
            ).unwrap();

            if (result.success) {
                toast.success("OTP verified successfully");
                router.push("/signup/complete");
            } else {
                toast.error(result.message || "Invalid OTP");
            }
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Invalid OTP");
        }
    };

    const handleResendOtp = async () => {
        if (!tempEmail) return;

        try {
            const result = await dispatch(
                authActions.sendOtpForAccountCreation({ email: tempEmail })
            ).unwrap();

            if (result.success) {
                toast.success("OTP resent to your email");
            } else {
                toast.error(result.message || "Failed to resend OTP");
            }
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Failed to resend OTP");
        }
    };

    if (!tempEmail) {
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
                        <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
                        <CardDescription>
                            We sent a 6-digit code to{" "}
                            <span className="font-medium text-foreground">{tempEmail}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex justify-center">
                                <InputOTP
                                    maxLength={6}
                                    value={otp}
                                    onChange={(value) => setOtp(value)}
                                    disabled={isLoading}
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} className="size-12 text-lg" />
                                        <InputOTPSlot index={1} className="size-12 text-lg" />
                                        <InputOTPSlot index={2} className="size-12 text-lg" />
                                        <InputOTPSlot index={3} className="size-12 text-lg" />
                                        <InputOTPSlot index={4} className="size-12 text-lg" />
                                        <InputOTPSlot index={5} className="size-12 text-lg" />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading || otp.length !== 6}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        Verify & Continue
                                        <ArrowRight />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            {"Didn't receive the code?"}{" "}
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={isLoading}
                                className="text-primary hover:underline font-medium disabled:opacity-50"
                            >
                                Resend
                            </button>
                        </div>

                        <div className="mt-4">
                            <Link href="/signup">
                                <Button variant="ghost" className="w-full" disabled={isLoading}>
                                    <ArrowLeft />
                                    Back to signup
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
