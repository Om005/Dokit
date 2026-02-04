"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function Navbar() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    return (
        <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl">
            <nav className="flex items-center justify-between px-2 py-2 bg-navbar-bg backdrop-blur-xl border border-border/50 rounded-full shadow-lg shadow-black/5 dark:shadow-black/20">
                {/* Logo */}
                <Link
                    href="/"
                    className="text-lg font-bold text-foreground pl-4 hover:opacity-80 transition-opacity"
                >
                    Dokit.
                </Link>

                {/* Center Nav Links */}
                <div className="hidden md:flex items-center gap-1">
                    <Link
                        href="#features"
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/50"
                    >
                        Features
                    </Link>
                    <Link
                        href="#pricing"
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/50"
                    >
                        Pricing
                    </Link>
                    <Link
                        href="#docs"
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/50"
                    >
                        Docs
                    </Link>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-full h-9 w-9 cursor-pointer"
                        aria-label="Toggle theme"
                    >
                        {mounted && theme === "light" ? (
                            <Moon className="h-4 w-4" />
                        ) : (
                            <Sun className="h-4 w-4" />
                        )}
                    </Button>

                    <Link
                        href="/login"
                        className="hidden sm:block px-4 py-2 text-sm text-foreground hover:text-muted-foreground transition-colors"
                    >
                        Log in
                    </Link>

                    <Button asChild className="rounded-full px-5 h-9">
                        <Link href="/signup">Sign Up</Link>
                    </Button>
                </div>
            </nav>
        </header>
    );
}
