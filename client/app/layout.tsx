import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import StoreProvider from "@/components/store-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Dokit - Collaborative Code Editor",
    description: "Real-time collaborative code editor",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${outfit.variable} ${jetbrainsMono.variable} antialiased font-sans`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <StoreProvider>
                        <AuthProvider>
                            <TooltipProvider>{children}</TooltipProvider>
                            <Toaster position="top-right" richColors={true} />
                        </AuthProvider>
                    </StoreProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
