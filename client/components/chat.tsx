"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { chatActions, setActiveChatId } from "@/store/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
    Plus,
    Search,
    Send,
    Sparkles,
    StickyNote,
    Loader2,
    Copy,
    Check,
    MoreHorizontal,
    Trash2,
    PanelLeft,
    ArrowLeft,
    Sun,
    Moon,
} from "lucide-react";
import { Payload } from "@/types/types";
import { useTheme } from "next-themes";

interface AiAssistantProps {
    projectId: string;
}

type ComposerMode = "assistant" | "note";

const CHAT_LIST_LIMIT = 80;
const CHAT_MESSAGE_LIMIT = 120;

const formatTimestamp = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const buildChatTitle = (value: string) => {
    const trimmed = value.trim().replace(/\s+/g, " ");
    if (!trimmed) return "New chat";
    return trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed;
};

const CopyButton = ({ code }: { code: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (event?: React.MouseEvent<HTMLButtonElement>) => {
        event?.preventDefault();
        let didCopy = false;
        if (
            typeof navigator !== "undefined" &&
            typeof window !== "undefined" &&
            window.isSecureContext &&
            navigator.clipboard?.writeText
        ) {
            try {
                await navigator.clipboard.writeText(code);
                didCopy = true;
            } catch {
                didCopy = false;
            }
        }
        if (!didCopy && typeof document !== "undefined") {
            const textArea = document.createElement("textarea");
            textArea.value = code;
            textArea.setAttribute("readonly", "");
            textArea.style.position = "fixed";
            textArea.style.top = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                didCopy = document.execCommand("copy");
            } catch {
                didCopy = false;
            }
            document.body.removeChild(textArea);
        }
        if (didCopy) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } else {
            toast.error("Copy failed. Please copy manually.");
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
        >
            {copied ? (
                <>
                    <Check className="size-3.5" />
                    <span>Copied</span>
                </>
            ) : (
                <>
                    <Copy className="size-3.5" />
                    <span>Copy</span>
                </>
            )}
        </button>
    );
};

const MarkdownComponents = {
    code({
        className,
        children,
        ...props
    }: React.ComponentPropsWithoutRef<"code"> & { inline?: boolean }) {
        const code = String(children).replace(/\n$/, "");
        const match = /language-(\w+)/.exec(className || "");
        const isMultiline = code.includes("\n");

        if (match || isMultiline) {
            const language = match?.[1] || "text";
            return (
                <div className="my-4 overflow-hidden rounded-xl border border-zinc-700/60 shadow-sm">
                    <div className="flex items-center justify-between border-b border-zinc-700/60 bg-zinc-800 px-4 py-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                            {language}
                        </span>
                        <CopyButton code={code} />
                    </div>
                    <SyntaxHighlighter
                        style={oneDark}
                        language={language}
                        PreTag="div"
                        customStyle={{
                            margin: 0,
                            padding: "1rem",
                            background: "rgb(24 24 27)",
                            fontSize: "0.8125rem",
                            lineHeight: "1.7",
                        }}
                        codeTagProps={{
                            style: {
                                fontFamily:
                                    "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                            },
                        }}
                    >
                        {code}
                    </SyntaxHighlighter>
                </div>
            );
        }

        return (
            <code
                className="mx-0.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
                {...props}
            >
                {children}
            </code>
        );
    },
    pre({ children }: React.ComponentPropsWithoutRef<"pre">) {
        return <>{children}</>;
    },
    p({ children }: React.ComponentPropsWithoutRef<"p">) {
        return <p className="mb-4 leading-7 last:mb-0">{children}</p>;
    },
    h1({ children }: React.ComponentPropsWithoutRef<"h1">) {
        return (
            <h1 className="mb-4 mt-6 text-xl font-semibold text-foreground first:mt-0">
                {children}
            </h1>
        );
    },
    h2({ children }: React.ComponentPropsWithoutRef<"h2">) {
        return (
            <h2 className="mb-3 mt-5 text-lg font-semibold text-foreground first:mt-0">
                {children}
            </h2>
        );
    },
    h3({ children }: React.ComponentPropsWithoutRef<"h3">) {
        return (
            <h3 className="mb-2 mt-4 text-base font-semibold text-foreground first:mt-0">
                {children}
            </h3>
        );
    },
    ul({ children }: React.ComponentPropsWithoutRef<"ul">) {
        return (
            <ul className="mb-4 list-disc space-y-2 pl-6 marker:text-muted-foreground">
                {children}
            </ul>
        );
    },
    ol({ children }: React.ComponentPropsWithoutRef<"ol">) {
        return (
            <ol className="mb-4 list-decimal space-y-2 pl-6 marker:text-muted-foreground">
                {children}
            </ol>
        );
    },
    li({ children }: React.ComponentPropsWithoutRef<"li">) {
        return <li className="leading-7">{children}</li>;
    },
    a({ href, children }: React.ComponentPropsWithoutRef<"a">) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-foreground/70"
            >
                {children}
            </a>
        );
    },
    strong({ children }: React.ComponentPropsWithoutRef<"strong">) {
        return <strong className="font-semibold text-foreground">{children}</strong>;
    },
    em({ children }: React.ComponentPropsWithoutRef<"em">) {
        return <em className="italic text-foreground/90">{children}</em>;
    },
    blockquote({ children }: React.ComponentPropsWithoutRef<"blockquote">) {
        return (
            <blockquote className="my-4 border-l-2 border-border pl-4 italic text-muted-foreground">
                {children}
            </blockquote>
        );
    },
    hr() {
        return <hr className="my-6 border-border" />;
    },
    table({ children }: React.ComponentPropsWithoutRef<"table">) {
        return (
            <div className="my-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">{children}</table>
            </div>
        );
    },
    th({ children }: React.ComponentPropsWithoutRef<"th">) {
        return (
            <th className="border-b border-border bg-muted px-3 py-2 text-left font-semibold">
                {children}
            </th>
        );
    },
    td({ children }: React.ComponentPropsWithoutRef<"td">) {
        return <td className="border-b border-border px-3 py-2">{children}</td>;
    },
};

