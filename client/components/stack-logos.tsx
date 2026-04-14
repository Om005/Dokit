import { Code2, Zap, Package, Github } from "lucide-react";

export const STACKS = [
    {
        id: "REACT_VITE",
        name: "Vite + React",
        icon: Zap,
        color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    {
        id: "NODE",
        name: "Node.js",
        icon: Code2,
        color: "bg-green-500/10 text-green-600 dark:text-green-400",
    },
    {
        id: "EXPRESS",
        name: "Express",
        icon: Package,
        color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    },
    {
        id: "BLANK",
        name: "GitHub",
        icon: Github,
        color: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    },
];

export function getStackIcon(stackId: string) {
    const stack = STACKS.find((s) => s.id === stackId);
    return stack;
}

export function getStackName(stackId: string) {
    const stack = STACKS.find((s) => s.id === stackId);
    return stack?.name || stackId;
}
