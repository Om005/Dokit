"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
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

export function Navbar() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { isAuthenticated, firstName, lastName } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    const handleLogout = async () => {
        try {
            const result = await dispatch(authActions.signOut()).unwrap();
            if (result.success) {
                toast.success("Logged out successfully");
                router.push("/");
            } else {
                toast.error(result.message || "Failed to log out");
            }
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Something went wrong");
        }
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
                                    <Link href="/account" className="cursor-pointer">
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
                </div>
            </nav>
        </header>
    );
}
