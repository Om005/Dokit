"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Mail, MessageSquare, Send, User, Sparkles } from "lucide-react";
import env from "@/config/env";

export function ContactForm() {
    const formAccessKey = env.NEXT_PUBLIC_FORM_ACCESS_KEY;
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const form = e.currentTarget;
        const formData = new FormData(form);

        setIsSubmitting(true);

        try {
            const res = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            console.log(data);
            if (data.success) {
                toast.success("Message sent successfully!");
                form.reset();
            } else {
                toast.error(data.message || "Failed to send message.");
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="relative isolate min-h-screen w-full bg-inc-950">
            <div className="relative z-10 w-full max-w-xl">
                {/* Card */}
                <div className="rounded-2xl border border-border/60 bg-card/90 text-foreground backdrop-blur-xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-border/60 bg-primary/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/15">
                                <Sparkles className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">
                                    Get in Touch
                                </h2>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    We&apos;d love to hear from you
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form className="p-8 space-y-5" onSubmit={handleSubmit}>
                        <input type="hidden" name="access_key" value={formAccessKey} />

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label
                                    className="text-sm font-medium text-foreground"
                                    htmlFor="first-name"
                                >
                                    First name
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="first-name"
                                        name="firstName"
                                        placeholder="John"
                                        autoComplete="given-name"
                                        required
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label
                                    className="text-sm font-medium text-foreground"
                                    htmlFor="last-name"
                                >
                                    Last name
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="last-name"
                                        name="lastName"
                                        placeholder="Doe"
                                        autoComplete="family-name"
                                        required
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground" htmlFor="email">
                                Email address
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    required
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label
                                className="text-sm font-medium text-foreground"
                                htmlFor="subject"
                            >
                                Subject
                            </label>
                            <div className="relative group">
                                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="subject"
                                    name="subject"
                                    placeholder="How can we help you?"
                                    required
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label
                                className="text-sm font-medium text-foreground"
                                htmlFor="message"
                            >
                                Message
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                placeholder="Tell us more about your inquiry..."
                                required
                                rows={5}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-3 text-sm text-foreground shadow-sm transition-all outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none dark:bg-input/30"
                            />
                        </div>

                        {/* Footer */}
                        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-3">
                            <p className="text-xs text-muted-foreground">
                                We typically reply within 1-2 business days.
                            </p>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/40 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                            >
                                {isSubmitting ? (
                                    "Sending..."
                                ) : (
                                    <>
                                        Send message
                                        <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
