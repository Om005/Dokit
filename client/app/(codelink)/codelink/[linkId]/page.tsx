"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { codelinkActions, clearCurrentLink } from "@/store/codelink";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { getLanguageExtension } from "@/utils/getLanguageExtension";
import { toast } from "sonner";
import {
    Lock,
    Eye,
    Calendar,
    Copy,
    Check,
    FileCode,
    Plus,
    Key,
    AlertTriangle,
    ArrowLeft,
    Settings,
    Save,
    XCircle,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PageProps {
    params: Promise<{ linkId: string }>;
}

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

export default function CodeLinkViewPage({ params }: PageProps) {
    const { linkId } = React.use(params);
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

    const { currentLink, gettingLink, updatingLink, error } = useSelector(
        (state: RootState) => state.codelink
    );

    const [password, setPassword] = useState("");
    const [isPasswordRequired, setIsPasswordRequired] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Edit mode states
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editLanguage, setEditLanguage] = useState("javascript");
    const [editCode, setEditCode] = useState("");
    const [editVisibility, setEditVisibility] = useState<"ANYONE_WITH_LINK" | "RESTRICTED">(
        "ANYONE_WITH_LINK"
    );
    const [editIsPasswordProtected, setEditIsPasswordProtected] = useState(false);
    const [editPassword, setEditPassword] = useState("");
    const [editAllowedUserEmails, setEditAllowedUserEmails] = useState("");
    const [editExpiresAt, setEditExpiresAt] = useState("");

    const fetchCodeLink = useCallback(
        async (pwd?: string) => {
            try {
                const result = await dispatch(
                    codelinkActions.getCodeLink({ linkId, password: pwd })
                );
                if (result.meta.requestStatus === "rejected") {
                    const payload = result.payload as { statusCode?: number; message?: string };
                    if (
                        payload?.statusCode === 401 ||
                        payload?.message?.toLowerCase().includes("password")
                    ) {
                        setIsPasswordRequired(true);
                    }
                } else {
                    setIsPasswordRequired(false);
                }
            } catch {
                toast.error("Failed to load code link");
            }
        },
        [dispatch, linkId]
    );

    useEffect(() => {
        dispatch(clearCurrentLink());
        const timer = setTimeout(() => {
            fetchCodeLink();
        }, 0);
        return () => clearTimeout(timer);
    }, [dispatch, fetchCodeLink]);

    useEffect(() => {
        if (currentLink) {
            document.title = `${currentLink.title || "Untitled Snippet"} - Dokit Code Link`;
        } else {
            document.title = "Code Link - Dokit";
        }
    }, [currentLink]);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            toast.error("Please enter a password");
            return;
        }
        fetchCodeLink(password);
    };

    const handleCopy = async () => {
        if (!currentLink?.code) return;
        try {
            await navigator.clipboard.writeText(currentLink.code);
            setCopied(true);
            toast.success("Code copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy code");
        }
    };

    const handleSaveChanges = async () => {
        if (!editTitle.trim()) {
            toast.error("Title is required");
            return;
        }
        if (!editCode.trim()) {
            toast.error("Code is required");
            return;
        }
        if (editIsPasswordProtected && !editPassword.trim() && !currentLink?.isPasswordProtected) {
            toast.error("Password is required when password protection is enabled");
            return;
        }

        const emailsArray = editAllowedUserEmails
            ? editAllowedUserEmails
                  .split(",")
                  .map((email) => email.trim())
                  .filter((email) => email.length > 0)
            : undefined;

        try {
            const result = await dispatch(
                codelinkActions.updateCodeLink({
                    linkId,
                    title: editTitle,
                    description: editDescription || "",
                    language: editLanguage,
                    code: editCode,
                    visibility: editVisibility,
                    isPasswordProtected: editIsPasswordProtected,
                    password: editPassword.trim() ? editPassword : undefined,
                    allowedUserEmails: editVisibility === "RESTRICTED" ? emailsArray : undefined,
                    expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
                })
            );

            if (result.meta.requestStatus === "fulfilled") {
                toast.success("Code link updated successfully!");
                setIsEditing(false);
                fetchCodeLink(password);
            } else {
                const err = result.payload as { message?: string };
                toast.error(err?.message || "Failed to update code link");
            }
        } catch {
            toast.error("An error occurred while updating code link");
        }
    };

    const handleDeleteSnippet = async () => {
        try {
            const result = await dispatch(codelinkActions.deleteCodeLink({ linkId }));
            if (result.meta.requestStatus === "fulfilled") {
                toast.success("Code link deleted successfully");
                setShowDeleteConfirm(false);
                router.push("/dashboard/codelink/generate");
            } else {
                toast.error("Failed to delete code link");
            }
        } catch {
            toast.error("An error occurred while deleting the code link");
        }
    };

    const getFileExt = (langVal: string) => {
        const found = supportedLanguages.find((l) => l.value === langVal);
        return found ? found.ext : "txt";
    };

    if (isPasswordRequired) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-border/50 bg-card/40 backdrop-blur-md shadow-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-amber-500/10 p-3 rounded-full w-fit mb-2">
                            <Lock className="size-6 text-amber-500" />
                        </div>
                        <CardTitle className="text-xl">Password Required</CardTitle>
                        <CardDescription>
                            This code link is password protected. Enter the password below to access
                            the code snippet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="access-password">Access Password</Label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        id="access-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            {error && (
                                <div className="text-xs text-destructive flex items-center gap-1.5 bg-destructive/10 p-2 rounded-md border border-destructive/20">
                                    <AlertTriangle className="size-3.5" />
                                    {error}
                                </div>
                            )}
                            <Button type="submit" className="w-full" disabled={gettingLink}>
                                {gettingLink ? (
                                    <>
                                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                                        Unlocking...
                                    </>
                                ) : (
                                    "Unlock Snippet"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error && !isPasswordRequired && !currentLink) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-border/50 bg-card/40 backdrop-blur-md text-center py-6">
                    <CardContent className="space-y-4">
                        <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-2">
                            <AlertTriangle className="size-6 text-destructive" />
                        </div>
                        <h2 className="text-xl font-bold">Failed to load Code Link</h2>
                        <p className="text-sm text-muted-foreground">
                            {error || "The link may be expired, restricted, or incorrect."}
                        </p>
                        <Button asChild className="w-full mt-4" variant="outline">
                            <Link href="/">
                                <ArrowLeft className="size-4 mr-2" />
                                Go to Homepage
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (gettingLink && !currentLink) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                        Retrieving secure code snippet...
                    </p>
                </div>
            </div>
        );
    }

    if (currentLink) {
        const fileExt = getFileExt(isEditing ? editLanguage : currentLink.language);
        const langExt = getLanguageExtension(`file.${fileExt}`);
        const extensions = langExt
            ? [langExt, oneDark, EditorView.lineWrapping]
            : [oneDark, EditorView.lineWrapping];

        return (
            <div className="min-h-screen bg-background pb-12">
                <div className="mx-auto max-w-5xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
                    {/* Header Controls */}
                    <div className="mb-6 flex justify-between items-center">
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <Link href="/dashboard/codelink/generate">
                                <ArrowLeft className="size-4 mr-2" />
                                Generate New Link
                            </Link>
                        </Button>

                        <div className="flex items-center gap-2">
                            {currentLink.isOwner && (
                                <>
                                    <Button
                                        variant={isEditing ? "secondary" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            if (!isEditing) {
                                                // Pre-populate edit states when entering edit mode
                                                setEditTitle(currentLink.title || "");
                                                setEditDescription(currentLink.description || "");
                                                setEditLanguage(
                                                    currentLink.language || "javascript"
                                                );
                                                setEditCode(currentLink.code || "");
                                                setEditVisibility(
                                                    currentLink.visibility || "ANYONE_WITH_LINK"
                                                );
                                                setEditIsPasswordProtected(
                                                    currentLink.isPasswordProtected || false
                                                );
                                                setEditPassword("");
                                                setEditAllowedUserEmails(
                                                    currentLink.allowedUserEmails
                                                        ? currentLink.allowedUserEmails.join(", ")
                                                        : ""
                                                );
                                                setEditExpiresAt(
                                                    currentLink.expiresAt
                                                        ? new Date(currentLink.expiresAt)
                                                              .toISOString()
                                                              .slice(0, 16)
                                                        : ""
                                                );
                                            }
                                            setIsEditing(!isEditing);
                                        }}
                                        className="border-primary/20 text-primary hover:bg-primary/10"
                                    >
                                        {isEditing ? (
                                            <>
                                                <XCircle className="size-4 mr-1.5" />
                                                Cancel Editing
                                            </>
                                        ) : (
                                            <>
                                                <Settings className="size-4 mr-1.5" />
                                                Edit Snippet
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        <Trash2 className="size-4 mr-1.5" />
                                        Delete Snippet
                                    </Button>
                                </>
                            )}

                            {currentLink.isPasswordProtected && !isEditing && (
                                <Badge
                                    variant="outline"
                                    className="border-amber-500/20 text-amber-500 bg-amber-500/5"
                                >
                                    <Lock className="size-3 mr-1.5" />
                                    Password Protected
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Main Workspace Card */}
                    <Card className="border-border/50 bg-card/40 backdrop-blur-md mb-6">
                        {/* Editor/Viewer Header */}
                        <CardHeader>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-title">Snippet Title</Label>
                                        <Input
                                            id="edit-title"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            placeholder="Untitled Snippet"
                                            className="font-bold text-lg"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-desc">
                                            Snippet Description (Optional)
                                        </Label>
                                        <Input
                                            id="edit-desc"
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            placeholder="Describe what this snippet does"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-lang">Language</Label>
                                        <Select
                                            value={editLanguage}
                                            onValueChange={setEditLanguage}
                                        >
                                            <SelectTrigger id="edit-lang">
                                                <SelectValue />
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
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <CardTitle className="text-2xl font-bold tracking-tight">
                                                {currentLink.title || "Untitled Snippet"}
                                            </CardTitle>
                                            <Badge
                                                className="capitalize text-[10px]"
                                                variant="secondary"
                                            >
                                                {currentLink.language}
                                            </Badge>
                                        </div>
                                        {currentLink.description && (
                                            <CardDescription className="mt-2 text-sm">
                                                {currentLink.description}
                                            </CardDescription>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-4 md:mt-0">
                                        <span className="flex items-center gap-1.5 bg-input/10 py-1 px-2.5 rounded-full border border-border/30">
                                            <Eye className="size-3.5" />
                                            {currentLink.viewCount} views
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-input/10 py-1 px-2.5 rounded-full border border-border/30">
                                            <Calendar className="size-3.5" />
                                            {new Date(currentLink.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </CardHeader>

                        {/* Editor/Viewer Workspace */}
                        <CardContent className="p-0 border-t border-border/30 relative">
                            {/* Copy button overlay (Only in read-only mode) */}
                            {!isEditing && (
                                <div className="absolute right-4 top-4 z-10 animate-in fade-in duration-200">
                                    <Button
                                        size="sm"
                                        className="h-8 shadow-md border border-border/50 bg-secondary/80 hover:bg-secondary backdrop-blur-xs text-xs"
                                        onClick={handleCopy}
                                        variant="outline"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="size-3.5 mr-1.5 text-emerald-500" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="size-3.5 mr-1.5" />
                                                Copy Code
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            <div className="overflow-hidden min-h-[400px] bg-[#282c34]">
                                <CodeMirror
                                    value={isEditing ? editCode : (currentLink.code ?? "")}
                                    theme={oneDark}
                                    extensions={extensions}
                                    readOnly={!isEditing}
                                    height="auto"
                                    minHeight="400px"
                                    onChange={(val) => {
                                        if (isEditing) setEditCode(val);
                                    }}
                                    style={{ fontSize: "14px" }}
                                    basicSetup={{
                                        lineNumbers: true,
                                        foldGutter: true,
                                        highlightActiveLine: isEditing,
                                        highlightSelectionMatches: true,
                                        tabSize: 4,
                                    }}
                                />
                            </div>

                            {/* Extra Settings Forms (Visible only in edit mode) */}
                            {isEditing && (
                                <div className="p-6 border-t border-border/30 space-y-5 bg-input/5 animate-in slide-in-from-bottom-2 duration-300">
                                    <h3 className="font-semibold text-sm flex items-center gap-1.5 text-primary border-b border-border/30 pb-2">
                                        <Settings className="size-4" />
                                        Advanced Link Settings
                                    </h3>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        {/* Expiration Settings */}
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="edit-expiry"
                                                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                                            >
                                                <Calendar className="size-3.5" />
                                                Expiration
                                            </Label>
                                            <Input
                                                id="edit-expiry"
                                                type="datetime-local"
                                                value={editExpiresAt}
                                                onChange={(e) => setEditExpiresAt(e.target.value)}
                                            />
                                            <span className="text-[10px] text-muted-foreground block">
                                                Leave empty to keep the link active indefinitely.
                                            </span>
                                        </div>

                                        {/* Visibility Settings */}
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                                Visibility & Access
                                            </Label>
                                            <Select
                                                value={editVisibility}
                                                onValueChange={(
                                                    val: "ANYONE_WITH_LINK" | "RESTRICTED"
                                                ) => setEditVisibility(val)}
                                            >
                                                <SelectTrigger className="w-full">
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
                                    </div>

                                    {editVisibility === "RESTRICTED" && (
                                        <div className="space-y-2 animate-in fade-in duration-200">
                                            <Label htmlFor="edit-emails">
                                                Allowed User Emails (Comma-separated)
                                            </Label>
                                            <Input
                                                id="edit-emails"
                                                placeholder="user1@example.com, user2@example.com"
                                                value={editAllowedUserEmails}
                                                onChange={(e) =>
                                                    setEditAllowedUserEmails(e.target.value)
                                                }
                                            />
                                        </div>
                                    )}

                                    {/* Password protection details */}
                                    <div className="border-t border-border/20 pt-4 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label
                                                    htmlFor="edit-password-toggle"
                                                    className="flex items-center gap-1.5 font-medium"
                                                >
                                                    <Lock className="size-4 text-muted-foreground" />
                                                    Password Protection
                                                </Label>
                                                <span className="text-xs text-muted-foreground block">
                                                    Restrict viewing access with a password.
                                                </span>
                                            </div>
                                            <Switch
                                                id="edit-password-toggle"
                                                checked={editIsPasswordProtected}
                                                onCheckedChange={setEditIsPasswordProtected}
                                            />
                                        </div>

                                        {editIsPasswordProtected && (
                                            <div className="space-y-2 animate-in fade-in duration-200">
                                                <Label htmlFor="edit-password">
                                                    Access Password
                                                </Label>
                                                <Input
                                                    id="edit-password"
                                                    type="password"
                                                    placeholder="Enter new password (leave empty to keep current password)"
                                                    value={editPassword}
                                                    onChange={(e) =>
                                                        setEditPassword(e.target.value)
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>

                        {/* Editor/Viewer Footer */}
                        <CardFooter className="py-4 px-6 border-t border-border/30 bg-input/5 flex justify-between items-center flex-wrap gap-4">
                            {isEditing ? (
                                <div className="flex items-center justify-end w-full gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsEditing(false)}
                                        disabled={updatingLink}
                                        type="button"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveChanges}
                                        disabled={updatingLink}
                                        type="button"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                                    >
                                        {updatingLink ? (
                                            <>
                                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                                                Saving Changes...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="size-4 mr-1.5" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <FileCode className="size-3.5 text-primary" />
                                        Rendered via Dokit Codelink
                                    </span>
                                    <Button asChild size="sm">
                                        <Link href="/dashboard/codelink/generate">
                                            <Plus className="size-4 mr-1.5" />
                                            Generate Your Own Link
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </CardFooter>
                    </Card>
                </div>

                {/* Deletion confirmation AlertDialog */}
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-600 dark:text-red-500">
                                Delete Code Link
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to permanently delete &ldquo;
                                {currentLink.title || "this snippet"}&rdquo;? This action cannot be
                                undone and visitors will no longer be able to access this code.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-3 mt-4">
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteSnippet} variant="destructive">
                                Delete
                            </AlertDialogAction>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    return null;
}
