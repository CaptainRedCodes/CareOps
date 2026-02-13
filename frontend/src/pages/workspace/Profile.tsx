import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "motion/react";
import { Save, Lock, User as UserIcon, Mail, Shield, CalendarDays, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import api from "@/api/client";

export default function Profile() {
    const { user, setTokensAndFetchUser } = useAuth();

    // Profile edit state
    const [fullName, setFullName] = useState(user?.full_name || "");
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMsg, setProfileMsg] = useState("");

    // Password change state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMsg, setPwMsg] = useState("");
    const [pwError, setPwError] = useState("");

    const handleProfileUpdate = async (e: FormEvent) => {
        e.preventDefault();
        setProfileMsg("");
        setProfileLoading(true);
        try {
            await api.put("/auth/profile", { full_name: fullName });
            // Refresh user data
            const token = localStorage.getItem("access_token");
            if (token) await setTokensAndFetchUser(token, localStorage.getItem("refresh_token") || "");
            setProfileMsg("Profile updated successfully!");
        } catch (err: any) {
            setProfileMsg(err.response?.data?.detail || "Failed to update profile.");
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async (e: FormEvent) => {
        e.preventDefault();
        setPwMsg("");
        setPwError("");
        if (newPassword.length < 8) {
            setPwError("New password must be at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwError("Passwords do not match.");
            return;
        }
        setPwLoading(true);
        try {
            await api.put("/auth/change-password", {
                current_password: currentPassword,
                new_password: newPassword,
            });
            setPwMsg("Password changed successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setPwError(err.response?.data?.detail || "Failed to change password.");
        } finally {
            setPwLoading(false);
        }
    };

    const initials = user?.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-3xl px-6 py-10">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="editorial-heading text-3xl text-foreground sm:text-4xl">
                        Profile
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Manage your account settings and password.
                    </p>
                </motion.div>

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="mt-8 border-border/50 bg-surface-card">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 font-heading text-lg text-foreground">
                                <UserIcon className="h-5 w-5 text-brand" />
                                Account Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-6 flex items-center gap-5">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-xl font-bold text-brand ring-1 ring-brand/20">
                                    {initials}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">{user?.email}</span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-xs font-medium tracking-wider text-brand/70 uppercase">
                                            {user?.role}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Separator className="mb-6 bg-border/50" />

                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                        Full Name
                                    </Label>
                                    <div className="input-glow rounded-md transition-shadow">
                                        <Input
                                            id="fullName"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                            minLength={1}
                                            maxLength={150}
                                            className="h-11 border-border/50 bg-surface-elevated placeholder:text-muted-foreground/40 focus-visible:ring-brand/30"
                                        />
                                    </div>
                                </div>

                                {profileMsg && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-2 text-sm text-brand"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        {profileMsg}
                                    </motion.div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={profileLoading || fullName === user?.full_name}
                                    className="btn-glow h-10 gap-2 bg-brand font-semibold text-white hover:bg-brand-hover"
                                >
                                    {profileLoading ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Change Password Card */}
                {user?.auth_provider === "local" && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="mt-6 border-border/50 bg-surface-card">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 font-heading text-lg text-foreground">
                                    <Lock className="h-5 w-5 text-brand" />
                                    Change Password
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPw" className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Current Password
                                        </Label>
                                        <div className="input-glow rounded-md transition-shadow">
                                            <Input
                                                id="currentPw"
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                required
                                                className="h-11 border-border/50 bg-surface-elevated placeholder:text-muted-foreground/40 focus-visible:ring-brand/30"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="newPw" className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                New Password
                                            </Label>
                                            <div className="input-glow rounded-md transition-shadow">
                                                <Input
                                                    id="newPw"
                                                    type="password"
                                                    placeholder="Min. 8 characters"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    required
                                                    minLength={8}
                                                    className="h-11 border-border/50 bg-surface-elevated placeholder:text-muted-foreground/40 focus-visible:ring-brand/30"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPw" className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                Confirm New Password
                                            </Label>
                                            <div className="input-glow rounded-md transition-shadow">
                                                <Input
                                                    id="confirmPw"
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    className="h-11 border-border/50 bg-surface-elevated placeholder:text-muted-foreground/40 focus-visible:ring-brand/30"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {pwError && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-sm text-destructive"
                                        >
                                            {pwError}
                                        </motion.div>
                                    )}
                                    {pwMsg && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center gap-2 text-sm text-brand"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            {pwMsg}
                                        </motion.div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={pwLoading}
                                        className="btn-glow h-10 gap-2 bg-brand font-semibold text-white hover:bg-brand-hover"
                                    >
                                        {pwLoading ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        ) : (
                                            <>
                                                <Lock className="h-4 w-4" />
                                                Update Password
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