interface ChatListProps {
    chats: RootState["chat"]["chats"];
    activeChatId: string | null;
    loadingChats: boolean;
    query: string;
    deletingChat: boolean;
    onQueryChange: (value: string) => void;
    onNewChat: () => void;
    onSelectChat: (chatId: string) => void;
    onDeleteChat: (chatId: string) => void;
}

const ChatList = ({
    chats,
    activeChatId,
    loadingChats,
    query,
    deletingChat,
    onQueryChange,
    onNewChat,
    onSelectChat,
    onDeleteChat,
}: ChatListProps) => {
    const filteredChats = useMemo(() => {
        const trimmed = query.trim().toLowerCase();
        if (!trimmed) return chats;
        return chats.filter((chat) => (chat.title ?? "").toLowerCase().includes(trimmed));
    }, [chats, query]);

    const { resolvedTheme, setTheme } = useTheme();

    return (
        <div className="flex h-full flex-col">
            <div className="space-y-3 border-b border-border p-3">
                <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start gap-18 rounded-lg"
                    onClick={onNewChat}
                >
                    <Plus className="size-4" />
                    New chat
                </Button>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(event) => onQueryChange(event.target.value)}
                        placeholder="Search chats"
                        className="h-9 rounded-lg bg-background pl-9 text-sm"
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-1 p-2">
                    {loadingChats ? (
                        <div className="space-y-1.5">
                            {[...Array(6)].map((_, idx) => (
                                <div key={idx} className="h-10 animate-pulse rounded-lg bg-muted" />
                            ))}
                        </div>
                    ) : filteredChats.length === 0 ? (
                        <div className="py-12 text-center text-xs text-muted-foreground">
                            No chats yet
                        </div>
                    ) : (
                        filteredChats.map((chat) => {
                            const isActive = chat.id === activeChatId;
                            return (
                                <div
                                    key={chat.id}
                                    className={cn(
                                        "group relative grid grid-cols-[1fr_auto] items-center rounded-lg transition-colors",
                                        isActive ? "bg-muted" : "hover:bg-muted/60"
                                    )}
                                >
                                    <button
                                        onClick={() => onSelectChat(chat.id)}
                                        className="min-w-0 overflow-hidden py-2 pl-3 pr-2 text-left text-sm hover:cursor-pointer"
                                    >
                                        <span
                                            className={cn(
                                                "block w-full truncate",
                                                isActive
                                                    ? "font-medium text-foreground"
                                                    : "text-foreground/80"
                                            )}
                                        >
                                            {chat.title ?? "Untitled"}
                                        </span>
                                    </button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                className={cn(
                                                    "flex size-7 cursor-pointer mr-1 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-background hover:text-foreground",
                                                    "opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100",
                                                    isActive && "opacity-100"
                                                )}
                                                aria-label="Chat options"
                                            >
                                                <MoreHorizontal className="size-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-36">
                                            <DropdownMenuItem
                                                variant="destructive"
                                                disabled={deletingChat}
                                                onClick={() => onDeleteChat(chat.id)}
                                            >
                                                <Trash2 className="size-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
            <div className="flex items-center justify-center border-t p-2">
                <button
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    className="cursor-pointer rounded p-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                    title={
                        resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"
                    }
                >
                    {resolvedTheme === "dark" ? (
                        <Sun className="h-4 w-4" />
                    ) : (
                        <Moon className="h-4 w-4" />
                    )}
                </button>
            </div>
        </div>
    );
};

export const AiAssistant = ({ projectId }: AiAssistantProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const {
        chats,
        messagesByChat,
        activeChatId,
        loadingChats,
        creatingChat,
        gettingChat,
        addingMessage,
        deletingChat,
        streamingChat,
        streamingError,
    } = useSelector((state: RootState) => state.chat);

    const [query, setQuery] = useState("");
    const [composerMode, setComposerMode] = useState<ComposerMode>("assistant");
    const [draft, setDraft] = useState("");
    const [pendingMessage, setPendingMessage] = useState<string | null>(null);
    const [isNewChat, setIsNewChat] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const activeMessages = useMemo(() => {
        if (!activeChatId) return [];
        return messagesByChat[activeChatId] ?? [];
    }, [activeChatId, messagesByChat]);

    const activeTitle = activeChatId
        ? (chats.find((chat) => chat.id === activeChatId)?.title ?? "Untitled")
        : "New chat";

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, []);

    const refreshChats = useCallback(() => {
        if (!projectId) return;
        dispatch(chatActions.listChats({ projectId, limit: CHAT_LIST_LIMIT }));
    }, [dispatch, projectId]);

    const ensureChatLoaded = useCallback(
        (chatId: string) => {
            if (!messagesByChat[chatId]) {
                dispatch(chatActions.getChat({ chatId, limit: CHAT_MESSAGE_LIMIT }));
            }
        },
        [dispatch, messagesByChat]
    );

    useEffect(() => {
        refreshChats();
    }, [refreshChats]);

    useEffect(() => {
        if (!activeChatId && chats.length > 0 && !isNewChat) {
            const firstChat = chats[0];
            dispatch(setActiveChatId(firstChat.id));
            ensureChatLoaded(firstChat.id);
        }
    }, [chats, activeChatId, dispatch, ensureChatLoaded, isNewChat]);

    // useEffect(() => {
    //     if (activeChatId) setIsNewChat(false);
    // }, [activeChatId]);

    useEffect(() => {
        if (activeChatId) ensureChatLoaded(activeChatId);
    }, [activeChatId, ensureChatLoaded]);

    useEffect(() => {
        scrollToBottom();
    }, [activeMessages, pendingMessage, streamingChat, scrollToBottom]);

    useEffect(() => {
        if (streamingError) toast.error(streamingError);
    }, [streamingError]);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }, [draft]);

    const handleSelectChat = (chatId: string) => {
        setIsNewChat(false);
        setMobileSidebarOpen(false);
        dispatch(setActiveChatId(chatId));
        ensureChatLoaded(chatId);
    };

    const handleNewChat = () => {
        setIsNewChat(true);
        setPendingMessage(null);
        setDraft("");
        setMobileSidebarOpen(false);
        dispatch(setActiveChatId(null));
    };

    const handleDeleteChat = async (chatId: string) => {
        const response = await dispatch(chatActions.deleteChat({ chatId }));
        if (chatActions.deleteChat.fulfilled.match(response)) {
            toast.success("Chat deleted.");
            if (chatId === activeChatId) {
                dispatch(setActiveChatId(null));
                setIsNewChat(true);
            }
            refreshChats();
        } else {
            const payload = response.payload as { message?: string } | undefined;
            toast.error(payload?.message ?? "Failed to delete chat.");
        }
    };

    const handleSendAssistant = async () => {
        const trimmed = draft.trim();
        if (!trimmed || streamingChat) return;

        setPendingMessage(trimmed);
        setDraft("");

        const response = await dispatch(
            chatActions.projectChat({
                projectId,
                message: trimmed,
                chatId: activeChatId ?? undefined,
            })
        );

        setPendingMessage(null);

        if (chatActions.projectChat.fulfilled.match(response)) {
            const newChatId = response.payload.chatId;
            if (newChatId) {
                dispatch(setActiveChatId(newChatId));
                // await dispatch(
                //     chatActions.getChat({ chatId: newChatId, limit: CHAT_MESSAGE_LIMIT })
                // );
                // refreshChats();
            }
        } else {
            const payload = response.payload as { message?: string } | undefined;
            toast.error(payload?.message ?? "Failed to generate response.");
        }
    };

    const handleSaveNote = async () => {
        const trimmed = draft.trim();
        if (!trimmed || addingMessage || creatingChat) return;

        let chatId = activeChatId;
        if (!chatId) {
            const createResponse = await dispatch(
                chatActions.createChat({ projectId, title: buildChatTitle(trimmed) })
            );
            if (chatActions.createChat.fulfilled.match(createResponse)) {
                const payload = createResponse.payload as Payload<{
                    chat: { id: string };
                }>;
                chatId = payload.data?.chat?.id ?? null;
            }
        }
        if (!chatId) {
            toast.error("Failed to create chat for the note.");
            return;
        }

        dispatch(setActiveChatId(chatId));
        const response = await dispatch(chatActions.addMessage({ chatId, content: trimmed }));
        if (chatActions.addMessage.fulfilled.match(response)) {
            setDraft("");
            // refreshChats();
        } else {
            const payload = response.payload as { message?: string } | undefined;
            toast.error(payload?.message ?? "Failed to save note.");
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (composerMode === "assistant") {
            await handleSendAssistant();
        } else {
            await handleSaveNote();
        }
    };

    const isBusy = streamingChat || addingMessage || creatingChat;
    const showEmpty = activeMessages.length === 0 && !pendingMessage && !gettingChat;

    const sidebar = (
        <ChatList
            chats={chats}
            activeChatId={activeChatId}
            loadingChats={loadingChats}
            query={query}
            deletingChat={deletingChat}
            onQueryChange={setQuery}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
        />
    );

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
            {/* Desktop sidebar */}
            <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-border bg-card/40 md:flex">
                <div className="flex items-center gap-2 border-b border-border px-4 py-2 pb-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted">
                        <Sparkles className="size-4 text-foreground" />
                    </div>
                    <span className="text-sm font-semibold">ASTra</span>
                </div>
                <div className="min-h-0 flex-1">{sidebar}</div>
            </aside>

            {/* Mobile sidebar */}
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
                <SheetContent side="left" className="w-80 p-0">
                    <SheetHeader className="border-b border-border px-4 py-3.5">
                        <SheetTitle className="flex items-center gap-2 text-sm">
                            <Sparkles className="size-4" />
                            ASTra
                        </SheetTitle>
                    </SheetHeader>
                    <div className="h-[calc(100vh-57px)]">{sidebar}</div>
                </SheetContent>
            </Sheet>

            {/* Main area */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Header */}
                <header className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-border px-4">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="md:hidden"
                        onClick={() => setMobileSidebarOpen(true)}
                        aria-label="Open chats"
                    >
                        <PanelLeft className="size-5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="hidden md:inline-flex"
                        onClick={() => router.back()}
                        aria-label="Go back"
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div className="flex min-w-0 flex-col">
                        <h1 className="truncate text-sm font-semibold">{activeTitle}</h1>
                        <p className="truncate text-xs text-muted-foreground">
                            {activeChatId
                                ? `${activeMessages.length} message${activeMessages.length === 1 ? "" : "s"}`
                                : "Ask questions about your project"}
                        </p>
                    </div>
                </header>

                {/* Messages */}
                <ScrollArea className="min-h-0 flex-1">
                    <div className="mx-auto w-full max-w-3xl px-4 py-8">
                        {gettingChat && activeMessages.length === 0 ? (
                            <div className="space-y-6">
                                {[...Array(3)].map((_, idx) => (
                                    <div
                                        key={idx}
                                        className="h-20 animate-pulse rounded-2xl bg-muted"
                                    />
                                ))}
                            </div>
                        ) : showEmpty ? (
                            <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
                                <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted">
                                    <Sparkles className="size-6 text-foreground" />
                                </div>
                                <div className="space-y-1.5">
                                    <h2 className="text-lg font-semibold">
                                        How can I help with this project?
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Ask anything about the codebase or save a quick note.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {activeMessages.map((message) => {
                                    const isUser = message.role === "USER";
                                    const isAssistant = message.role === "ASSISTANT";
                                    const sources =
                                        (
                                            message.metadata as {
                                                sources?: { filePath: string }[];
                                            } | null
                                        )?.sources ?? [];

                                    return (
                                        <div
                                            key={message.id}
                                            className={cn(
                                                "flex",
                                                isUser ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            {isUser ? (
                                                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-userbackground px-4 py-2.5 text-sm text-usertext">
                                                    <p className="whitespace-pre-wrap leading-relaxed">
                                                        {message.content}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="w-full max-w-full">
                                                    <div className="text-[0.9375rem] leading-7 text-foreground">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={MarkdownComponents}
                                                        >
                                                            {message.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                    {isAssistant && sources.length > 0 && (
                                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                                            {sources
                                                                .slice(0, 6)
                                                                .map((source, idx) => (
                                                                    <Badge
                                                                        key={`${source.filePath}-${idx}`}
                                                                        variant="secondary"
                                                                        className="font-mono text-[10px]"
                                                                    >
                                                                        {source.filePath
                                                                            .split("/")
                                                                            .pop() ??
                                                                            source.filePath}
                                                                    </Badge>
                                                                ))}
                                                        </div>
                                                    )}
                                                    <div className="mt-2 text-[11px] text-muted-foreground">
                                                        {formatTimestamp(message.createdAt)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {pendingMessage && (
                                    <div className="flex justify-end">
                                        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-userbackground px-4 py-2.5 text-sm text-usertext">
                                            <p className="whitespace-pre-wrap leading-relaxed">
                                                {pendingMessage}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {streamingChat && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Thinking...</span>
                                    </div>
                                )}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Composer */}
                <div className="flex-shrink-0 border-t border-border bg-background px-4 py-4">
                    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
                        <div className="mb-2 flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setComposerMode("assistant")}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                                    composerMode === "assistant"
                                        ? "bg-foreground text-background"
                                        : "border border-border text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Sparkles className="size-3" />
                                Ask ASTra
                            </button>
                            <button
                                type="button"
                                onClick={() => setComposerMode("note")}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                                    composerMode === "note"
                                        ? "bg-foreground text-background"
                                        : "border border-border text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <StickyNote className="size-3" />
                                Save Note
                            </button>
                        </div>

                        <div className="flex items-end gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm transition-colors focus-within:border-foreground/40">
                            <textarea
                                ref={textareaRef}
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder={
                                    composerMode === "assistant"
                                        ? "Ask anything about the codebase..."
                                        : "Write a quick note for this project..."
                                }
                                rows={1}
                                className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" && !event.shiftKey) {
                                        event.preventDefault();
                                        handleSubmit(event);
                                    }
                                }}
                                disabled={isBusy}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="size-9 flex-shrink-0 rounded-lg flex items-center justify-center"
                                disabled={isBusy || !draft.trim()}
                                aria-label={composerMode === "assistant" ? "Send" : "Save note"}
                            >
                                {isBusy ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Send className="size-4" />
                                )}
                            </Button>
                        </div>
                        <p className="mt-2 text-center text-[11px] text-muted-foreground">
                            {composerMode === "assistant"
                                ? "Press Enter to send, Shift + Enter for a new line"
                                : "Notes are saved instantly"}
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AiAssistant;
