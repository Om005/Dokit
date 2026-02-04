import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { CodeEditorSection } from "@/components/code-editor-section";

export default function Home() {
    return (
        <main className="min-h-screen bg-background">
            <Navbar />
            <HeroSection />
            <CodeEditorSection />
        </main>
    );
}
