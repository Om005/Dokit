"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { authActions } from "@/store/authentication";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArrowLeft, Loader2 } from "lucide-react";
import GuestRoute from "@/components/guest-route";
import { Navbar } from "@/components/navbar";
import { Payload } from "@/types/types";

export default function ForgotPasswordVerifyPage() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, passwordResetEmail } = useSelector((state: RootState) => state.auth);

    const [otp, setOtp] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        if (!passwordResetEmail) {
            router.push("/forgot-password");
        }
    }, [passwordResetEmail, router]);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            toast.error("Please enter the complete 6-digit code");
            return;
        }

        if (!passwordResetEmail) {
            toast.error("Email not found. Please start over.");
            router.push("/forgot-password");
            return;
        }

        try {
            const result = await dispatch(
                authActions.verifyPasswordResetOtp({ email: passwordResetEmail, otp })
            );
            const payload = result.payload as Payload<void>;

            if (payload.success) {
                toast.success(payload.message || "OTP verified successfully");
                router.push("/forgot-password/reset-password");
            } else {
                toast.error(payload.message || "Invalid OTP");
                setOtp("");
            }
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Verification failed");
            setOtp("");
        }
    };

    const handleResend = async () => {
        if (!passwordResetEmail || resendCooldown > 0) return;

        try {
            const result = await dispatch(
                authActions.sendOtpForPasswordReset({ email: passwordResetEmail })
            );
            const payload = result.payload as Payload<void>;

            if (payload.success) {
                toast.success("New OTP sent to your email");
                setResendCooldown(60);
                setOtp("");
            } else {
                toast.error(payload.message || "Failed to resend OTP");
            }
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Failed to resend OTP");
        }
    };

    if (!passwordResetEmail) {
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
                    Back
                </Link>

                <Card className="border-border/50 shadow-lg">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
                        <CardDescription>
                            We sent a 6-digit code to{" "}
                            <span className="font-medium text-foreground">
                                {passwordResetEmail}
                            </span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex justify-center">
                                <InputOTP
                                    maxLength={6}
                                    value={otp}
                                    onChange={setOtp}
                                    onComplete={handleVerify}
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
                                onClick={handleVerify}
                                className="w-full cursor-pointer h-11 bg-[#2A76F1] hover:bg-[#2A76F1]/90 text-white font-medium"
                                disabled={isLoading || otp.length !== 6}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify code"
                                )}
                            </Button>

                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">
                                    Didn&apos;t receive the code?{" "}
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={resendCooldown > 0 || isLoading}
                                        className="text-[#2A76F1] cursor-pointer hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                                    >
                                        {resendCooldown > 0
                                            ? `Resend in ${resendCooldown}s`
                                            : "Resend"}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
