import Link from "next/link";
import { CircleAlert, Home } from "lucide-react";

export default function NotFound() {
    return (
        <main className="min-h-screen flex items-center justify-center px-6 py-24 bg-background">
            <section className="flex flex-col items-center text-center gap-4 max-w-prose">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <CircleAlert className="h-8 w-8 text-muted-foreground" />
                </div>
                <h1 className="text-balance text-2xl md:text-3xl font-semibold tracking-tight">
                    Page not found
                </h1>
                <p className="text-pretty text-muted-foreground leading-relaxed">
                    The page you are looking for does not exist or you do not have access to it.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#266ADA]"
                >
                    <Home className="h-4 w-4" />
                    Back to Home
                </Link>
            </section>
        </main>
    );
}
