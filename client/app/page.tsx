import type { Metadata } from "next";

import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { CodeEditorSection } from "@/components/code-editor-section";
import { FeaturesSection } from "@/components/features-section";
import { AudienceSection } from "@/components/audience-section";
import { TechStackSection } from "@/components/tech-stack-section";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
    title: "Dokit - Collaborative Code Editor",
};

export default function Home() {
    return (
        <main className="min-h-screen bg-background">
            <Navbar />
            <HeroSection />
            <CodeEditorSection />
            <FeaturesSection />
            <AudienceSection />
            <TechStackSection />
            <CTASection />
            <Footer />
        </main>
    );
}
