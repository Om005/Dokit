"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import { motion, useReducedMotion } from "framer-motion";
import {
    Moon,
    Sun,
    User,
    LogOut,
    LayoutDashboard,
    Link2,
    Menu,
    Sparkles,
    Info,
    Mail,
} from "lucide-react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { authActions } from "@/store/authentication";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Payload } from "@/types/types";

export function Navbar() {
    const { resolvedTheme, setTheme } = useTheme();
    const isLight = resolvedTheme === "light";
    const dispatch = useDispatch<AppDispatch>();
    const { isAuthenticated, firstName, lastName, username } = useSelector(
        (state: RootState) => state.auth
    );
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    const toggleTheme = () => {
        setTheme(isLight ? "dark" : "light");
    };

    const handleLogout = async () => {
        try {
            const result = await dispatch(authActions.signOut());
            const payload = result.payload as Payload<void>;

            if (payload.success) {
                toast.success("Logged out successfully");
            } else {
                toast.error(payload.message || "Failed to log out");
            }
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Something went wrong");
        }
    };

    return (
        <motion.header
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl"
            initial={{ y: shouldReduceMotion ? 0 : -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
                duration: 0.8,
                ease: [0.215, 0.61, 0.355, 1] as [number, number, number, number],
            }}
        >
            <nav className="flex items-center justify-between px-2 py-2 bg-navbar-bg backdrop-blur-xl border border-border/50 rounded-full shadow-lg shadow-black/5 dark:shadow-black/20">
                <Link
                    href="/"
                    className="text-lg font-bold text-foreground pl-4 hover:opacity-80 transition-opacity"
                >
                    Dokit.
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1">
                    <Link
                        href="/features"
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/50"
                    >
                        Features
                    </Link>
                    <Link
                        href="/dashboard"
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/50"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/dashboard/codelink/generate"
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/50"
                    >
                        Code Links
                    </Link>
                    <Link
                        href="/contact-us"
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/50"
                    >
                        Contact
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-full h-9 w-9 cursor-pointer"
                        aria-label="Toggle theme"
                    >
                        {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </Button>

                    {isAuthenticated ? (
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="rounded-full px-4 h-9 gap-2 cursor-pointer"
                                >
                                    <User className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        {firstName} {lastName}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard" className="cursor-pointer">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={`/u/${username}`} className="cursor-pointer">
                                        <User className="mr-2 h-4 w-4" />
                                        My Account
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <>
                            <Link
                                href="/signin"
                                className="hidden sm:block px-4 py-2 text-sm text-foreground hover:text-muted-foreground transition-colors"
                            >
                                Log in
                            </Link>

                            <Button asChild className="rounded-full px-5 h-9">
                                <Link href="/signup">Start Coding</Link>
                            </Button>
                        </>
                    )}

                    {/* Mobile Navigation Trigger */}
                    <div className="md:hidden">
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full h-9 w-9 cursor-pointer"
                                    aria-label="Open menu"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="right"
                                className="w-[280px] border-l border-border/50 bg-background/95 backdrop-blur-md"
                            >
                                <SheetHeader className="text-left pb-4 border-b border-border/50">
                                    <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
                                        Dokit.
                                    </SheetTitle>
                                    <SheetDescription className="text-xs text-muted-foreground">
                                        Collaborative coding environment
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="pl-5 flex flex-col gap-4 py-6">
                                    <Link
                                        href="/features"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-1.5"
                                    >
                                        <Sparkles className="mr-2 h-4 w-4 inline" />
                                        Features
                                    </Link>
                                    <Link
                                        href="/about"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-1.5"
                                    >
                                        <Info className="mr-2 h-4 w-4 inline" />
                                        About
                                    </Link>
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-1.5"
                                    >
                                        <LayoutDashboard className="mr-2 h-4 w-4 inline" />
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/dashboard/codelink/generate"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-1.5"
                                    >
                                        <Link2 className="mr-2 h-4 w-4 inline" />
                                        Code Links
                                    </Link>
                                    <Link
                                        href="/contact-us"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-1.5"
                                    >
                                        <Mail className="mr-2 h-4 w-4 inline" />
                                        Contact
                                    </Link>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </nav>
        </motion.header>
    );
}
