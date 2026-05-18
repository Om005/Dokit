import type { Metadata } from "next";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Github, Linkedin, Mail } from "lucide-react";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
    title: "Contact Us",
};

export default function ContactUsPage() {
    const contacts = [
        { name: "GitHub", href: "https://github.com/Om005", icon: Github },
        {
            name: "LinkedIn",
            href: "https://www.linkedin.com/in/om-chavda-06a390302/",
            icon: Linkedin,
        },
        { name: "Email", href: "mailto:chavdaom84@gmail.com", icon: Mail },
    ];

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8 my-12 max-w-5xl">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
                    <p className="text-sm text-muted-foreground mb-8">
                        Tell us what you are building and how we can help.
                    </p>
                </div>

                <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
                    <ContactForm />
                    <aside className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm h-fit space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold">Other ways to reach us</h2>
                            <p className="text-sm text-muted-foreground mt-2">
                                Prefer email or social? We are happy to connect.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-foreground mb-4">Connect</h4>
                            <ul className="space-y-3 flex gap-3 pt-2">
                                {contacts.map((link) => (
                                    <li key={link.name}>
                                        <a
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm border flex items-center justify-center hover:bg-muted p-3 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.icon && (
                                                <link.icon className="w-5 h-5 inline-block" />
                                            )}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>
                </div>
            </div>

            <Footer />
        </main>
    );
}
