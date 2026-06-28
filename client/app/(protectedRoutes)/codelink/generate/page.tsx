"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { codelinkActions, CodeLink } from "@/store/codelink";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { getLanguageExtension } from "@/utils/getLanguageExtension";
import { toast } from "sonner";
import {
    Link2,
    Copy,
    Trash2,
    Eye,
    Calendar,
    Clock,
    FileCode,
    Lock,
    Plus,
    Check,
    Search,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const supportedLanguages = [
    { value: "javascript", label: "JavaScript", ext: "js" },
    { value: "typescript", label: "TypeScript", ext: "ts" },
    { value: "python", label: "Python", ext: "py" },
    { value: "java", label: "Java", ext: "java" },
    { value: "c", label: "C", ext: "c" },
    { value: "cpp", label: "C++", ext: "cpp" },
    { value: "csharp", label: "C#", ext: "cs" },
    { value: "go", label: "Go", ext: "go" },
    { value: "ruby", label: "Ruby", ext: "rb" },
    { value: "php", label: "PHP", ext: "php" },
    { value: "swift", label: "Swift", ext: "swift" },
    { value: "kotlin", label: "Kotlin", ext: "kt" },
    { value: "rust", label: "Rust", ext: "rs" },
    { value: "scala", label: "Scala", ext: "scala" },
    { value: "perl", label: "Perl", ext: "pl" },
    { value: "haskell", label: "Haskell", ext: "hs" },
    { value: "lua", label: "Lua", ext: "lua" },
    { value: "r", label: "R", ext: "r" },
];

export default function CodeLinkGeneratePage() {
    const dispatch = useDispatch<AppDispatch>();
    const { links, loadingLinks, creatingLink } = useSelector((state: RootState) => state.codelink);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [language, setLanguage] = useState("javascript");
    const [code, setCode] = useState("// Write your code here...");
    const [visibility, setVisibility] = useState<"ANYONE_WITH_LINK" | "RESTRICTED">(
        "ANYONE_WITH_LINK"
    );
    const [isPasswordProtected, setIsPasswordProtected] = useState(false);
    const [password, setPassword] = useState("");
    const [allowedUserEmails, setAllowedUserEmails] = useState("");
    const [expiresAt, setExpiresAt] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [generatedLinkUrl, setGeneratedLinkUrl] = useState("");
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    useEffect(() => {
        dispatch(codelinkActions.listCodeLinks());
    }, [dispatch]);

    const handleCopy = async (id: string, isNotification = true) => {
        const url = `${window.location.origin}/codelink/${id}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedLinkId(id);
            if (isNotification) toast.success("Code link copied to clipboard!");
            setTimeout(() => setCopiedLinkId(null), 2000);
        } catch {
            toast.error("Failed to copy link");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const result = await dispatch(codelinkActions.deleteCodeLink({ linkId: id }));
            if (result.meta.requestStatus === "fulfilled") {
                toast.success("Code link deleted successfully");
            } else {
                toast.error("Failed to delete code link");
            }
        } catch {
            toast.error("An error occurred while deleting code link");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }
        if (!code.trim()) {
            toast.error("Code is required");
            return;
        }
        if (isPasswordProtected && !password.trim()) {
            toast.error("Password is required when password protection is enabled");
            return;
        }

        const emailsArray = allowedUserEmails
            ? allowedUserEmails
                  .split(",")
                  .map((email) => email.trim())
                  .filter((email) => email.length > 0)
            : undefined;

        try {
            const result = await dispatch(
                codelinkActions.createCodeLink({
                    title,
                    description: description || undefined,
                    language,
                    code,
                    visibility,
                    isPasswordProtected,
                    password: isPasswordProtected ? password : undefined,
                    allowedUserEmails: visibility === "RESTRICTED" ? emailsArray : undefined,
                    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
                })
            );

            if (result.meta.requestStatus === "fulfilled") {
                const responseData = result.payload as { data?: { linkId: string } };
                const newLinkId = responseData.data?.linkId;
                if (newLinkId) {
                    setGeneratedLinkUrl(`${window.location.origin}/codelink/${newLinkId}`);
                    setSuccessDialogOpen(true);
                    setTitle("");
                    setDescription("");
                    setCode("// Write your code here...");
                    setIsPasswordProtected(false);
                    setPassword("");
                    setAllowedUserEmails("");
                    setExpiresAt("");
                    dispatch(codelinkActions.listCodeLinks());
                }
            } else {
                const err = result.payload as { message?: string };
                toast.error(err?.message || "Failed to generate code link");
            }
        } catch {
            toast.error("An error occurred while generating code link");
        }
    };

    const getFileExt = (langVal: string) => {
        const found = supportedLanguages.find((l) => l.value === langVal);
        return found ? found.ext : "txt";
    };

    const langExt = getLanguageExtension(`file.${getFileExt(language)}`);
    const extensions = langExt ? [langExt, oneDark] : [oneDark];

    const filteredLinks = links.filter(
        (link) =>
            link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            link.language.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isLinkExpired = (link: CodeLink) => {
        if (!link.expiresAt) return false;
        return new Date(link.expiresAt) < new Date();
    };

    return (
        <div className="min-h-screen bg-background pb-12">
            <div className="mx-auto max-w-7xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                        Code Links
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Generate shareable code snippets with optional password protection,
                        expiration, and restricted access.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-12 items-start">
                    {/* Left Column - Creator Form */}
                    <div className="lg:col-span-7 space-y-6">
                        <Card className="border-border/50 bg-card/40 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Plus className="size-5 text-primary" />
                                    Create New Code Link
                                </CardTitle>
                                <CardDescription>
                                    Share a code snippet securely with anyone.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Title & Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title *</Label>
                                        <Input
                                            id="title"
                                            placeholder="My Awesome Script"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description (Optional)</Label>
                                        <Input
                                            id="description"
                                            placeholder="Explain what this code snippet does..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>

                                    {/* Language Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="language">Language *</Label>
                                        <Select value={language} onValueChange={setLanguage}>
                                            <SelectTrigger id="language" className="w-full">
                                                <SelectValue placeholder="Select a language" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {supportedLanguages.map((lang) => (
                                                    <SelectItem key={lang.value} value={lang.value}>
                                                        {lang.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Code Editor */}
                                    <div className="space-y-2">
                                        <Label>Code Content *</Label>
                                        <div className="rounded-md border border-border/70 overflow-hidden min-h-[300px] bg-[#282c34]">
                                            <CodeMirror
                                                value={code}
                                                height="320px"
                                                theme={oneDark}
                                                extensions={extensions}
                                                onChange={(value) => setCode(value)}
                                                style={{ fontSize: "14px" }}
                                            />
                                        </div>
                                    </div>

                                    <div className="border-t border-border/40 my-6" />

                                    {/* Expiry Settings */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="expiresAt"
                                            className="flex items-center gap-1.5 text-sm font-medium"
                                        >
                                            <Calendar className="size-4 text-muted-foreground" />
                                            Expiration (Optional)
                                        </Label>
                                        <Input
                                            id="expiresAt"
                                            type="datetime-local"
                                            value={expiresAt}
                                            onChange={(e) => setExpiresAt(e.target.value)}
                                            className="w-full"
                                        />
                                        <span className="text-xs text-muted-foreground block">
                                            Leave empty if you want the link to never expire.
                                        </span>
                                    </div>

                                    {/* Access and Visibility Settings */}
                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-medium">
                                                    Visibility
                                                </Label>
                                                <span className="text-xs text-muted-foreground block">
                                                    Restrict this link to specific emails.
                                                </span>
                                            </div>
                                            <Select
                                                value={visibility}
                                                onValueChange={(
                                                    val: "ANYONE_WITH_LINK" | "RESTRICTED"
                                                ) => setVisibility(val)}
                                            >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ANYONE_WITH_LINK">
                                                        Anyone with link
                                                    </SelectItem>
                                                    <SelectItem value="RESTRICTED">
                                                        Restricted
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {visibility === "RESTRICTED" && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <Label htmlFor="allowedEmails">
                                                    Allowed User Emails (Comma-separated)
                                                </Label>
                                                <Input
                                                    id="allowedEmails"
                                                    placeholder="user1@example.com, user2@example.com"
                                                    value={allowedUserEmails}
                                                    onChange={(e) =>
                                                        setAllowedUserEmails(e.target.value)
                                                    }
                                                />
                                            </div>
                                        )}

                                        {/* Password Protection */}
                                        <div className="flex items-center justify-between border-t border-border/40 pt-4">
                                            <div className="space-y-0.5">
                                                <Label
                                                    htmlFor="password-toggle"
                                                    className="flex items-center gap-1.5 font-medium"
                                                >
                                                    <Lock className="size-4 text-muted-foreground" />
                                                    Password Protection
                                                </Label>
                                                <span className="text-xs text-muted-foreground block">
                                                    Require a password to view the code.
                                                </span>
                                            </div>
                                            <Switch
                                                id="password-toggle"
                                                checked={isPasswordProtected}
                                                onCheckedChange={setIsPasswordProtected}
                                            />
                                        </div>

                                        {isPasswordProtected && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <Label htmlFor="password">Access Password</Label>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    placeholder="Enter a secure password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required={isPasswordProtected}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        className="w-full mt-6"
                                        size="lg"
                                        disabled={creatingLink}
                                    >
                                        {creatingLink ? (
                                            <>
                                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                                                Generating Link...
                                            </>
                                        ) : (
                                            <>
                                                <Link2 className="size-4 mr-2" />
                                                Generate Shareable Link
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Existing links list */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="border-border/50 bg-card/40 backdrop-blur-md min-h-[500px]">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <FileCode className="size-5 text-primary" />
                                        My Generated Links
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    Manage your previously created code snippets.
                                </CardDescription>

                                {/* Search */}
                                <div className="relative mt-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search links by title or language..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 h-8 text-xs"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {loadingLinks ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary mb-4" />
                                        <p className="text-sm text-muted-foreground">
                                            Loading code links...
                                        </p>
                                    </div>
                                ) : filteredLinks.length === 0 ? (
                                    <div className="text-center py-20 border border-dashed rounded-lg">
                                        <p className="text-sm text-muted-foreground">
                                            {searchQuery
                                                ? "No matching code links found."
                                                : "No code links generated yet."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                                        {filteredLinks.map((link) => {
                                            const expired = isLinkExpired(link);
                                            return (
                                                <div
                                                    key={link.id}
                                                    className="flex flex-col justify-between p-4 border border-border/50 rounded-lg bg-input/10 hover:bg-input/20 transition-all gap-3"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <h3 className="font-semibold text-sm line-clamp-1 flex-1">
                                                                {link.title || "Untitled Snippet"}
                                                            </h3>
                                                            <Badge
                                                                variant="outline"
                                                                className="capitalize text-[10px]"
                                                            >
                                                                {link.language}
                                                            </Badge>
                                                        </div>
                                                        {link.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                                {link.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                                        <span className="flex items-center gap-1.5">
                                                            <Eye className="size-3" />
                                                            {link.viewCount} views
                                                        </span>
                                                        <span className="text-muted-foreground/30">
                                                            •
                                                        </span>

                                                        {/* Lock/Unlock badge */}
                                                        {link.isPasswordProtected ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] py-0 px-1.5 h-4 border-amber-500/20 text-amber-500 bg-amber-500/5"
                                                            >
                                                                <Lock className="size-2.5 mr-1" />
                                                                Protected
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] py-0 px-1.5 h-4 border-green-500/20 text-green-500 bg-green-500/5"
                                                            >
                                                                Public
                                                            </Badge>
                                                        )}

                                                        {link.visibility === "RESTRICTED" && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] py-0 px-1.5 h-4 border-blue-500/20 text-blue-500 bg-blue-500/5"
                                                            >
                                                                Restricted
                                                            </Badge>
                                                        )}

                                                        <span className="text-muted-foreground/30">
                                                            •
                                                        </span>

                                                        {/* Expiration state */}
                                                        {link.expiresAt ? (
                                                            <span
                                                                className={`flex items-center gap-1 ${expired ? "text-destructive" : "text-emerald-500"}`}
                                                            >
                                                                <Clock className="size-3" />
                                                                {expired
                                                                    ? "Expired"
                                                                    : new Date(
                                                                          link.expiresAt
                                                                      ).toLocaleDateString()}
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                                <Clock className="size-3" />
                                                                Never Expires
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2 pt-2 border-t border-border/30">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1 text-xs h-8"
                                                            onClick={() => handleCopy(link.id)}
                                                            disabled={expired}
                                                        >
                                                            {copiedLinkId === link.id ? (
                                                                <>
                                                                    <Check className="size-3.5 mr-1.5 text-emerald-500" />
                                                                    Copied
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="size-3.5 mr-1.5" />
                                                                    Copy Link
                                                                </>
                                                            )}
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-xs h-8 px-2.5"
                                                            asChild
                                                            disabled={expired}
                                                        >
                                                            <a
                                                                href={`/codelink/${link.id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <ExternalLink className="size-3.5" />
                                                            </a>
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() =>
                                                                setDeleteTargetId(link.id)
                                                            }
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Success Dialog */}
            <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
                <DialogContent className="sm:max-w-md border-border bg-card">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-500">
                            <Check className="size-5" />
                            Code Link Generated!
                        </DialogTitle>
                        <DialogDescription>
                            Your secure, shareable code snippet is ready to share.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 mt-4">
                        <div className="grid flex-1 gap-2">
                            <Input
                                id="link"
                                readOnly
                                value={generatedLinkUrl}
                                className="h-9 text-xs"
                            />
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            className="px-3"
                            onClick={() => {
                                navigator.clipboard.writeText(generatedLinkUrl);
                                toast.success("Copied to clipboard!");
                            }}
                        >
                            <span className="sr-only">Copy</span>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setSuccessDialogOpen(false)}
                        >
                            Close
                        </Button>
                        <Button type="button" asChild>
                            <a href={generatedLinkUrl} target="_blank" rel="noopener noreferrer">
                                Open Link
                                <ExternalLink className="size-4 ml-1.5" />
                            </a>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Deletion confirmation AlertDialog */}
            <AlertDialog
                open={deleteTargetId !== null}
                onOpenChange={(open) => !open && setDeleteTargetId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600 dark:text-red-500">
                            Delete Code Link
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete this code link? This action
                            cannot be undone and visitors will no longer be able to access this
                            code.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-3 mt-4">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (deleteTargetId) {
                                    await handleDelete(deleteTargetId);
                                    setDeleteTargetId(null);
                                }
                            }}
                            variant="destructive"
                        >
                            Delete
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
