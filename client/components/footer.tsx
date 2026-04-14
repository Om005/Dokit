"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";

const footerLinks = {
    product: [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "Documentation", href: "/docs" },
        { name: "Changelog", href: "/changelog" },
    ],
    resources: [
        { name: "Blog", href: "/blog" },
        { name: "Community", href: "/community" },
        { name: "Support", href: "/support" },
        { name: "Status", href: "/status" },
    ],
    legal: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Cookie Policy", href: "/cookies" },
    ],
};

const socialLinks = [
    { name: "GitHub", icon: Github, href: "https://github.com/Om005" },
    { name: "Twitter", icon: Twitter, href: "https://twitter.com" },
    { name: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/in/om-chavda-06a390302/" },
];

export function Footer() {
    return (
        <footer className="relative py-16 px-4 bg-card border-t border-border/50">
            <div className="max-w-6xl mx-auto">
                <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
                    <div className="lg:col-span-2">
                        <Link href="/" className="text-2xl font-bold text-foreground">
                            Dokit<span className="text-primary">.</span>
                        </Link>
                        <p className="text-muted-foreground text-sm mt-4 max-w-xs leading-relaxed">
                            The cloud IDE for modern developers. Code anywhere, collaborate
                            instantly, and ship faster.
                        </p>
                        <div className="flex items-center gap-4 mt-6">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                                    aria-label={social.name}
                                >
                                    <social.icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-foreground mb-4">Product</h4>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-foreground mb-4">Resources</h4>
                        <ul className="space-y-3">
                            {footerLinks.resources.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-foreground mb-4">Legal</h4>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-12 mt-12 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} Dokit. All rights reserved.
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>Built with</span>
                        <span className="text-rose-500">&#9829;</span>
                        <span>for developers</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
