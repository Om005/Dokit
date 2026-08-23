"use client";

import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { motion, useReducedMotion } from "framer-motion";

const footerLinks = {
    quick_links: [
        { name: "Home", href: "/" },
        { name: "Features", href: "/features" },
        { name: "About", href: "/about" },
        { name: "Sign In", href: "/signin" },
    ],
    legal: [
        { name: "Privacy Policy", href: "/privacy-policy" },
        { name: "Terms of Service", href: "/terms-of-service" },
        { name: "Contact Us", href: "/contact-us" },
    ],
    connect: [
        { name: "GitHub", href: "https://github.com/Om005", icon: Github },
        {
            name: "LinkedIn",
            href: "https://www.linkedin.com/in/om-chavda-06a390302/",
            icon: Linkedin,
        },
        { name: "Email", href: "mailto:chavdaom84@gmail.com", icon: Mail },
    ],
};

const socialLinks = [
    { name: "GitHub", icon: Github, href: "https://github.com/Om005" },
    { name: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/in/om-chavda-06a390302/" },
    { name: "Email", icon: Mail, href: "mailto:chavdaom84@gmail.com" },
];

export function Footer() {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const shouldReduceMotion = useReducedMotion();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.215, 0.61, 0.355, 1] as [number, number, number, number],
            },
        },
    };

    return (
        <footer className="relative py-16 px-4 bg-card border-t border-border/50">
            <motion.div
                className="max-w-6xl mx-auto"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
            >
                <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
                    <motion.div className="lg:col-span-2" variants={itemVariants}>
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
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <h4 className="text-sm font-semibold text-foreground mb-4">Quick Links</h4>
                        <ul className="space-y-3">
                            {footerLinks.quick_links.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={
                                            link.href == "/signin" && isAuthenticated
                                                ? "/dashboard/projects"
                                                : link.href
                                        }
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.name == "Sign In" && isAuthenticated
                                            ? "Dashboard"
                                            : link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div variants={itemVariants}>
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
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <h4 className="text-sm font-semibold text-foreground mb-4">Connect</h4>
                        <ul className="space-y-3 flex gap-4">
                            {footerLinks.connect.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.icon && (
                                            <link.icon className="w-4 h-4 inline-block mr-1" />
                                        )}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-12 mt-12 border-t border-border/50"
                >
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} Dokit. All rights reserved.
                    </p>
                </motion.div>
            </motion.div>
        </footer>
    );
}
