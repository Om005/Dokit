"use client";

import { useEffect, useMemo, useState } from "react";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/store/store";
import { accountActions } from "@/store/account";
import { ProfileProjectCard } from "@/components/profile-project-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/loader";
import { AccountPasswordDialog } from "@/components/account-password-dialog";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Payload } from "@/types/types";
import {
    User,
    Settings,
    Monitor,
    Sparkles,
    Shield,
    Key,
    Trash2,
    LogOut,
    Pin,
    FileText,
    FolderOpen,
    Loader2,
    Lock,
} from "lucide-react";
import { Navbar } from "@/components/navbar";

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { username: routeUsername } = params as { username: string };

    const {
        publicProfile,
        myProfile,
        sessions,
        loadingPublicProfile,
        loadingMyProfile,
        loadingSessions,
        updatingSettings,
        changingPassword,
        deletingAccount,
        loggingOutSession,
        loggingOutOtherSessions,
        updatingProfileReadme,
        updatingPin,
    } = useSelector((state: RootState) => state.account);

    const {
        isAuthenticated,
        isAuthLoading,
        username: currentUsername,
    } = useSelector((state: RootState) => state.auth);

    const isOwnProfile =
        isAuthenticated &&
        currentUsername &&
        currentUsername.toLowerCase() === routeUsername.toLowerCase();

    const [activeTab, setActiveTab] = useState("overview");
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [signInEmailEnabled, setSignInEmailEnabled] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [profileReadmeDraft, setProfileReadmeDraft] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const profileData = isOwnProfile ? myProfile : publicProfile;

    useEffect(() => {
        if (!routeUsername || isAuthLoading) {
            return;
        }
        if (isOwnProfile) {
            dispatch(accountActions.fetchMyProfile());
            dispatch(accountActions.fetchSessions());
        } else {
            dispatch(accountActions.fetchPublicProfile({ username: routeUsername }));
        }
    }, [dispatch, routeUsername, isOwnProfile, isAuthLoading]);

    useEffect(() => {
        if (myProfile?.user) {
            setTwoFactorEnabled(myProfile.user.twoFactorEnabled);
            setSignInEmailEnabled(myProfile.user.signInEmailEnabled);
        }
    }, [myProfile]);

    useEffect(() => {
        if (myProfile?.profileReadme !== undefined && myProfile?.profileReadme !== null) {
            setProfileReadmeDraft(myProfile.profileReadme);
        }
        if (myProfile?.profileReadme === null) {
            setProfileReadmeDraft("");
        }
    }, [myProfile?.profileReadme]);

    const isLoadingProfile = isOwnProfile ? loadingMyProfile : loadingPublicProfile;

    const profileReadme = profileData?.profileReadme || null;

    const pinnedProjects = profileData?.pinnedProjects || [];
    const publicProjects =
        (isOwnProfile ? myProfile?.publicProjects : publicProfile?.projects) || [];
    const privateProjects = isOwnProfile ? myProfile?.privateProjects || [] : [];

    const canSavePassword =
        oldPassword.trim().length > 0 &&
        newPassword.trim().length > 0 &&
        newPassword === confirmPassword;

    const handleUpdateSettings = async (nextTwoFactor: boolean, nextSigninEmail: boolean) => {
        const result = await dispatch(
            accountActions.updateSettings({
                twoFactorEnabled: nextTwoFactor,
                signInEmailEnabled: nextSigninEmail,
            })
        );
        const payload = result.payload as Payload<{ settings: any }>;
        if (payload.success) {
            toast.success("Settings updated");
        } else {
            toast.error(payload.message || "Failed to update settings");
        }
    };

    const handleChangePassword = async () => {
        if (!canSavePassword) {
            return;
        }
        const result = await dispatch(
            accountActions.changePassword({
                oldPassword: oldPassword.trim(),
                newPassword: newPassword.trim(),
            })
        );
        const payload = result.payload as Payload<void>;
        if (payload.success) {
            toast.success("Password updated");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } else {
            toast.error(payload.message || "Failed to update password");
        }
    };

    const handleDeleteAccount = async (password: string) => {
        const result = await dispatch(accountActions.deleteAccount({ password }));
        const payload = result.payload as Payload<void>;
        if (payload.success) {
            toast.success("Account deleted");
            router.push("/");
        } else {
            toast.error(payload.message || "Failed to delete account");
        }
    };

    const handleLogoutSession = async (sessionId: string) => {
        const result = await dispatch(accountActions.logoutSession({ sessionId }));
        const payload = result.payload as Payload<{ sessionId: string }>;
        if (payload.success) {
            toast.success("Session logged out");
        } else {
            toast.error(payload.message || "Failed to log out session");
        }
    };

    const handleLogoutOtherSessions = async () => {
        const result = await dispatch(accountActions.logoutOtherSessions());
        const payload = result.payload as Payload<void>;
        if (payload.success) {
            toast.success("Logged out from other sessions");
        } else {
            toast.error(payload.message || "Failed to log out other sessions");
        }
    };

    const handleSaveReadme = async () => {
        const result = await dispatch(
            accountActions.updateProfileReadme({ content: profileReadmeDraft })
        );
        const payload = result.payload as Payload<{ profileReadme: string | null }>;
        if (payload.success) {
            toast.success("Profile readme updated");
        } else {
            toast.error(payload.message || "Failed to update profile readme");
        }
    };

    const handlePinProject = async (projectId: string, pinned: boolean) => {
        const result = await dispatch(accountActions.pinProject({ projectId, pinned }));
        const payload = result.payload as Payload<{ project: { id: string; pinned: boolean } }>;
        if (payload.success) {
            toast.success(pinned ? "Project pinned" : "Project unpinned");
        } else {
            toast.error(payload.message || "Failed to update pin");
        }
    };

    const initials = useMemo(() => {
        const first = profileData?.user?.firstName?.charAt(0) || "";
        const last = profileData?.user?.lastName?.charAt(0) || "";
        return `${first}${last}`.toUpperCase();
    }, [profileData?.user?.firstName, profileData?.user?.lastName]);

    const isKnownValue = (value?: string | null) => {
        if (!value) return false;
        return value.trim().toLowerCase() !== "unknown";
    };

    const getDeviceLabel = (value?: string | { name?: string | null } | null) => {
        if (!value) return null;
        const resolved = typeof value === "string" ? value : (value?.name ?? "");
        return isKnownValue(resolved) ? resolved : null;
    };

    const toDateLabel = (value?: string | number | Date | null) => {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleString();
    };

    if (isAuthLoading || isLoadingProfile) {
        return <Loader />;
    }

    if (!profileData?.user) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-b from-background to-muted/20">
                <div className="text-center space-y-4">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-2">
                        <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl font-semibold">Profile not found</h1>
                    <p className="text-muted-foreground max-w-sm">
                        The profile you are looking for does not exist or may have been removed.
                    </p>
                    <Button variant="outline" onClick={() => router.push("/")} className="mt-2">
                        Back to Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
            <Navbar />
            <div className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
                    {/* Profile Sidebar */}
                    <Card className="h-fit border-border/50 bg-gradient-to-b from-card to-card/80 shadow-lg sticky top-8">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="relative">
                                    <div className="flex size-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-bold text-primary shadow-inner">
                                        {initials || "U"}
                                    </div>
                                    {isOwnProfile && (
                                        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                                            <span className="text-[10px] text-white font-medium">
                                                You
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-xl">
                                        {profileData.user.firstName} {profileData.user.lastName}
                                    </CardTitle>
                                    <CardDescription className="text-base">
                                        @{profileData.user.username}
                                    </CardDescription>
                                </div>
                                {isOwnProfile && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-primary/10 text-primary border-primary/20"
                                    >
                                        <Shield className="size-3 mr-1" />
                                        Private View
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* <div className={`rounded-xl border p-4 text-sm ${profileReadme ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' : 'border-dashed border-border/50 text-muted-foreground'}`}>
                                <div className="flex items-center gap-2">
                                    Talk is cheap, show me the code.
                                </div>
                            </div> */}
                            {isOwnProfile && (
                                <Button
                                    className="w-full h-11 rounded-xl"
                                    variant="outline"
                                    onClick={() => setActiveTab("appearance")}
                                >
                                    <Sparkles className="size-4 mr-2" />
                                    Edit Public Appearance
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Main Content */}
                    <div className="space-y-6">
                        {isOwnProfile ? (
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="flex flex-wrap gap-2 bg-muted/50 p-1 rounded-xl h-auto">
                                    <TabsTrigger
                                        value="overview"
                                        className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg gap-2"
                                    >
                                        <User className="size-4" />
                                        Overview
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="account"
                                        className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg gap-2"
                                    >
                                        <Settings className="size-4" />
                                        Account
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="sessions"
                                        className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg gap-2"
                                    >
                                        <Monitor className="size-4" />
                                        Sessions
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="appearance"
                                        className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg gap-2"
                                    >
                                        <Sparkles className="size-4" />
                                        Appearance
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="space-y-6 mt-6">
                                    <Card className="border-border/50 shadow-sm">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                                                    <FileText className="h-5 w-5 text-blue-500" />
                                                </div>
                                                <div>
                                                    <CardTitle>Profile Readme</CardTitle>
                                                    <CardDescription>
                                                        A public preview of your profile readme.
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {profileReadme ? (
                                                <MarkdownPreview content={profileReadme} />
                                            ) : (
                                                <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
                                                    <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                                                    <p className="text-sm text-muted-foreground">
                                                        No profile readme published yet.
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border/50 shadow-sm">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center">
                                                    <Pin className="h-5 w-5 text-amber-500" />
                                                </div>
                                                <div>
                                                    <CardTitle>Pinned Projects</CardTitle>
                                                    <CardDescription>
                                                        Projects you want visitors to see first.
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {pinnedProjects.length === 0 ? (
                                                <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
                                                    <Pin className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                                                    <p className="text-sm text-muted-foreground">
                                                        No pinned projects yet.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    {pinnedProjects.map((project) => (
                                                        <ProfileProjectCard
                                                            key={project.id}
                                                            {...project}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border/50 shadow-sm">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center">
                                                    <FolderOpen className="h-5 w-5 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <CardTitle>Public Projects</CardTitle>
                                                    <CardDescription>
                                                        All public projects on your profile.
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {publicProjects.length === 0 ? (
                                                <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
                                                    <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                                                    <p className="text-sm text-muted-foreground">
                                                        No public projects yet.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    {publicProjects.map((project) => (
                                                        <ProfileProjectCard
                                                            key={project.id}
                                                            {...project}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border/50 shadow-sm">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-500/5 flex items-center justify-center">
                                                    <Lock className="h-5 w-5 text-slate-500" />
                                                </div>
                                                <div>
                                                    <CardTitle>Private Projects</CardTitle>
                                                    <CardDescription>
                                                        Visible only to you.
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {privateProjects.length === 0 ? (
                                                <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
                                                    <Lock className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                                                    <p className="text-sm text-muted-foreground">
                                                        No private projects yet.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    {privateProjects.map((project) => (
                                                        <ProfileProjectCard
                                                            key={project.id}
                                                            {...project}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="account" className="space-y-6 mt-6">
                                    <Card className="border-border/50 shadow-sm">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                                    <Shield className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <CardTitle>Security Settings</CardTitle>
                                                    <CardDescription>
                                                        Control how your account behaves.
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="rounded-xl border border-border/50 p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                                        <Key className="h-5 w-5 text-purple-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            Two-factor authentication
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Add an extra layer of security.
                                                        </p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={twoFactorEnabled}
                                                    onCheckedChange={(checked) => {
                                                        setTwoFactorEnabled(checked);
                                                        handleUpdateSettings(
                                                            checked,
                                                            signInEmailEnabled
                                                        );
                                                    }}
                                                    disabled={updatingSettings}
                                                />
                                            </div>

                                            <div className="rounded-xl border border-border/50 p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                                        <Monitor className="h-5 w-5 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            Email on sign-in
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Get notified of new sign-ins.
                                                        </p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={signInEmailEnabled}
                                                    onCheckedChange={(checked) => {
                                                        setSignInEmailEnabled(checked);
                                                        handleUpdateSettings(
                                                            twoFactorEnabled,
                                                            checked
                                                        );
                                                    }}
                                                    disabled={updatingSettings}
                                                />
                                            </div>

                                            <Separator />

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                                        <Key className="h-5 w-5 text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            Change password
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Update your account password.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid gap-4 sm:grid-cols-3 pl-[52px]">
                                                    <div className="space-y-2">
                                                        <Label
                                                            htmlFor="old-password"
                                                            className="text-sm"
                                                        >
                                                            Old password
                                                        </Label>
                                                        <Input
                                                            id="old-password"
                                                            type="password"
                                                            value={oldPassword}
                                                            onChange={(event) =>
                                                                setOldPassword(event.target.value)
                                                            }
                                                            className="h-10 bg-muted/30 border-border/50 rounded-lg"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label
                                                            htmlFor="new-password"
                                                            className="text-sm"
                                                        >
                                                            New password
                                                        </Label>
                                                        <Input
                                                            id="new-password"
                                                            type="password"
                                                            value={newPassword}
                                                            onChange={(event) =>
                                                                setNewPassword(event.target.value)
                                                            }
                                                            className="h-10 bg-muted/30 border-border/50 rounded-lg"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label
                                                            htmlFor="confirm-password"
                                                            className="text-sm"
                                                        >
                                                            Confirm password
                                                        </Label>
                                                        <Input
                                                            id="confirm-password"
                                                            type="password"
                                                            value={confirmPassword}
                                                            onChange={(event) =>
                                                                setConfirmPassword(
                                                                    event.target.value
                                                                )
                                                            }
                                                            className="h-10 bg-muted/30 border-border/50 rounded-lg"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="pl-[52px]">
                                                    <Button
                                                        onClick={handleChangePassword}
                                                        disabled={
                                                            !canSavePassword || changingPassword
                                                        }
                                                        className="h-10 rounded-lg"
                                                    >
                                                        {changingPassword ? (
                                                            <>
                                                                <Loader2 className="size-4 animate-spin mr-2" />
                                                                Updating...
                                                            </>
                                                        ) : (
                                                            "Update password"
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                                            <Trash2 className="h-5 w-5 text-red-500" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-red-600 dark:text-red-400">
                                                                Danger zone
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Permanently delete your account.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => setDeleteDialogOpen(true)}
                                                        disabled={deletingAccount}
                                                        className="rounded-lg"
                                                    >
                                                        Delete account
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="sessions" className="space-y-6 mt-6">
                                    <Card className="border-border/50 shadow-sm">
                                        <CardHeader>
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center">
                                                        <Monitor className="h-5 w-5 text-cyan-500" />
                                                    </div>
                                                    <div>
                                                        <CardTitle>Active Sessions</CardTitle>
                                                        <CardDescription>
                                                            Manage your active sessions and devices.
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    onClick={handleLogoutOtherSessions}
                                                    disabled={loggingOutOtherSessions}
                                                    className="rounded-lg"
                                                >
                                                    <LogOut className="size-4 mr-2" />
                                                    Logout other sessions
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {loadingSessions ? (
                                                <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
                                                    <Loader2 className="mx-auto h-8 w-8 text-muted-foreground animate-spin mb-3" />
                                                    <p className="text-sm text-muted-foreground">
                                                        Loading sessions...
                                                    </p>
                                                </div>
                                            ) : sessions.length === 0 ? (
                                                <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
                                                    <Monitor className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                                                    <p className="text-sm text-muted-foreground">
                                                        No active sessions found.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {sessions.map((session) => (
                                                        <div
                                                            key={session.id}
                                                            className="rounded-xl border border-border/50 p-4 hover:bg-muted/30 transition-colors"
                                                        >
                                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                                <div className="flex items-start gap-3">
                                                                    <div
                                                                        className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${session.isCurrent ? "bg-emerald-500/10" : "bg-muted"}`}
                                                                    >
                                                                        <Monitor
                                                                            className={`h-5 w-5 ${session.isCurrent ? "text-emerald-500" : "text-muted-foreground"}`}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <p className="font-medium">
                                                                                {session.ip}
                                                                            </p>
                                                                            {session.isCurrent && (
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                                                                >
                                                                                    Current session
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        {(() => {
                                                                            const locationParts = [
                                                                                isKnownValue(
                                                                                    session.city
                                                                                )
                                                                                    ? session.city
                                                                                    : null,
                                                                                isKnownValue(
                                                                                    session.region
                                                                                )
                                                                                    ? session.region
                                                                                    : null,
                                                                                isKnownValue(
                                                                                    session.country
                                                                                )
                                                                                    ? session.country
                                                                                    : null,
                                                                            ].filter(
                                                                                Boolean
                                                                            ) as string[];
                                                                            if (
                                                                                locationParts.length ===
                                                                                0
                                                                            ) {
                                                                                return null;
                                                                            }
                                                                            return (
                                                                                <p className="text-sm text-muted-foreground">
                                                                                    {locationParts.join(
                                                                                        ", "
                                                                                    )}
                                                                                </p>
                                                                            );
                                                                        })()}
                                                                        {(() => {
                                                                            const browserLabel =
                                                                                getDeviceLabel(
                                                                                    session.browser
                                                                                );
                                                                            const osLabel =
                                                                                getDeviceLabel(
                                                                                    session.os
                                                                                );
                                                                            if (
                                                                                !browserLabel &&
                                                                                !osLabel
                                                                            )
                                                                                return null;
                                                                            if (
                                                                                browserLabel &&
                                                                                osLabel
                                                                            ) {
                                                                                return (
                                                                                    <p className="text-sm text-muted-foreground">
                                                                                        {
                                                                                            browserLabel
                                                                                        }{" "}
                                                                                        on {osLabel}
                                                                                    </p>
                                                                                );
                                                                            }
                                                                            return (
                                                                                <p className="text-sm text-muted-foreground">
                                                                                    {browserLabel ||
                                                                                        osLabel}
                                                                                </p>
                                                                            );
                                                                        })()}
                                                                        <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                                                                            {toDateLabel(
                                                                                session.lastSeen
                                                                            ) && (
                                                                                <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-1">
                                                                                    Last seen:{" "}
                                                                                    {toDateLabel(
                                                                                        session.lastSeen
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                            {toDateLabel(
                                                                                session.createdAt
                                                                            ) && (
                                                                                <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-1">
                                                                                    Created:{" "}
                                                                                    {toDateLabel(
                                                                                        session.createdAt
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                            {toDateLabel(
                                                                                session.expiresAt
                                                                            ) && (
                                                                                <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-1">
                                                                                    Expires:{" "}
                                                                                    {toDateLabel(
                                                                                        session.expiresAt
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        handleLogoutSession(
                                                                            session.id
                                                                        )
                                                                    }
                                                                    disabled={loggingOutSession}
                                                                    className="rounded-lg"
                                                                >
                                                                    <LogOut className="size-4 mr-2" />
                                                                    Logout
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="appearance" className="space-y-6 mt-6">
                                    <Card className="border-border/50 shadow-sm">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 flex items-center justify-center">
                                                    <Sparkles className="h-5 w-5 text-pink-500" />
                                                </div>
                                                <div>
                                                    <CardTitle>Public Appearance</CardTitle>
                                                    <CardDescription>
                                                        Control what visitors see on your profile.
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-3">
                                                <Label
                                                    htmlFor="profile-readme"
                                                    className="text-sm font-medium"
                                                >
                                                    Profile Readme (Markdown)
                                                </Label>
                                                <textarea
                                                    id="profile-readme"
                                                    value={profileReadmeDraft}
                                                    onChange={(event) =>
                                                        setProfileReadmeDraft(event.target.value)
                                                    }
                                                    placeholder="Write your profile readme here using Markdown..."
                                                    className="min-h-[200px] w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm shadow-xs focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all resize-y"
                                                />
                                                <Button
                                                    onClick={handleSaveReadme}
                                                    disabled={updatingProfileReadme}
                                                    className="h-10 rounded-lg"
                                                >
                                                    {updatingProfileReadme ? (
                                                        <>
                                                            <Loader2 className="size-4 animate-spin mr-2" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        "Save profile readme"
                                                    )}
                                                </Button>
                                            </div>

                                            <Separator />

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                                        <Pin className="h-5 w-5 text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            Pin public projects
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Choose which projects to highlight on
                                                            your profile.
                                                        </p>
                                                    </div>
                                                </div>
                                                {publicProjects.length === 0 ? (
                                                    <div className="rounded-xl border border-dashed border-border/50 p-8 text-center ml-[52px]">
                                                        <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                                                        <p className="text-sm text-muted-foreground">
                                                            You have no public projects yet.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3 pl-[52px]">
                                                        {publicProjects.map((project) => (
                                                            <div
                                                                key={project.id}
                                                                className="flex flex-col gap-3 rounded-xl border border-border/50 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition-colors"
                                                            >
                                                                <div>
                                                                    <p className="font-medium">
                                                                        {project.name}
                                                                    </p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {project.description ||
                                                                            "No description"}
                                                                    </p>
                                                                </div>
                                                                <Button
                                                                    variant={
                                                                        project.pinned
                                                                            ? "secondary"
                                                                            : "outline"
                                                                    }
                                                                    onClick={() =>
                                                                        handlePinProject(
                                                                            project.id,
                                                                            !project.pinned
                                                                        )
                                                                    }
                                                                    disabled={updatingPin}
                                                                    className={`rounded-lg ${project.pinned ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25" : ""}`}
                                                                >
                                                                    <Pin className="size-4 mr-2" />
                                                                    {project.pinned
                                                                        ? "Unpin"
                                                                        : "Pin"}
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <div className="space-y-6">
                                <Card className="border-border/50 shadow-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <CardTitle>Profile Readme</CardTitle>
                                                <CardDescription>
                                                    A quick introduction from this user.
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {profileReadme ? (
                                            <MarkdownPreview content={profileReadme} />
                                        ) : (
                                            <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
                                                <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                                                <p className="text-sm text-muted-foreground">
                                                    No profile readme published.
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border-border/50 shadow-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center">
                                                <Pin className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <CardTitle>Pinned Projects</CardTitle>
                                                <CardDescription>
                                                    Featured work by this user.
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {pinnedProjects.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
                                                <Pin className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                                                <p className="text-sm text-muted-foreground">
                                                    No pinned projects yet.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                {pinnedProjects.map((project) => (
                                                    <ProfileProjectCard
                                                        key={project.id}
                                                        {...project}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border-border/50 shadow-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center">
                                                <FolderOpen className="h-5 w-5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <CardTitle>All Public Projects</CardTitle>
                                                <CardDescription>
                                                    Explore everything this user has shared.
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {publicProjects.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
                                                <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                                                <p className="text-sm text-muted-foreground">
                                                    No public projects yet.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                {publicProjects.map((project) => (
                                                    <ProfileProjectCard
                                                        key={project.id}
                                                        {...project}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AccountPasswordDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onSubmit={handleDeleteAccount}
                isLoading={deletingAccount}
                title="Delete account"
                description="Enter your password to permanently delete your account."
            />
        </div>
    );
}
const MarkdownPreview = ({ content, className = "" }: { content: string; className?: string }) => {
    return (
        <div className={`markdown-renderer ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    p: ({ children, ...props }) => {
                        const childArray = React.Children.toArray(children);
                        const isImageRow = childArray.every(
                            (child) =>
                                typeof child !== "string" || child.trim() === "" || child === "\n"
                        );
                        if (isImageRow) {
                            return (
                                <p
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "6px",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "8px 0",
                                    }}
                                    {...props}
                                >
                                    {children}
                                </p>
                            );
                        }
                        return <p {...props}>{children}</p>;
                    },

                    img: ({ ...props }) => (
                        <img
                            {...props}
                            style={{
                                display: "inline-block",
                                maxWidth: "100%",
                                height: "auto",
                                verticalAlign: "middle",
                            }}
                        />
                    ),

                    table: ({ children, ...props }) => (
                        <div style={{ overflowX: "auto", margin: "16px 0" }}>
                            <table
                                style={{
                                    borderCollapse: "collapse",
                                    width: "100%",
                                    fontSize: "14px",
                                }}
                                {...props}
                            >
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children, ...props }) => (
                        <th
                            style={{
                                border: "1px solid #d0d7de",
                                padding: "6px 13px",
                                backgroundColor: "#f6f8fa",
                                fontWeight: 600,
                                textAlign: "left",
                            }}
                            {...props}
                        >
                            {children}
                        </th>
                    ),
                    td: ({ children, ...props }) => (
                        <td
                            style={{
                                border: "1px solid #d0d7de",
                                padding: "6px 13px",
                            }}
                            {...props}
                        >
                            {children}
                        </td>
                    ),

                    code: ({ inline, className, children, ...props }) => {
                        if (inline) {
                            return (
                                <code
                                    style={{
                                        backgroundColor: "#f6f8fa",
                                        padding: "2px 5px",
                                        borderRadius: "4px",
                                        fontSize: "85%",
                                        fontFamily: "monospace",
                                        border: "1px solid #e1e4e8",
                                    }}
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <pre
                                style={{
                                    backgroundColor: "#f6f8fa",
                                    padding: "16px",
                                    borderRadius: "6px",
                                    overflow: "auto",
                                    fontSize: "85%",
                                    lineHeight: 1.45,
                                    border: "1px solid #e1e4e8",
                                    margin: "16px 0",
                                }}
                            >
                                <code
                                    style={{ fontFamily: "monospace", background: "none" }}
                                    className={className}
                                    {...props}
                                >
                                    {children}
                                </code>
                            </pre>
                        );
                    },

                    blockquote: ({ children, ...props }) => (
                        <blockquote
                            style={{
                                borderLeft: "4px solid #d0d7de",
                                color: "#57606a",
                                margin: "0 0 16px",
                                padding: "0 16px",
                            }}
                            {...props}
                        >
                            {children}
                        </blockquote>
                    ),

                    h1: ({ children, ...props }) => (
                        <h1
                            style={{
                                fontSize: "2em",
                                fontWeight: 600,
                                borderBottom: "1px solid #d0d7de",
                                paddingBottom: "0.3em",
                                marginBottom: "16px",
                            }}
                            {...props}
                        >
                            {children}
                        </h1>
                    ),
                    h2: ({ children, ...props }) => (
                        <h2
                            style={{
                                fontSize: "1.5em",
                                fontWeight: 600,
                                borderBottom: "1px solid #d0d7de",
                                paddingBottom: "0.3em",
                                marginBottom: "16px",
                            }}
                            {...props}
                        >
                            {children}
                        </h2>
                    ),
                    h3: ({ children, ...props }) => (
                        <h3
                            style={{ fontSize: "1.25em", fontWeight: 600, marginBottom: "16px" }}
                            {...props}
                        >
                            {children}
                        </h3>
                    ),

                    hr: () => (
                        <hr
                            style={{
                                border: "none",
                                borderTop: "1px solid #d0d7de",
                                margin: "24px 0",
                            }}
                        />
                    ),

                    a: ({ children, ...props }) => (
                        <a
                            style={{ color: "#0969da", textDecoration: "none" }}
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                        >
                            {children}
                        </a>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
